import { registerSchema, loginSchema } from "../config/zod.js";
import redis from "../config/redis.js";
import TryCatch from "../middleware/TryCatch.js";
import sanitize from "mongo-sanitize";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import {
  getRegisterOtpHtml,
  getOtpHtml,
  getResetPasswordOtpHtml,
} from "../config/html.js";
import {
  generateACcessToken,
  generateToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../config/generateToken.js";

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const registerUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Validation failed";
    return res.status(400).json({ success: false, message: firstError });
  }

  const { name, email, password } = validation.data;

  const rateLimitKey = `register_rate_limit:${req.ip}:${email}`;
  if (await redis.get(rateLimitKey)) {
    return res
      .status(429)
      .json({ message: "Too many requests, try again later" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "An account with this email already exists" });
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const otp = crypto.randomInt(100000, 1000000).toString();

  const pendingKey = `pending_register:${email}`;
  await redis.setex(
    pendingKey,
    300,
    JSON.stringify({ name, email, password: hashPassword, otp })
  );

  const html = getRegisterOtpHtml({ email, otp });
  await sendMail({ email, subject: "Verify your account - OTP", html });

  await redis.set(rateLimitKey, "true", "EX", 60);

  res.json({
    message: "OTP sent to your email. Please verify to complete registration.",
  });
});

// ─── VERIFY REGISTRATION OTP ─────────────────────────────────────────────────
export const verifyRegisterOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const pendingKey = `pending_register:${email}`;
  const pendingDataJson = await redis.get(pendingKey);

  if (!pendingDataJson) {
    return res.status(400).json({
      message: "OTP has expired or is invalid. Please register again.",
    });
  }

  const pendingData = JSON.parse(pendingDataJson);

  if (pendingData.otp !== otp.toString()) {
    return res
      .status(400)
      .json({ message: "Incorrect OTP. Please try again." });
  }

  await redis.del(pendingKey);

  const existingUser = await User.findOne({ email: pendingData.email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "An account with this email already exists" });
  }

  const newUser = await User.create({
    name: pendingData.name,
    email: pendingData.email,
    password: pendingData.password,
  });

  const tokenData = await generateToken(newUser._id, res);

  res.status(201).json({
    message: `Welcome, ${newUser.name}! Your account has been created.`,
    user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    ...tokenData,
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const loginUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = loginSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Validation failed";
    return res.status(400).json({ message: firstError });
  }

  const { email, password } = validation.data;

  const rateLimitKey = `login_rate_limit:${req.ip}:${email}`;
  if (await redis.get(rateLimitKey)) {
    return res
      .status(429)
      .json({ message: "Too many requests, try again later" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    await redis.set(rateLimitKey, "true", "EX", 60);
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  await redis.setex(`otp:${email}`, 300, JSON.stringify(otp));

  const html = getOtpHtml({ email, otp });
  await sendMail({ email, subject: "Your login OTP", html });

  await redis.set(rateLimitKey, "true", "EX", 60);

  res.json({ message: "OTP sent to your email. Please check your inbox." });
});

// ─── VERIFY LOGIN OTP ─────────────────────────────────────────────────────────
export const verifyLoginOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const otpKey = `otp:${email}`;
  const storedOtpJson = await redis.get(otpKey);

  if (!storedOtpJson) {
    return res.status(400).json({ message: "OTP has expired or is invalid" });
  }

  const storedOtp = JSON.parse(storedOtpJson);

  if (storedOtp !== otp.toString()) {
    return res
      .status(400)
      .json({ message: "Incorrect OTP. Please try again." });
  }

  await redis.del(otpKey);

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const tokenData = await generateToken(user._id, res);

  res.status(200).json({
    message: `Welcome back, ${user.name}!`,
    user: { _id: user._id, name: user.name, email: user.email },
    ...tokenData,
  });
});

// ─── MY PROFILE ───────────────────────────────────────────────────────────────
export const MyProfile = TryCatch(async (req, res) => {
  res.json(req.user);
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateProfile = TryCatch(async (req, res) => {
  const { name, bio, github, linkedin, twitter, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  
  if (github !== undefined) user.socialLinks.github = github;
  if (linkedin !== undefined) user.socialLinks.linkedin = linkedin;
  if (twitter !== undefined) user.socialLinks.twitter = twitter;

  await user.save();
  
  // Update cache if exists
  await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));

  res.json({ message: "Profile updated successfully", user });
});

// ─── UPDATE SETTINGS ──────────────────────────────────────────────────────────
export const updateSettings = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Update nested settings object correctly for Mongoose detection
  const newSettings = { ...(user.settings?.toObject() || {}), ...req.body };
  user.set("settings", newSettings);
  
  await user.save();

  // Update Redis cache for 1 hour
  await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));

  res.json({ message: "Settings updated successfully", user });
});

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
export const deleteAccount = TryCatch(async (req, res) => {
  const userId = req.user._id;

  // 1. Delete all projects associated with the user
  await Project.deleteMany({ owner: userId });

  // 2. Delete the user
  await User.findByIdAndDelete(userId);

  // 3. Clear Redis cache
  await redis.del(`user:${userId}`);

  // 4. Logout (Clear cookies)
  res.cookie("accessToken", "", { maxAge: 0 });
  res.cookie("refreshToken", "", { maxAge: 0 });

  res.json({ message: "Account deleted successfully. We're sorry to see you go!" });
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
export const changePassword = TryCatch(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Compare old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect old password" });
  }

  // Hash and save new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Clear user cache to ensure security
  await redis.del(`user:${user._id}`);

  res.json({ message: "Password updated successfully" });
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const refreshToken = TryCatch(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Please login to get a new access token" });
  }

  const decoded = await verifyRefreshToken(token);
  if (!decoded) {
    return res.status(401).json({
      message: "Invalid or expired refresh token, please login again",
    });
  }

  generateACcessToken(decoded.id, res);

  res.status(200).json({ message: "Access token refreshed successfully" });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      message: "If this email is registered, a verification code has been sent.",
    });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `reset_password_otp:${email}`;
  
  await redis.setex(
    key,
    15 * 60,
    JSON.stringify({ id: user._id, email: user.email, otp })
  );

  const html = getResetPasswordOtpHtml({ email: user.email, otp });
  await sendMail({ email: user.email, subject: "Verify your password reset", html });

  res.json({
    message: "A verification code has been sent to your email.",
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = TryCatch(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res
      .status(400)
      .json({ message: "Email, OTP and new password are required." });
  }

  const passwordCheck = registerSchema.shape.password.safeParse(password);
  if (!passwordCheck.success) {
    return res.status(400).json({
      message:
        passwordCheck.error.issues[0]?.message || "Password is too weak",
    });
  }

  const key = `reset_password_otp:${email}`;
  const data = await redis.get(key);

  if (!data) {
    return res
      .status(400)
      .json({ message: "Verification code has expired or is invalid." });
  }

  const payload = JSON.parse(data);

  if (payload.otp !== otp.toString()) {
      return res.status(400).json({ message: "Incorrect verification code." });
  }
  const user = await User.findById(payload.id);

  if (!user) {
    await redis.del(key);
    return res.status(404).json({ message: "User not found." });
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  await revokeRefreshToken(user._id);
  await redis.del(key);

  res.json({
    message: "Password has been reset successfully. You can now login.",
  });
});

// ─── VERIFY RESET PASSWORD OTP ────────────────────────────────────────────────
export const verifyResetOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const key = `reset_password_otp:${email}`;
  const data = await redis.get(key);

  if (!data) {
    return res
      .status(400)
      .json({ message: "Verification code has expired or is invalid." });
  }

  const payload = JSON.parse(data);

  if (payload.otp !== otp.toString()) {
    return res.status(400).json({ message: "Incorrect verification code." });
  }

  res.json({ message: "Verification code verified successfully." });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user._id;

  await revokeRefreshToken(userId);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  await redis.del(`user:${userId}`);

  res.json({ message: "Logged out successfully" });
});
