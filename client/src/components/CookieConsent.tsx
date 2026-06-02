import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay to not overwhelm user immediately on load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">We value your privacy</h3>
                <p className="text-slate-500 text-sm max-w-2xl">
                  We use cookies to enhance your experience, analyze site usage, and ensure the security of your data in compliance with NDPC guidelines. By continuing to use SabiRight, you consent to our use of cookies.
                </p>
                <div className="flex gap-4 pt-2">
                  <Link href="/privacy">
                    <span className="text-xs text-primary hover:underline cursor-pointer font-medium">Privacy Policy</span>
                  </Link>
                  <Link href="/cookies">
                    <span className="text-xs text-primary hover:underline cursor-pointer font-medium">Cookie Policy</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-3 shrink-0">
              <Button onClick={accept} className="w-full md:w-auto font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
                Accept & Continue
              </Button>
              <Button onClick={() => setShow(false)} variant="ghost" size="icon" className="shrink-0 h-11 w-11 rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
