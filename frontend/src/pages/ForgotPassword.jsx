import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../main.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = React.useState("");
  const [btnLoading, setBtnLoading] = React.useState(false);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/forgot-password`,
        { email },
        { withCredentials: true }
      );
      toast.success(data.message);
      localStorage.setItem("resetEmail", email);
      navigate("/reset-password");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to process request");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neutral-950">
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-brand-purple/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow"></div>

      <div className="glass-card max-w-md w-full relative z-10 rounded-3xl p-10 animate-slide-up border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-3">Reset Password</h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Enter the email address associated with your account and we'll send you a 6-digit verification code to reset your password.
        </p>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              className="glass-input w-full rounded-xl py-3 px-4"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="btn-primary w-full py-3.5 rounded-xl disabled:opacity-50 text-lg font-medium tracking-wide flex justify-center items-center gap-2"
            disabled={btnLoading}
          >
            {btnLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : "Send OTP"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
            <button onClick={() => navigate("/login")} className="text-neutral-500 hover:text-white transition-colors">
              ← Back to Login
            </button>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
