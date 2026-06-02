import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    localStorage.setItem('theme', 'light');

    // Update Favicon
    const updateFavicon = async () => {
      try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
          const settings = await res.json();
          const lightFav = settings.site_favicon;
          
          const faviconUrl = lightFav || "/favicon.png";
            
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = faviconUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = faviconUrl;
            document.head.appendChild(newLink);
          }
        }
      } catch (e) {
        console.error("Error updating favicon", e);
      }
    };
    updateFavicon();
  }, []);

  const toggleTheme = () => {
    // Light mode is forced
  };

  const setTheme = (newTheme: Theme) => {
    // Light mode is forced
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
