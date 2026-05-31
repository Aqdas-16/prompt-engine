import { LogOut, Zap, Mail } from "lucide-react";
import { useAuth } from "./FirebaseProvider";

interface FooterProps {
  onUpgrade: () => void;
}
export default function Footer({ onUpgrade }: FooterProps) {
  const { user, signOutUser } = useAuth();
  
  return (
    <footer
      className="
      w-full
      mt-16
      bg-white
      dark:bg-slate-950
      border-t
      border-slate-200
      dark:border-slate-800
      "
    >
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              PromptEngine
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Build better prompts. Faster. Smarter.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm">

            <a
              href="/blog"
              className="text-slate-600 hover:text-blue-600 transition"
            >
              Blog
            </a>

            <button
              onClick={() =>
                (window.location.href =
                  "mailto:cognixlabs.team@gmail.com")
              }
              className="text-slate-600 hover:text-blue-600 transition"
            >
              Contact
            </button>

            <button
              onClick={() =>
                window.open("/privacy.html", "_blank")
              }
              className="text-slate-600 hover:text-blue-600 transition"
            >
              Privacy
            </button>

            <button
              onClick={() =>
                window.open("/refund.html", "_blank")
              }
              className="text-slate-600 hover:text-blue-600 transition"
            >
              Refund
            </button>

            <button
              onClick={onUpgrade}
              className="text-slate-600 hover:text-purple-600 transition"
            >
              Upgrade
            </button>

            {user && (
              <button
                onClick={signOutUser}
                className="text-red-500 hover:text-red-600 transition"
              >
                Logout
              </button>
            )}

          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} PromptEngine. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}