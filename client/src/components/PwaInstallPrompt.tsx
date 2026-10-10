import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
  };

  if (installed || !installEvent) return null;

  return (
    <button
      type="button"
      onClick={install}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1000,
        border: 0,
        borderRadius: 999,
        padding: '12px 18px',
        background: '#0284c7',
        color: '#ffffff',
        font: '600 14px system-ui, sans-serif',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)',
        cursor: 'pointer'
      }}
    >
      Install SabiRight
    </button>
  );
}
