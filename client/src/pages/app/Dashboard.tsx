import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, MapPin, Briefcase, Calendar, ChevronRight, 
  ShieldCheck, TrendingUp, Scale, RefreshCw, Zap, Store, 
  CreditCard, Users, FileCheck, Check, Loader2, Gift, Copy, 
  Share2, ArrowUpRight, Compass, Shield, Sparkles, Radio,
  Lock, CheckCircle2, PhoneCall, ExternalLink, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AISuggestions, { hasShownThisSession } from "@/components/AISuggestions";
import WelcomeTour from "@/components/WelcomeTour";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const CITY_STATE_MAP: Record<string, string> = {
  "Lagos": "Lagos",
  "Abuja": "FCT",
  "Port Harcourt": "Rivers",
  "Kano": "Kano",
  "Ibadan": "Oyo",
  "Kaduna": "Kaduna",
  "Benin City": "Edo",
  "Enugu": "Enugu",
  "Onitsha": "Anambra",
  "Jos": "Plateau",
  "Calabar": "Cross River",
  "Warri": "Delta",
  "Uyo": "Akwa Ibom",
  "Owerri": "Imo",
  "Abeokuta": "Ogun"
};

const NIGERIAN_CITIES = Object.keys(CITY_STATE_MAP);

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const userName = user?.displayName === "Super Admin" 
    ? "Super Admin" 
    : (user?.displayName?.split(' ')[0] || "Citizen");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState(profile?.city || "");
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [referralCode, setReferralCode] = useState(profile?.referralCode || "");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");

    switch (paymentStatus) {
      case "success":
        toast({
          title: "Payment confirmed",
          description: "Your payment has been verified and your account updated.",
        });
        break;
      case "pending":
        toast({
          title: "Payment submitted",
          description: "Your payment is awaiting approval.",
        });
        break;
      case "failed":
        toast({
          title: "Payment not confirmed",
          description: "The payment could not be confirmed. If you were charged, contact support.",
          variant: "destructive",
        });
        break;
      case "cancelled":
        toast({ title: "Payment cancelled", description: "No payment was completed." });
        break;
      default:
        return;
    }

    for (const key of ["payment", "provider", "reference", "tx", "error"]) {
      params.delete(key);
    }
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
    );
  }, [toast]);

  const fetchReferralCode = async () => {
    if (!user || referralCode) return;
    setIsGeneratingCode(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/profile/${user.uid}/referral-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        await refreshProfile();
      }
    } catch (err) {
      console.error("Failed to fetch referral code:", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
  };

  useEffect(() => {
    if (!user || hasShownThisSession()) return;
    const timer = setTimeout(() => {
      setShowAISuggestions(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    if (!user || !city) return;
    
    setIsSavingCity(true);
    try {
      const state = CITY_STATE_MAP[city] || "";
      const token = await user.getIdToken();
      const res = await fetch(`/api/profile/${user.uid}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city, state })
      });
      
      if (res.ok) {
        toast({ title: "Location Updated", description: `Active territory set to ${city}, ${state}` });
        try {
          await refreshProfile();
          queryClient.invalidateQueries({ queryKey: [`profile-${user.uid}`] });
          queryClient.invalidateQueries({ queryKey: [`traffic-card-${user.uid}`] });
        } catch {
          // Non-blocking
        }
      } else {
        toast({ title: "Error", description: "Failed to update city", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update city", variant: "destructive" });
    } finally {
      setIsSavingCity(false);
    }
  };

  const { data: trafficCard, refetch: refetchTraffic } = useQuery({
    queryKey: [`traffic-card-${user?.uid}`],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/dashboard/traffic/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? res.json() : null;
    },
    enabled: !!user?.uid,
  });

  const { data: credits, error: creditsError, refetch: refetchCredits } = useQuery({
    queryKey: [`credits-${user?.uid}`],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/credits/${user.uid}/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch credits');
      }
      return res.json();
    },
    enabled: !!user?.uid,
    refetchInterval: 30000,
  });

  const handleRefreshTraffic = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/dashboard/traffic/${user.uid}/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: profile?.city || selectedCity || "Lagos",
          location: trafficCard?.location || (selectedCity ? `${selectedCity} Route` : "Major Highway"),
          status: trafficCard?.status || "normal",
          description: trafficCard?.description || "Updating traffic info..."
        })
      });

      if (res.ok) {
        toast({ title: "Live Feeds Updated", description: "Route intelligence synced with sovereign nodes" });
        refetchTraffic();
      } else {
        const data = await res.json();
        toast({ title: "Refresh Error", description: data.error || "Failed to refresh", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to refresh route status", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const availableCredits = credits ? (credits.availableCredits ?? Math.max(0, (credits.totalCredits || 0) - (credits.usedCredits || 0))) : 0;
  const currentCityName = profile?.city || selectedCity || "Lagos";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8"
    >
      <WelcomeTour />
      
      {/* Email Verification Alert Banner (if unverified) */}
      {profile?.emailVerificationStatus !== 'verified' && (
        <motion.div variants={itemVariants}>
          <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-400/20 backdrop-blur-md shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                    Verify Your Citizen Email Address
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-700/90 dark:text-amber-300/80">
                    Unlock official verified credentials, accredited directory bookings, and full marketplace access.
                  </p>
                </div>
              </div>
              <Link href="/app/verify-email">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs w-full sm:w-auto">
                  Verify Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Flagship Hero Command Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[10px] font-mono font-bold text-primary dark:text-blue-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sovereign Citizen Command
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, <span className="text-primary dark:text-blue-400">{userName}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Your real-time statutory legal shield, verified professional directory, and route intelligence network.
            </p>
          </div>

          {/* Territory & Rapid Emergency Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 relative z-10">
            {/* Quick City Selector Pill */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Jurisdiction</span>
                  <select
                    data-testid="select-city-header"
                    value={selectedCity || profile?.city || ""}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={isSavingCity}
                    className="text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent outline-none cursor-pointer pr-4"
                  >
                    <option value="" className="text-slate-900 bg-white dark:bg-slate-900">Select City</option>
                    {NIGERIAN_CITIES.map(city => (
                      <option key={city} value={city} className="text-slate-900 bg-white dark:bg-slate-900">{city}</option>
                    ))}
                  </select>
                </div>
                {isSavingCity && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 ml-1" />}
              </div>
            </div>

            {/* Emergency SOS Shield Trigger */}
            <Link href="/app/civic">
              <Button className="h-11 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 border-t border-white/20 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                <Scale className="h-4 w-4" />
                <span>Launch Legal First-Aid</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Flagship Top Bento Metrics Grid (4 Hyper-Realistic Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Metric 1: Available AI Credits & Quota */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <div className="h-full p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900 border border-amber-500/25 dark:border-amber-500/20 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Civic AI Quota
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Zap className="h-4 w-4 fill-amber-500" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {creditsError ? "—" : availableCredits}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">Credits</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {availableCredits > 0 ? "Active quota for AI jurisprudence" : "Top up to ask statutory questions"}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-amber-500/20 flex items-center justify-between">
              <Link href="/app/credits" className="w-full">
                <Button size="sm" variant="outline" className="w-full h-8.5 rounded-xl border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5 cursor-pointer">
                  <span>Top-Up Quota</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Legal First Aid Status */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <div className="h-full p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white dark:to-slate-900 border border-blue-500/25 dark:border-blue-500/20 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary dark:text-blue-400">
                  Legal First Aid Engine
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-primary dark:text-blue-400 flex items-center justify-center">
                  <Scale className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Section 37 & 35</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Instant statutory scripts for police checkpoints & tenancy.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-blue-500/20">
              <Link href="/app/civic" className="w-full">
                <Button size="sm" variant="outline" className="w-full h-8.5 rounded-xl border-blue-300 dark:border-blue-700/60 text-primary dark:text-blue-300 hover:bg-blue-500/10 text-xs font-bold gap-1.5 cursor-pointer">
                  <span>Consult Assistant</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Metric 3: SabiMove Route & Road Checkpoint Shield */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <div className={`h-full p-5 rounded-3xl border shadow-lg flex flex-col justify-between ${
            trafficCard?.status === 'cleared'
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white dark:to-slate-900 border-emerald-500/25'
              : trafficCard?.status === 'active'
              ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white dark:to-slate-900 border-rose-500/25'
              : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900 border-amber-500/25'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Route Shield ({currentCityName})
                </span>
                <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md uppercase ${
                  trafficCard?.status === 'cleared'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : trafficCard?.status === 'active'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {trafficCard?.status || 'Active'}
                </span>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {trafficCard?.location || `${currentCityName} Central Express`}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                  {trafficCard?.description || "Sovereign route checkpoints verified normal."}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Button 
                onClick={handleRefreshTraffic}
                disabled={isRefreshing}
                size="sm" 
                variant="outline" 
                className="flex-1 h-8.5 rounded-xl text-xs font-bold gap-1 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync (1 credit)'}</span>
              </Button>
              <Link href="/app/traffic">
                <Button size="sm" variant="ghost" className="h-8.5 px-2.5 rounded-xl text-xs font-bold">
                  <MapPin className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Verified Legal Directory Proximity */}
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <div className="h-full p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white dark:to-slate-900 border border-indigo-500/25 dark:border-indigo-500/20 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Legal Directory
                </span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Store className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>NBA Accredited</span>
                  <CheckCircle2 className="h-4 w-4 text-primary fill-primary/20" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Verified human rights lawyers, retainers, and pro-bono aid.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-indigo-500/20">
              <Link href="/app/marketplace" className="w-full">
                <Button size="sm" variant="outline" className="w-full h-8.5 rounded-xl border-indigo-300 dark:border-indigo-700/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold gap-1.5 cursor-pointer">
                  <span>Find Counsel Nearby</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Rapid Statutory Emergency Prompt Cards (Quick Legal Shield Shortcuts) */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase font-mono">
              Statutory Quick Triggers
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Tap to load statutory legal guidance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: "Stop & Search Defense",
              sub: "Section 37 CFRN 1999 & Section 49 Police Act",
              prompt: "Officer say make I unlock my phone for checkpoint. Wetin law talk?",
              tag: "Constitutional Privacy"
            },
            {
              title: "Arrest & Detention Rights",
              sub: "Section 35(2) CFRN 1999 & ACJA 2015",
              prompt: "What are my rights if arrested by law enforcement?",
              tag: "Right to Silence"
            },
            {
              title: "Landlord / Tenant Disputes",
              sub: "Tenancy Law & Recovery of Premises Act",
              prompt: "My landlord gave me 7 days quit notice. Is this legal?",
              tag: "Tenancy Law"
            }
          ].map((trigger, i) => (
            <Link 
              key={i} 
              href={`/app/civic?prompt=${encodeURIComponent(trigger.prompt)}`}
              className="block"
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all group cursor-pointer space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    {trigger.tag}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {trigger.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {trigger.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Core Platform Capabilities Grid (6 Solid Bento Cards) */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase font-mono">
              Core Citizen Capabilities
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Bento 1: Legal AI Assistant */}
          <Link href="/app/civic">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center border border-blue-200 dark:border-blue-900 group-hover:scale-105 transition-transform">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    Legal First Aid AI Shield
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Interactive voice & text legal first-aid in Nigerian Pidgin, Yoruba, Hausa, Igbo, and English.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-primary">
                <span>Start Legal Session</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Bento 2: Legal Directory & Consultations */}
          <Link href="/app/marketplace">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-900 group-hover:scale-105 transition-transform">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Verified Professional Directory
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Book certified NBA lawyers, retainers, and paralegals with verified distance proximity in {currentCityName}.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Explore Directory</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Bento 3: SabiMove Route Shield */}
          <Link href="/app/traffic">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    SabiMove Road & Checkpoint Shield
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Live road reports, stop-and-search warnings, and real-time community traffic intelligence.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>View Route Map</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Bento 4: SabiSquare Community */}
          <Link href="/app/forum">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-200 dark:border-pink-900 group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    SabiSquare Civic Community
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Engage in public human rights forums, share neighborhood reports, and access peer legal aid.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
                <span>Join Discussion</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Bento 5: Bookings & Retainers */}
          <Link href="/app/bookings">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 group-hover:scale-105 transition-transform">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Consultations & Bookings
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Track case retainers, scheduled lawyer appointments, and consultation milestones securely.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>View Bookings</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Bento 6: Plans & Subscriptions */}
          <Link href="/app/plans">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-900 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Plans & Subscriptions
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Upgrade citizen quotas, access multi-lingual priority legal aid, and manage tier benefits.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Manage Plans</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </motion.div>

      {/* Refer & Earn Passport Card */}
      <motion.div variants={itemVariants} whileHover={{ scale: 1.005 }}>
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 sm:p-7 border border-white/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-[60px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 font-bold block mb-1">
                  Citizen Growth Program
                </span>
                <h3 className="text-lg sm:text-xl font-black mb-1">
                  Invite Friends & Earn AI Credits
                </h3>
                <p className="text-white/80 text-xs sm:text-sm max-w-md leading-relaxed">
                  Share your citizen code with fellow Nigerians. They receive instant signup bonus credits, and you earn 20 credits per verified account.
                </p>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 w-full md:min-w-64">
              {referralCode ? (
                <>
                  <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                    <span className="text-[9px] uppercase font-mono font-bold text-white/60">Your Citizen Code</span>
                    <span className="text-base sm:text-lg font-mono font-black tracking-widest">{referralCode}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-xl cursor-pointer"
                      onClick={() => copyToClipboard(referralCode)}
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 text-white hover:bg-white/20 rounded-xl cursor-pointer"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join SabiRight',
                            text: `Empower your civic rights on SabiRight with my code: ${referralCode}`,
                            url: window.location.origin
                          });
                        } else {
                          copyToClipboard(`${window.location.origin}?ref=${referralCode}`);
                        }
                      }}
                      title="Share link"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  className="w-full h-10 rounded-xl bg-white text-blue-700 hover:bg-white/90 font-bold text-xs cursor-pointer shadow-md"
                  onClick={fetchReferralCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Generate My Citizen Code
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AISuggestions
        isOpen={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
      />
    </motion.div>
  );
}
