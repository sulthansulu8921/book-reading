import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User, LogIn, UserPlus } from "lucide-react";
import api from "../services/api";

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (isLogin) {
                const res = await api.post("/login", { username, password });
                localStorage.setItem("token", res.data.access_token);
                localStorage.setItem("user_id", res.data.user_id);
                navigate("/chat");
            } else {
                await api.post("/register", { username, password });
                setIsLogin(true);
                setError("Registration successful. Please login.");
            }
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass w-full max-w-md rounded-2xl p-8"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                        <Lock size={28} className="text-primary-500" />
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">
                        {isLogin ? "Enter your credentials to access the secure channel." : "Register to join the secret network."}
                    </p>
                </div>

                {error && (
                    <div className={`p-3 rounded-lg mb-6 text-sm text-center ${error.includes('successful') ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-2.5 bg-dark-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow"
                                placeholder="Agent designation"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Passphrase</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full pl-10 pr-3 py-2.5 bg-dark-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-shadow"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900 transition-colors mt-2"
                    >
                        {isLogin ? (
                            <><LogIn size={18} /> Authenticate</>
                        ) : (
                            <><UserPlus size={18} /> Register</>
                        )}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-medium text-slate-400 hover:text-primary-400 transition-colors"
                    >
                        {isLogin ? "Don't have an access code? Apply here." : "Already have access? Authenticate."}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
