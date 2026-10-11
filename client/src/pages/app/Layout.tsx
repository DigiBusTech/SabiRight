import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, LayoutDashboard, Scale, Store, 
  Users, Settings, LogOut, Menu, X, ShieldCheck, 
  Zap, AlertTriangle, BadgeCheck, BarChart3, 
  CalendarCheck, Bell, Moon, Sun, PanelLeftClose, PanelLeftOpen,
  CreditCard, Sparkles, Shield, Compass, Radio, Plus, PanelLeft
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Navigation Groups (Gemini Refined Hierarchy)
  const navSections = [
    {
      title: "Core Services",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/app", badge: null },
        { icon: Scale, label: "Legal First Aid", href: "/app/civic", badge: "AI" },
        { icon: Store, label: "Legal Directory", href: "/app/marketplace", badge: null },
        { icon: CalendarCheck, label: "Bookings", href: "/app/bookings", badge: null },
        { icon: AlertTriangle, label: "Transit Radar", href: "/app/traffic", badge: "Live" },
      ]
    },
    {
      title: "Ecosystem",
      items: [
        { icon: Users, label: "Community Forum", href: "/app/forum", badge: null },
        { icon: CreditCard, label: "Plans & Quotas", href: "/app/plans", badge: null },
        { icon: BadgeCheck, label: "AI Credits", href: "/app/credits", badge: availableCredits !== null ? `${availableCredits}` : null },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: Bell, label: "Notifications", href: "/app/notifications", badge: null },
        { icon: Settings, label: "Settings", href: "/app/settings", badge: null },
      ]
    }
  ];

  if (profile?.isVendor) {
    navSections[0].items.push({
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
    if (location === '/app/civic') return "Legal First Aid AI Shield";
    if (location === '/app/traffic') return "Transit Route & Checkpoint Radar";
    if (location === '/app/marketplace') return "Accredited Legal Directory";
    if (location === '/app/bookings' || location === '/bookings' || location === '/app/history') return "Consultations & Bookings";
    if (location.startsWith('/app/bookings/') || location.startsWith('/bookings/')) return "Consultation Room";
    if (location === '/app/plans') return "Plans & Subscriptions";
    if (location === '/app/forum') return "SabiSquare Civic Community";
    if (location === '/app/credits') return "AI Credits & Quota";
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

      {/* Gemini-Style Professional Desktop & Mobile Drawer Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 h-screen bg-slate-950 text-white z-50 transition-all duration-300 flex flex-col border-r border-slate-800/80 shadow-[6px_0_24px_-6px_rgba(0,0,0,0.5)] select-none",
        isSidebarOpen ? "translate-x-0 w-68" : "-translate-x-full md:translate-x-0",
        !isSidebarOpen && (isCollapsed ? "md:w-18" : "md:w-64")
      )}>
        {/* Gemini-Style Sleek Header */}
        <div className={cn(
          "px-4 py-3.5 flex items-center border-b border-slate-800/60 bg-slate-950/95",
          isCollapsed && !isSidebarOpen ? "justify-center" : "justify-between"
        )}>
          {/* Logo & Brand (hidden when collapsed on desktop) */}
          {(!isCollapsed || isSidebarOpen) ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <Link href="/app" className="flex items-center gap-2.5 group">
                <div className="relative shrink-0">
                  <img 
                    src={siteLogo} 
                    alt="SabiRight" 
                    className="h-7 w-7 rounded-lg object-contain p-0.5 bg-slate-900 border border-slate-800 group-hover:border-primary/50 transition-colors" 
                    onError={(e) => { (e.target as HTMLImageElement).src = "/assets/sabiright-icon.png"; }} 
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </div>
                <div className="truncate">
                  <span className="font-extrabold text-sm tracking-tight block text-white leading-tight">
                    {getSetting('site_title') || "SabiRight"}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Citizen Cloud OS
                  </span>
                </div>
              </Link>
            </div>
          ) : null}

          {/* Desktop Toggle Button (Gemini top-left rail toggle) */}
          <div className="hidden md:flex items-center">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <PanelLeft className={cn("h-4.5 w-4.5 transition-transform duration-200", isCollapsed && "rotate-180")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14} className="bg-slate-900 text-white border border-slate-700 font-medium text-xs">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
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

        {/* Gemini "+ New Inquiry" Quick Action Pill Button */}
        <div className={cn("px-3 pt-3 pb-1", isCollapsed && !isSidebarOpen && "px-2")}>
          {(!isCollapsed || isSidebarOpen) ? (
            <Link href="/app/civic" onClick={() => setIsSidebarOpen(false)}>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-medium text-xs shadow-xs transition-all duration-150 group cursor-pointer">
                <div className="h-5 w-5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span className="truncate font-semibold">New Legal First Aid</span>
              </button>
            </Link>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/app/civic">
                  <button className="h-10 w-10 mx-auto rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-white hover:bg-blue-600 flex items-center justify-center shadow-xs transition-all hover:scale-105 cursor-pointer">
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14} className="bg-slate-900 text-white border border-slate-700 font-semibold text-xs shadow-xl">
                New Legal First Aid
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation Sections (Airy, clean Gemini hierarchy with mouse hover tooltips on collapsed) */}
        <nav className="flex-1 px-2.5 py-2 space-y-4 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-0.5">
              {(!isCollapsed || isSidebarOpen) && (
                <div className="px-3 pt-2 pb-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {sec.title}
                </div>
              )}

              {sec.items.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;

                const navItemElement = (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-150 group relative cursor-pointer",
                      isCollapsed && !isSidebarOpen 
                        ? "justify-center h-10 w-10 mx-auto" 
                        : "gap-2.5 px-3 py-2 text-xs font-medium",
                      isActive 
                        ? "bg-blue-600/15 text-blue-400 dark:text-blue-300 font-bold border-l-2 border-primary md:border-l-0" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110", 
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    )} />
                    
                    {(!isCollapsed || isSidebarOpen) && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {(!isCollapsed || isSidebarOpen) && item.badge && (
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.2 rounded-md font-bold tracking-tight shrink-0",
                        isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );

                // When collapsed: wrap in Radix Tooltip to display feature name on mouse hover
                if (isCollapsed && !isSidebarOpen) {
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        {navItemElement}
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        sideOffset={14} 
                        className="bg-slate-900 text-slate-100 border border-slate-700/80 shadow-2xl rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-2 z-50 pointer-events-none"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return navItemElement;
              })}
            </div>
          ))}
        </nav>

        {/* Gemini-Style Bottom Dock (Profile & Sign Out) */}
        <div className="p-2.5 border-t border-slate-800/60 bg-slate-950/95 space-y-1">
          {/* User Profile Card */}
          {(!isCollapsed || isSidebarOpen) ? (
            <Link href="/app/settings" onClick={() => setIsSidebarOpen(false)}>
              <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors group">
                <Avatar className="h-7 w-7 border border-blue-500/40 shadow-xs shrink-0">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="text-[10px] font-bold bg-blue-600 text-white">
                    {user?.displayName?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate text-slate-200 group-hover:text-blue-400 transition-colors">
                    {user?.displayName || "Citizen"}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    <Shield className="h-2.5 w-2.5 text-emerald-400" />
                    <span className="truncate">Verified Citizen</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleSignOut(); }}
                  title="Sign Out"
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href="/app/settings">
                    <div className="p-1 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors">
                      <Avatar className="h-7 w-7 border border-blue-500/40 shadow-xs">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="text-[10px] font-bold bg-blue-600 text-white">
                          {user?.displayName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={14} className="bg-slate-900 text-white border border-slate-700 font-medium text-xs">
                  {user?.displayName || "Citizen"} • Settings
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={14} className="bg-slate-900 text-rose-300 border border-slate-700 font-medium text-xs">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </div>
          )}
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
            { icon: Scale, label: "Legal AI", href: "/app/civic" },
            { icon: Store, label: "Directory", href: "/app/marketplace" },
            { icon: CalendarCheck, label: "Bookings", href: "/app/bookings" },
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
