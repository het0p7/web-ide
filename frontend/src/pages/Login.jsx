import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { server } from "../main.jsx";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [btnLoading, setBtnLoading] = React.useState(false);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setBtnLoading(true);
        try {
            const { data } = await axios.post(
                `${server}/api/v1/login`,
                { email, password },
                { withCredentials: true }
            );
            toast.success(data.message);
            localStorage.setItem("email", email);
            navigate("/verify-otp");
        } catch (error) {
            const message = error?.response?.data?.message || "Login failed";
            toast.error(message);
        } finally {
            setBtnLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-1/3 -left-20 w-96 h-96 bg-brand-purple/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-brand-cyan/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
            
            <div className="glass-card max-w-7xl mx-auto flex flex-wrap items-center rounded-3xl overflow-hidden w-full lg:w-4/5 animate-slide-up relative z-10">
                <div className="lg:w-1/2 w-full p-12 lg:p-20 flex flex-col justify-center bg-neutral-950/40">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Welcome back
                    </h1>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        Sign in to synchronize your workspaces and access your personalized IDE right where you left off.
                    </p>
                </div>
                
                <form
                    onSubmit={submitHandler}
                    className="lg:w-1/2 w-full p-12 lg:p-20 relative before:hidden lg:before:block before:absolute before:inset-y-0 before:left-0 before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent"
                >
                    <h2 className="text-2xl font-semibold mb-8 text-white">Login to Sandbox</h2>

                    <div className="mb-6">
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

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-400">Password</label>
                            <Link to="/forgot-password" className="text-xs text-brand-cyan hover:text-brand-cyan/80 transition-colors">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            id="password"
                            className="glass-input w-full rounded-xl py-3 px-4"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        className="btn-primary w-full py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg flex justify-center items-center gap-2"
                        disabled={btnLoading}
                    >
                        {btnLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                Authenticating...
                            </>
                        ) : "Sign In"}
                    </button>
                    
                    <p className="text-center mt-6 text-sm text-neutral-500">
                        Don't have an account? <Link to="/register" className="text-white hover:text-brand-purple transition-colors font-medium">Create one</Link>
                    </p>
                </form>
            </div>
        </section>
    );
};

export default Login;