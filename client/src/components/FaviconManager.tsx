import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/context/ThemeContext';

export function FaviconManager() {
  const { theme } = useTheme();
  const animationFrameRef = useRef<number | null>(null);
  
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;

  useEffect(() => {
    const defaultIcon = '/assets/sabiright-icon.png';
    const lightFavicon = getSetting('favicon_light') || defaultIcon;
    const darkFavicon = getSetting('favicon_dark') || defaultIcon;
    const faviconUrl = theme === 'dark' ? darkFavicon : lightFavicon;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Helper to set favicon href
    const setFaviconHref = (url: string) => {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    };

    if (prefersReducedMotion) {
      setFaviconHref(faviconUrl);
      return;
    }

    // Create offscreen canvas for animated favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = faviconUrl;

    let startTime = Date.now();

    img.onload = () => {
      const render = () => {
        if (!ctx) return;
        const elapsed = (Date.now() - startTime) / 1000;
        
        // Clear canvas
        ctx.clearRect(0, 0, 32, 32);

        // Draw base shield icon
        ctx.drawImage(img, 2, 2, 28, 28);

        // Animated civic pulse indicator (top-right corner)
        const pulse = (Math.sin(elapsed * 3) + 1) / 2; // 0 to 1
        const radius = 3 + pulse * 2.5;
        const alpha = 0.8 - pulse * 0.6;

        // Outer glowing ripple ring
        ctx.beginPath();
        ctx.arc(26, 6, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner solid civic green dot
        ctx.beginPath();
        ctx.arc(26, 6, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        setFaviconHref(canvas.toDataURL('image/png'));
        
        // Loop every 250ms for low CPU usage while keeping smooth tab animation
        setTimeout(() => {
          animationFrameRef.current = requestAnimationFrame(render);
        }, 250);
      };

      render();
    };

    img.onerror = () => {
      setFaviconHref(faviconUrl);
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme, settings]);

  return null;
}

