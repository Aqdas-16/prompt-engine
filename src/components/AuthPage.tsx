import React, { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "./FirebaseProvider";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage({ onClose }: { onClose?: () => void }) {
  const [isLogin, setIsLogin] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { signInGoogle, signUpEmail, signInEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (isLogin) {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, firstName, lastName);
      }
      if (onClose) onClose();
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('Email already in use. Please log in instead.');
      } else if (err?.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please try again.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed');
      }
    }
  };

  const handleGoogle = async () => {
    setErrorMsg("");
    try {
      await signInGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google authentication failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[720px] grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-[#0b0f1a]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl z-10 transition-colors"
        >
          ✕
        </button>

        {/* LEFT PANEL */}
        <div className="hidden md:flex p-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white flex-col justify-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to PromptEngine</h2>
            <p className="text-sm mt-3 opacity-90 leading-relaxed max-w-xs">
              Transform ideas into powerful prompts with AI. Create, test, and save your best concepts.
            </p>
          </div>
        </div>

          {/* RIGHT PANEL */}
        <div className="p-6 md:p-8 flex flex-col justify-center bg-white dark:bg-[#0b0f1a] relative">
          <div className="text-center mb-5">
            <img 
              src="/logo.png" 
              alt="Prompt Engine"
              loading="lazy"
              className="h-[60px] mx-auto object-contain" 
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isLogin ? "New to PromptEngine? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-500 hover:text-blue-600 hover:underline transition-all">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <div className="p-3 mb-4 text-sm text-red-500 bg-red-100/50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                {errorMsg}
              </div>
            )}
            {!isLogin && (
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="First name" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  className="w-1/2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent dark:border-white/5" 
                  required={!isLogin}
                />
                <input 
                  type="text" 
                  placeholder="Last name" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="w-1/2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent dark:border-white/5" 
                  required={!isLogin}
                />
              </div>
            )}
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent dark:border-white/5" 
              required 
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent dark:border-white/5 pr-10" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2.5 mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 hover:shadow-md transition-all active:scale-[0.98]"
            >
              {isLogin ? "Log in" : "Create account"}
            </button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-[#0b0f1a] text-gray-400 uppercase tracking-widest font-medium">Or</span>
            </div>
          </div>

          <button 
            onClick={handleGoogle} 
            className="w-full py-2.5 flex items-center justify-center gap-3 rounded-lg bg-white dark:bg-transparent text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-medium active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
