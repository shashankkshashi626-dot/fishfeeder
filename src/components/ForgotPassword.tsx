import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "./AuthContext";
import { Mail, Loader2, ArrowLeft, Send, Fish } from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      await resetPassword(email);
      setSuccessMsg("Check your inbox! We sent password reset instructions.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to trigger password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl relative"
      >
        {/* Back Link */}
        <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Fish className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black mt-4 bg-gradient-to-r from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-xs text-slate-400 mt-1 text-center max-w-xs leading-normal">
            Enter your email address and we'll send instructions to reset your password.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
          >
            ✓ {successMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950/60 border border-white/10 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder:text-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Send Instructions <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
