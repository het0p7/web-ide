import express from "express";
import {
  registerUser,
  verifyRegisterOtp,
  loginUser,
  verifyLoginOtp,
  MyProfile,
  updateProfile,
  updateSettings,
  refreshToken,
  logoutUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  deleteAccount,
  changePassword,
} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-register", verifyRegisterOtp);
router.post("/login", loginUser);
router.post("/verify", verifyLoginOtp);
router.get("/me", isAuth, MyProfile);
router.put("/profile", isAuth, updateProfile);
router.put("/settings", isAuth, updateSettings);
router.post("/refresh", refreshToken);
router.post("/logout", isAuth, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.delete("/account", isAuth, deleteAccount);
router.put("/change-password", isAuth, changePassword);

export default router;
