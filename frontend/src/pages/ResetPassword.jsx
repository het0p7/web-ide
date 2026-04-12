import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../main.jsx";

const passwordRules = [
  { test: (p) => p.length >= 8,         label: "8+ chars" },
  { test: (p) => /[A-Z]/.test(p),       label: "Uppercase" },
  { test: (p) => /[a-z]/.test(p),       label: "Lowercase" },
  { test: (p) => /[0-9]/.test(p),       label: "Number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "Special char" },
];

const ResetPassword = () => {
  const [step, setStep] = React.useState("otp"); // 'otp' or 'password'
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();
  const resetEmail = localStorage.getItem("resetEmail");

  const allRulesPassed = passwordRules.every((r) => r.test(password));

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Session expired. Please request a new code.");
      navigate("/forgot-password");
      return;
    }
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/verify-reset-otp`,
        { email: resetEmail, otp },
        { withCredentials: true }
      );
      toast.success(data.message);
      setStep("password");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification failed");
    } finally {
      setBtnLoading(false);
    }
  };

  const resetPasswordHandler = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) {
      toast.error("Please meet all password requirements");
      return;
    }
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/reset-password`,
        { email: resetEmail, otp, password },
        { withCredentials: true }
      );
      toast.success(data.message);
      localStorage.removeItem("resetEmail");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neutral-950">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow"></div>

      <div className="glass-card max-w-md w-full relative z-10 rounded-3xl p-10 animate-slide-up border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">
            {step === "otp" ? "Verify Code" : "New Password"}
        </h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            {step === "otp" 
                ? `Enter the 6-digit verification code sent to ${resetEmail}` 
                : "Create a secure new password for your account."}
        </p>

        {step === "otp" ? (
            <form onSubmit={verifyOtpHandler} className="space-y-6">
                <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-neutral-400 mb-2">Verification Code</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        id="otp"
                        className="glass-input w-full rounded-xl py-3 px-4 text-center text-3xl font-bold tracking-[0.5em]"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <button
                    className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-50 text-lg font-semibold flex justify-center items-center gap-2 mt-4"
                    disabled={btnLoading || otp.length < 6}
                >
                    {btnLoading ? (
                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : "Verify Code"}
                </button>
            </form>
        ) : (
            <form onSubmit={resetPasswordHandler} className="space-y-6">
                <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-2">New Password</label>
                    <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        className="glass-input w-full rounded-xl py-3 px-4 pr-12"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                        title="Toggle password visibility"
                    >
                        {showPassword ? "HIDE" : "SHOW"}
                    </button>
                    </div>
                </div>

                {password.length > 0 && (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-wrap gap-2 animate-fade-in mt-4">
                        {passwordRules.map((rule) => {
                            const passed = rule.test(password);
                            return (
                                <span
                                    key={rule.label}
                                    className={`text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                                        passed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${passed ? "bg-emerald-400" : "bg-neutral-600"}`}></div>
                                    {rule.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                <button
                    className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-50 text-lg font-medium tracking-wide flex justify-center items-center gap-2 mt-4"
                    disabled={btnLoading || (!allRulesPassed && password.length > 0)}
                >
                    {btnLoading ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : "Update Password"}
                </button>
            </form>
        )}

        <div className="mt-8 text-center text-sm">
            <button 
                onClick={() => {
                    if (step === "password") setStep("otp");
                    else navigate("/forgot-password");
                }} 
                className="text-neutral-500 hover:text-white transition-colors"
            >
              ← {step === "password" ? "Back to OTP" : "Change Email"}
            </button>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
