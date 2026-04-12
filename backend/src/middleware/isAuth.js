import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import { User } from "../models/User.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Please Login -no token",
      });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedData) {
      return res.status(400).json({
        message: "token expired",
      });
    }

    const cacheUser = await redis.get(`user:${decodedData.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
