import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      setIsOpen(false);
    };

    // Custom event to allow any page button to open this modal
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('open-pwa-install', handleOpenModal);

    // Check if user dismissed banner previously this session
    const dismissed = sessionStorage.getItem('sabiright_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('open-pwa-install', handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsOpen(false);
      }
      setInstallEvent(null);
    } else if (isIos) {
      setIsOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('sabiright_pwa_dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating Bottom Action Pill (Always accessible on Mobile & Desktop) */}
      {!isDismissed && !isOpen && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2"
        >
          <div className="flex items-center gap-2 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 p-1.5 pl-3 rounded-full shadow-2xl border border-slate-700/50 dark:border-slate-200 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-xs font-bold hover:text-blue-300 dark:hover:text-primary transition-colors pr-1 cursor-pointer"
            >
              <Smartphone className="h-4 w-4 text-blue-400 dark:text-primary" />
              <span>Install SabiRight App</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1 hover:bg-white/10 dark:hover:bg-slate-100 rounded-full text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss app banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* SabiRight PWA Install Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
            >
              {/* Header Bar with Brand & Close Button */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-1 flex items-center justify-center">
                    <img 
                      src="/assets/sabiright-icon.png" 
                      alt="SabiRight" 
                      className="h-8 w-8 object-contain rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/sabiright-icon-192.png";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                      SabiRight Citizen App
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Official Progressive Web App · Android, iOS & Desktop
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body Content & Features */}
              <div className="p-6 space-y-6">
                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30">
                    <Zap className="h-5 w-5 text-primary dark:text-blue-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instant Launch</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Fast load times with zero app store delays.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30">
                    <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Native Navigation</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Identical mobile UI, gestures & bottom navigation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/30">
                    <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400 mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">SabiGuard AI</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Instant legal assistance & verified lawyer directory.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30">
                    <Sparkles className="h-5 w-5 text-slate-700 dark:text-slate-300 mb-1.5" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Offline Ready</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Access cached rights & emergency hotlines offline.
                    </p>
                  </div>
                </div>

                {/* Instructions for iOS Safari vs 1-Click Install */}
                {isIos ? (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Share className="h-4 w-4 text-primary" />
                      <span>How to Install on iPhone & iPad:</span>
                    </div>
                    <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                      <li>
                        Tap the <span className="font-semibold text-primary">Share</span> icon in your Safari bottom menu
                      </li>
                      <li>
                        Scroll down and tap <span className="font-semibold text-primary">"Add to Home Screen"</span>
                      </li>
                      <li>
                        Tap <span className="font-semibold text-primary">Add</span> in the top right corner
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Button
                      onClick={handleInstallClick}
                      className="w-full h-12 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>{installEvent ? "Install SabiRight Now" : "Install App on Device"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <p className="text-[11px] text-slate-400">
                      Installed directly from your browser. Uses less than 5MB of storage.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Dismiss Button */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Maybe later, continue on web
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
