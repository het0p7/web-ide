import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../main.jsx";
import { AppData } from "../context/AppContext.jsx";

const VerifyOtp = () => {
  const [otp, setOtp] = React.useState("");
  const [btnLoading, setBtnLoading] = React.useState(false);
  
  const navigate = useNavigate();
  const { login } = AppData();
  const email = localStorage.getItem("email") || "your email";

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/verify`,
        { email, otp },
        { withCredentials: true }
      );
      toast.success(data.message);
      await login();
      localStorage.removeItem("email");
      navigate("/dashboard");
    } catch (error) {
      const message = error?.response?.data?.message || "Verification failed";
      toast.error(message);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neutral-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-cyan/20 rounded-full mix-blend-screen filter blur-[150px] animate-pulse-slow"></div>
        
        <div className="glass-card max-w-md w-full relative z-10 rounded-3xl p-10 animate-slide-up border border-white/10 shadow-2xl shadow-brand-cyan/10">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6 text-brand-cyan">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Security Check</h2>
            <p className="text-neutral-400 text-sm">We sent a verification code to<br/><span className="text-white font-medium">{email}</span></p>
          </div>

          <form onSubmit={submitHandler} className="space-y-6">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                id="otp"
                name="otp"
                className="glass-input w-full rounded-2xl py-5 px-4 text-center text-4xl tracking-widest font-bold text-white transition-all bg-black/40"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="••••••"
                autoFocus
              />
            </div>
            
            <button
              className="btn-primary w-full py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold flex justify-center items-center gap-2 mt-4"
              disabled={btnLoading || otp.length < 6}
            >
              {btnLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Verifying...
                </>
              ) : "Authenticate"}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm">
            <button onClick={() => navigate("/login")} className="text-neutral-500 hover:text-white transition-colors">
              ← Return to Login
            </button>
          </div>
        </div>
    </section>
  );
};

export default VerifyOtp;