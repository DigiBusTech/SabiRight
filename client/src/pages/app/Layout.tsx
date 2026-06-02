import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, ChevronRight, LayoutDashboard, Scale, Store, 
  Briefcase, Users, Settings, LogOut, Menu, X, ShieldCheck, 
  Calendar, Zap, AlertTriangle, BadgeCheck, BarChart3, Wallet, 
  CalendarCheck, Bell, Moon, Sun, PanelLeftClose, PanelLeftOpen,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
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
  const [isSabiSquareOpen, setIsSabiSquareOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;
  
  const siteLogo = theme === 'dark' 
    ? (getSetting('site_logo_dark') || getSetting('site_logo') || "/assets/sabiright-icon.png")
    : (getSetting('site_logo') || "/assets/sabiright-icon.png");

  useEffect(() => {
    if (location === '/app/forum') setIsSabiSquareOpen(true);
  }, [location]);

  const publicRoutes = ['/app/forum'];
  const isPublicRoute = publicRoutes.includes(location);

  if (!loading && !user && !isPublicRoute) {
      setTimeout(() => setLocation("/auth/login"), 0);
      return null;
  }

  const handleSignOut = async () => {
      await signOut(auth);
      setLocation("/");
  };

  if (!user && isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white flex flex-col">
        <Navbar /><div className="flex-1 pt-24 pb-12">{children}</div><Footer />
      </div>
    );
  }

  const adminItems = profile?.isAdmin ? [{ icon: ShieldCheck, label: "Admin Dashboard", href: "/admin" }] : [];
  const vendorItems = profile?.isVendor ? [{ icon: BarChart3, label: "Professional Dashboard", href: "/app/professional-dashboard" }] : [];
  const baseNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
    { icon: Scale, label: "SabiRight AI", href: "/app/civic" },
    { icon: Store, label: "Directory", href: "/app/marketplace" },
    { icon: CalendarCheck, label: "Booking History", href: "/app/bookings" },
    { icon: AlertTriangle, label: "Sabi Move", href: "/app/traffic" },
    { icon: Users, label: "Community", href: "/app/forum" },
    { icon: BadgeCheck, label: "Credits", href: "/app/credits" },
    { icon: Settings, label: "Settings", href: "/app/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100">
      {isSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />)}

      <aside className={cn(
          "fixed md:sticky top-0 h-screen bg-slate-900 dark:bg-slate-950 text-white z-50 transition-all duration-300 flex flex-col border-r border-slate-800",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          !isSidebarOpen && (isCollapsed ? "md:w-20" : "md:w-64")
        )}>
        <div className={cn("p-6 flex items-center border-b border-slate-800", isCollapsed && !isSidebarOpen ? "justify-center" : "gap-3")}>
          <img src={siteLogo} alt="SabiRight" className="h-8 w-8 rounded-lg shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/assets/sabiright-icon.png"; }} />
          {(!isCollapsed || isSidebarOpen) && (<span className="font-bold text-lg tracking-tight truncate">{getSetting('site_title') || "SabiRight"}</span>)}
          <button className="md:hidden ml-auto text-slate-400" onClick={() => setIsSidebarOpen(false)}><X className="h-6 w-6" /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[...adminItems, ...vendorItems, ...baseNavItems].map((item) => (
            <Link key={item.href} href={item.href} className={cn(
                "flex items-center rounded-xl transition-all group relative",
                isCollapsed && !isSidebarOpen ? "justify-center p-3" : "gap-3 px-4 py-3",
                location === item.href ? "bg-primary text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}>
              <item.icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || isSidebarOpen) && <span>{item.label}</span>}
              {isCollapsed && !isSidebarOpen && (<div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">{item.label}</div>)}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <Button variant="ghost" className="w-full justify-center hidden md:flex h-10 hover:bg-white/5 text-slate-400" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          <Link href="/app/settings">
            <div className={cn("bg-slate-800/50 rounded-xl p-3 cursor-pointer hover:bg-slate-800 transition-colors", isCollapsed && !isSidebarOpen ? "p-1" : "")}>
               <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-primary shrink-0">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="text-[10px]">{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  {(!isCollapsed || isSidebarOpen) && (
                    <div className="overflow-hidden">
                      <p className="font-bold text-[11px] truncate">{user?.displayName || "Citizen"}</p>
                      <p className="text-[10px] text-slate-400 truncate tracking-tight">Verified Active</p>
                    </div>
                  )}
               </div>
            </div>
          </Link>

          <Button variant="ghost" className={cn("w-full text-slate-400 hover:text-white gap-3 h-10", isCollapsed && !isSidebarOpen ? "justify-center" : "justify-start px-4")} onClick={handleSignOut}>
            <LogOut className="h-5 w-5 shrink-0" />
            {(!isCollapsed || isSidebarOpen) && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b h-16 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2" onClick={() => setIsSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
            <h1 className="font-bold text-xl capitalize text-slate-800 dark:text-white">
              {location === '/app' ? 'Dashboard' : location.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
          <div className="p-4 md:p-6 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
