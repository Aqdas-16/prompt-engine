import { LogOut, Zap, Mail } from "lucide-react";
import { useAuth } from "./FirebaseProvider";

interface FooterProps {
  onUpgrade: () => void;
}

export default function Footer({ onUpgrade }: FooterProps) {
  const { user, signOutUser } = useAuth();

  return (
    <footer className="w-full mt-8 bg-white/80 dark:bg-gradient-to-b dark:from-[#0f172a] dark:to-[#020617] backdrop-blur-md border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-gray-900 dark:text-white font-semibold text-lg tracking-wide transition-colors duration-300">PromptEngine</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">Build better prompts. Faster. Smarter.</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => window.location.href = "mailto:cognixlabs.team@gmail.com"} 
            className="px-4 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            Contact
          </button>
          <button
            onClick={() => window.open('/privacy.html', '_blank')}
            className="px-4 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            Privacy
          </button>

          <button
            onClick={() => window.open('/refund.html', '_blank')}
            className="px-4 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:border-purple-400 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-all duration-200"
          >
            Refund
          </button>
          <button 
            onClick={onUpgrade} 
            className="px-4 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:border-purple-400 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-all duration-200"
          >
            
            Upgrade
          </button>
          {user && (
            <button 
              onClick={signOutUser} 
              className="px-4 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:border-red-400 dark:hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-500 pb-6 transition-colors duration-300">
        © {new Date().getFullYear()} PromptEngine. All rights reserved.
      </div>
    </footer>
  );
}
