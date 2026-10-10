import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface AppStoreButtonsProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'dark' | 'glass';
}

export function AppStoreButtons({ className = '', size = 'default', variant = 'dark' }: AppStoreButtonsProps) {
  const { data: settings = {} } = useQuery<Record<string, string | undefined>>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public');
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 30000,
  });

  const appStoreUrl = settings.app_store_url?.trim();
  const playStoreUrl = settings.play_store_url?.trim();

  const handleStoreClick = (url: string | undefined, platform: 'ios' | 'android') => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Trigger PWA installation modal seamlessly
      window.dispatchEvent(new CustomEvent('open-pwa-install', { detail: { platform } }));
    }
  };

  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-3 py-1.5' : 'px-4 py-2.5';
  const bgClass = variant === 'glass' 
    ? 'bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 shadow-lg backdrop-blur-md'
    : 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white shadow-md hover:shadow-xl';

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Apple App Store Button */}
      <button
        type="button"
        onClick={() => handleStoreClick(appStoreUrl, 'ios')}
        className={`group inline-flex items-center gap-3 rounded-2xl ${padding} ${bgClass} transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`}
        title={appStoreUrl ? "Download on Apple App Store" : "Install SabiRight App for iOS / Web"}
      >
        <svg 
          className={`${isSmall ? 'w-5 h-5' : 'w-6 h-6'} fill-current text-white shrink-0 group-hover:scale-105 transition-transform`} 
          viewBox="0 0 24 24"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.67-.82 1.13-1.96 1-3.1-.98.04-2.17.65-2.87 1.47-.61.71-1.15 1.87-1.01 2.98 1.1.09 2.22-.53 2.88-1.35z"/>
        </svg>
        <div className="text-left leading-none">
          <span className="text-[9px] uppercase font-semibold text-slate-400 block tracking-tight">
            Download on the
          </span>
          <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-black tracking-tight text-white block mt-0.5`}>
            App Store
          </span>
        </div>
      </button>

      {/* Google Play Store Button */}
      <button
        type="button"
        onClick={() => handleStoreClick(playStoreUrl, 'android')}
        className={`group inline-flex items-center gap-3 rounded-2xl ${padding} ${bgClass} transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`}
        title={playStoreUrl ? "Get it on Google Play Store" : "Install SabiRight App for Android / Web"}
      >
        <svg 
          className={`${isSmall ? 'w-5 h-5' : 'w-6 h-6'} shrink-0 group-hover:scale-105 transition-transform`} 
          viewBox="0 0 24 24"
        >
          <path fill="#4285F4" d="M3.609 1.814L13.793 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.419V3.233c0-.53.22-1.04.609-1.419z"/>
          <path fill="#34A853" d="M15.214 13.42l2.36 2.36-11.442 6.505 9.082-8.865z"/>
          <path fill="#FBBC04" d="M15.214 10.58L6.132 1.715l11.442 6.505-2.36 2.36z"/>
          <path fill="#EA4335" d="M17.574 11.94l3.498 1.988a1.5 1.5 0 0 1 0 2.624l-3.5 1.988-2.358-2.36 2.36-4.24z"/>
        </svg>
        <div className="text-left leading-none">
          <span className="text-[9px] uppercase font-semibold text-slate-400 block tracking-tight">
            GET IT ON
          </span>
          <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-black tracking-tight text-white block mt-0.5`}>
            Google Play
          </span>
        </div>
      </button>
    </div>
  );
}

