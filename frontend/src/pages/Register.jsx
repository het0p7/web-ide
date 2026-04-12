import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../main.jsx";
import { AppData } from "../context/AppContext.jsx";

const passwordRules = [
    { test: (p) => p.length >= 8,         label: "8+ chars" },
    { test: (p) => /[A-Z]/.test(p),       label: "Uppercase" },
    { test: (p) => /[a-z]/.test(p),       label: "Lowercase" },
    { test: (p) => /[0-9]/.test(p),       label: "Number" },
    { test: (p) => /[^A-Za-z0-9]/.test(p), label: "Special char" },
];

const Register = () => {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [step, setStep] = React.useState("form");
    const [btnLoading, setBtnLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const navigate = useNavigate();
    const { login } = AppData();

    const allRulesPassed = passwordRules.every((r) => r.test(password));

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!allRulesPassed) {
            toast.error("Please meet all password requirements");
            return;
        }
        setBtnLoading(true);
        try {
            const { data } = await axios.post(
                `${server}/api/v1/register`,
                { name, email, password },
                { withCredentials: true }
            );
            toast.success(data.message);
            setStep("otp");
        } catch (error) {
            const message = error?.response?.data?.message || "Registration failed";
            toast.error(message);
        } finally {
            setBtnLoading(false);
        }
    };

    const otpHandler = async (e) => {
        e.preventDefault();
        setBtnLoading(true);
        try {
            const { data } = await axios.post(
                `${server}/api/v1/verify-register`,
                { email, otp },
                { withCredentials: true }
            );
            toast.success(data.message);
            await login();
            navigate("/dashboard");
        } catch (error) {
            const message = error?.response?.data?.message || "OTP verification failed";
            toast.error(message);
        } finally {
            setBtnLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-brand-cyan/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-brand-purple/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" style={{ animationDelay: "1.5s" }}></div>
            
            <div className="glass-card max-w-7xl mx-auto flex flex-wrap items-center rounded-3xl overflow-hidden w-full lg:w-4/5 animate-slide-up relative z-10">
                <div className="lg:w-1/2 w-full p-12 lg:p-20 flex flex-col justify-center bg-neutral-950/40 relative">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-cyan to-white">
                        {step === "form" ? "Join the Future" : "Check Your Inbox"}
                    </h1>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        {step === "form"
                            ? "Setup your workspace and collaborate on code seamlessly with ultra-fast cloud environments."
                            : `We sent a highly-secure 6-digit access code to ${email}.`}
                    </p>
                </div>
                
                {step === "form" ? (
                    <form
                        onSubmit={submitHandler}
                        className="lg:w-1/2 w-full p-10 lg:p-16 relative before:hidden lg:before:block before:absolute before:inset-y-0 before:left-0 before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent"
                    >
                        <h2 className="text-2xl font-semibold mb-6 text-white">Create Account</h2>

                        <div className="space-y-5 mb-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-neutral-400 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="glass-input w-full rounded-xl py-2.5 px-4"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="glass-input w-full rounded-xl py-2.5 px-4"
                                    placeholder="jane@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        className="glass-input w-full rounded-xl py-2.5 px-4 pr-12"
                                        placeholder="Secure password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors p-1"
                                    >
                                        {showPassword ? "HIDE" : "SHOW"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {password.length > 0 && (
                            <div className="mb-6 p-4 rounded-xl bg-black/20 border border-white/5 flex flex-wrap gap-2 animate-fade-in">
                                {passwordRules.map((rule) => {
                                    const passed = rule.test(password);
                                    return (
                                        <span
                                            key={rule.label}
                                            className={`text-[11px] font-medium px-2 py-1 rounded w-fit flex items-center gap-1.5 transition-colors ${
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
                            className="btn-primary w-full py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium tracking-wide flex justify-center items-center gap-2 mt-2"
                            disabled={btnLoading || !allRulesPassed}
                        >
                            {btnLoading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    Processing...
                                </>
                            ) : "Create Workspace"}
                        </button>
                        
                        <p className="text-center mt-6 text-sm text-neutral-500">
                            Already have an account? <Link to="/login" className="text-white hover:text-brand-cyan transition-colors font-medium">Sign in</Link>
                        </p>
                    </form>
                ) : (
                    <form
                        onSubmit={otpHandler}
                        className="lg:w-1/2 w-full p-12 lg:p-20 relative before:hidden lg:before:block before:absolute before:inset-y-0 before:left-0 before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent flex flex-col justify-center"
                    >
                        <h2 className="text-2xl font-semibold mb-8 text-white text-center">Verify Access</h2>
                        
                        <div className="mb-8">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                id="otp"
                                className="glass-input w-full rounded-2xl py-6 px-4 text-center text-4xl tracking-[0.5em] font-bold"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                                placeholder="000000"
                            />
                        </div>
                        
                        <button
                            className="btn-primary w-full py-3.5 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold flex justify-center items-center gap-2"
                            disabled={btnLoading || otp.length < 6}
                        >
                            {btnLoading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    Verifying...
                                </>
                            ) : "Secure Login"}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setStep("form")}
                            className="block text-sm text-neutral-500 mt-6 text-center w-full hover:text-white transition-colors"
                        >
                            ← Use a different email
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

export default Register;