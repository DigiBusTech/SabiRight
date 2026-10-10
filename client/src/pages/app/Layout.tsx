import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, LayoutDashboard, Scale, Store, 
  Users, Settings, LogOut, Menu, X, ShieldCheck, 
  Zap, AlertTriangle, BadgeCheck, BarChart3, Wallet, 
  CalendarCheck, Bell, Moon, Sun, PanelLeftClose, PanelLeftOpen,
  CreditCard, Sparkles, Shield, Compass, Radio
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTheme } from "@/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: creditsData } = useQuery({
    queryKey: [`credits-layout-${user?.uid}`],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/credits/${user.uid}/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? res.json() : null;
    },
    enabled: !!user?.uid,
    refetchInterval: 60000,
  });

  const availableCredits = creditsData ? (creditsData.availableCredits ?? Math.max(0, (creditsData.totalCredits || 0) - (creditsData.usedCredits || 0))) : null;

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;
  
  const siteLogo = theme === 'dark' 
    ? (getSetting('site_logo_dark') || getSetting('site_logo') || "/assets/sabiright-icon.png")
    : (getSetting('site_logo') || "/assets/sabiright-icon.png");

  const publicRoutes = ['/app/forum'];
  const isPublicRoute = publicRoutes.includes(location);

  if (!loading && !user && !isPublicRoute) {
    setTimeout(() => setLocation("/auth/login"), 0);
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (!user && isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white flex flex-col">
        <Navbar /><div className="flex-1 pt-24 pb-12">{children}</div><Footer />
      </div>
    );
  }

  // Navigation Groups
  const navSections = [
    {
      title: "Core Intelligence",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/app", badge: null },
        { icon: Scale, label: "SabiRight AI", href: "/app/civic", badge: "AI" },
        { icon: AlertTriangle, label: "Sabi Move", href: "/app/traffic", badge: "Live" },
      ]
    },
    {
      title: "Services & Access",
      items: [
        { icon: Store, label: "Legal Directory", href: "/app/marketplace", badge: null },
        { icon: CalendarCheck, label: "Bookings", href: "/app/bookings", badge: null },
        { icon: CreditCard, label: "Plans & Quotas", href: "/app/plans", badge: null },
      ]
    },
    {
      title: "Ecosystem & Wallet",
      items: [
        { icon: Users, label: "Community Forum", href: "/app/forum", badge: null },
        { icon: BadgeCheck, label: "AI Credits", href: "/app/credits", badge: availableCredits !== null ? `${availableCredits}` : null },
        { icon: Wallet, label: "Sovereign Wallet", href: "/app/wallet", badge: null },
      ]
    },
    {
      title: "Account & Preferences",
      items: [
        { icon: Bell, label: "Notifications", href: "/app/notifications", badge: null },
        { icon: Settings, label: "Settings", href: "/app/settings", badge: null },
      ]
    }
  ];

  if (profile?.isVendor) {
    navSections[1].items.push({
      icon: BarChart3,
      label: "Professional Hub",
      href: "/app/professional-dashboard",
      badge: "Pro"
    });
  }

  if (profile?.isAdmin) {
    navSections.unshift({
      title: "Administration",
      items: [
        { icon: ShieldCheck, label: "Admin Console", href: "/admin", badge: "Root" }
      ]
    });
  }

  const getPageTitle = () => {
    if (location === '/app') return "Citizen Overview";
    if (location === '/app/civic') return "SabiRight AI Civic Shield";
    if (location === '/app/traffic') return "SabiMove Route & Traffic Shield";
    if (location === '/app/marketplace') return "Accredited Legal Directory";
    if (location === '/app/bookings') return "Consultations & Bookings";
    if (location === '/app/plans') return "Plans & Subscriptions";
    if (location === '/app/forum') return "SabiSquare Community";
    if (location === '/app/credits') return "AI Credits & Quota";
    if (location === '/app/wallet') return "Sovereign Citizen Wallet";
    if (location === '/app/settings') return "Account & Security Settings";
    if (location === '/app/notifications') return "Notification Dispatch Center";
    if (location === '/admin') return "Platform Administration";
    return location.split('/').pop()?.replace('-', ' ') || "Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 selection:bg-primary selection:text-white">
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Flagship Desktop & Mobile Drawer Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 h-screen bg-slate-950 text-white z-50 transition-all duration-300 flex flex-col border-r border-slate-800/80 shadow-[10px_0_35px_-10px_rgba(0,0,0,0.6)]",
        isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0",
        !isSidebarOpen && (isCollapsed ? "md:w-20" : "md:w-68")
      )}>
        {/* Brand Header */}
        <div className={cn(
          "p-5 flex items-center border-b border-slate-800/80 bg-slate-950/90 relative",
          isCollapsed && !isSidebarOpen ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={siteLogo} 
                alt="SabiRight" 
                className="h-8 w-8 rounded-xl object-contain ring-1 ring-white/20 p-0.5 bg-slate-900 shadow-md" 
                onError={(e) => { (e.target as HTMLImageElement).src = "/assets/sabiright-icon.png"; }} 
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
            </div>
            {(!isCollapsed || isSidebarOpen) && (
              <div>
                <span className="font-extrabold text-base tracking-tight block text-white leading-tight">
                  {getSetting('site_title') || "SabiRight"}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  Citizen Cloud OS
                </span>
              </div>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3.5 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {(!isCollapsed || isSidebarOpen) && (
                <div className="px-3 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-200 group relative",
                      isCollapsed && !isSidebarOpen ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5 text-xs font-medium",
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_4px_16px_rgba(37,99,235,0.35)] border-t border-white/20" 
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                    
                    {(!isCollapsed || isSidebarOpen) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {(!isCollapsed || isSidebarOpen) && item.badge && (
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.2 rounded-md font-bold tracking-tight",
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                      )}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on collapsed desktop view */}
                    {isCollapsed && !isSidebarOpen && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Controls & User Passport Dock */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-3 bg-slate-950/90">
          {/* Collapse Sidebar Button (Desktop Only) */}
          <Button 
            variant="ghost" 
            className="w-full justify-center hidden md:flex h-8 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : (
              <span className="flex items-center gap-2">
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-[11px] font-mono">Collapse</span>
              </span>
            )}
          </Button>

          {/* User Status Card */}
          <Link href="/app/settings">
            <div className={cn(
              "bg-gradient-to-br from-slate-900 to-slate-900/80 rounded-xl p-2.5 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md group",
              isCollapsed && !isSidebarOpen ? "p-1.5" : ""
            )}>
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-blue-500/50 shadow-sm shrink-0">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="text-[10px] font-bold bg-blue-600 text-white">
                    {user?.displayName?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>

                {(!isCollapsed || isSidebarOpen) && (
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-slate-100 group-hover:text-blue-400 transition-colors">
                      {user?.displayName || "Citizen"}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <Shield className="h-3 w-3 text-emerald-400" />
                      <span className="truncate">Verified Citizen</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Sign Out Button */}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-2.5 h-9 rounded-xl transition-colors text-xs font-semibold", 
              isCollapsed && !isSidebarOpen ? "justify-center px-0" : "justify-start px-3"
            )} 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || isSidebarOpen) && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Flagship Top Navigation Bar */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          {/* Left: Mobile Drawer Trigger & Page Context */}
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  {getPageTitle()}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-[10px] font-mono font-bold text-primary dark:text-blue-400">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                  N-ATLAS
                </span>
              </div>
            </div>
          </div>

          {/* Right: Credits, SOS Trigger, Theme Toggle, Notification Bell */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Credit Pill */}
            <Link href="/app/credits">
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-xs font-bold shadow-xs cursor-pointer">
                <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                <span>{availableCredits !== null ? `${availableCredits} Credits` : "Credits"}</span>
              </button>
            </Link>

            {/* Quick Emergency / Legal First-Aid Pill */}
            <Link href="/app/civic">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8.5 px-2.5 sm:px-3 text-xs font-bold rounded-xl border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-primary dark:text-blue-300 hover:bg-blue-100 hover:text-primary transition-all flex items-center gap-1.5"
              >
                <Scale className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                <span className="hidden xs:inline">Legal Shield</span>
              </Button>
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />
          </div>
        </header>

        {/* Scrollable Dashboard Workspace Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 pb-20 md:pb-6">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Flagship Mobile & PWA Native Bottom Navigation Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 z-40 px-2 py-1.5 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          {[
            { icon: LayoutDashboard, label: "Home", href: "/app" },
            { icon: Scale, label: "Civic AI", href: "/app/civic" },
            { icon: Store, label: "Directory", href: "/app/marketplace" },
            { icon: AlertTriangle, label: "Traffic", href: "/app/traffic" },
            { icon: Settings, label: "Settings", href: "/app/settings" },
          ].map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="flex-1 py-1 flex flex-col items-center justify-center text-center relative group"
              >
                <div className={cn(
                  "px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center",
                  isActive ? "bg-primary/10 dark:bg-blue-500/15" : "group-hover:bg-slate-100 dark:group-hover:bg-slate-900"
                )}>
                  <Icon className={cn(
                    "h-4.5 w-4.5 transition-colors", 
                    isActive ? "text-primary dark:text-blue-400 scale-105" : "text-slate-500 dark:text-slate-400"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold mt-0.5 transition-colors tracking-tight", 
                  isActive ? "text-primary dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
