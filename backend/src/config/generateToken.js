import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

/**
 * Generates Access and Refresh tokens, stores the Refresh token in Redis,
 * and sets them as HTTP-only cookies.
 */
export const generateToken = async (id, res) => {
  const ACCESS_TOKEN_EXPIRY = "4h";
  const REFRESH_TOKEN_EXPIRY_DAYS = 7;
  const ACCESS_TOKEN_MS = 4 * 60 * 60 * 1000;
  const REFRESH_DAYS_IN_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  const REFRESH_DAYS_IN_MS = REFRESH_DAYS_IN_SECONDS * 1000;

  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  // Store refresh token in Redis (ioredis: setex key seconds value)
  const refreshTokenKey = `refresh_token:${id}`;
  await redis.setex(refreshTokenKey, REFRESH_DAYS_IN_SECONDS, refreshToken);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_DAYS_IN_MS,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const storedToken = await redis.get(`refresh_token:${decode.id}`);

    if (storedToken === refreshToken) {
      return decode;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateACcessToken = (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "4h",
  });
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 4 * 60 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (id) => {
  await redis.del(`refresh_token:${id}`);
};
