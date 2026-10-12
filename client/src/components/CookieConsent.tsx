import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cookie, X, Check } from "lucide-react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie-consent");
      if (!consent) {
        // Subtle delay to avoid intrusive instant popup
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable or blocked
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("cookie-consent", "all");
      localStorage.setItem("cookie-consent-timestamp", new Date().toISOString());
    } catch {
      // ignore
    }
    setShow(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem("cookie-consent", "essential");
      localStorage.setItem("cookie-consent-timestamp", new Date().toISOString());
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-[999] p-3 sm:p-5 pointer-events-none"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              
              {/* Content Block */}
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 text-primary mt-0.5">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      Privacy & Cookie Choices
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                      <ShieldCheck className="h-3 w-3" /> NDPA 2023 Compliant
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    SabiRight uses essential cookies and local browser storage to keep you authenticated, preserve your preferred dialect, and cache statutory emergency guidance offline. We respect your constitutional right to privacy.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <Link href="/cookies">
                      <span className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline cursor-pointer">
                        Cookie Policy
                      </span>
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <Link href="/privacy">
                      <span className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline cursor-pointer">
                        Privacy Policy
                      </span>
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <Link href="/terms">
                      <span className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium underline-offset-4 hover:underline cursor-pointer">
                        Terms of Service
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0">
                <Button
                  onClick={handleAcceptEssential}
                  variant="outline"
                  size="sm"
                  className="flex-1 md:flex-initial h-9 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Essential Only
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="flex-1 md:flex-initial h-9 px-5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/25"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Accept All
                </Button>
                <Button
                  onClick={handleAcceptEssential}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
