import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowUpRight, 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  Scale, 
  Sparkles, 
  ChevronDown, 
  HelpCircle, 
  Zap, 
  Send, 
  Globe2, 
  Smartphone, 
  CheckCircle2, 
  Bot, 
  Radio, 
  ExternalLink,
  Shield,
  Award,
  Layers,
  Database,
  Cloud,
  Check,
  Lock,
  Download,
  CheckCheck,
  Play,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { TrustMarks } from "@/components/TrustMarks";
import { AppStoreButtons } from "@/components/common/AppStoreButtons";
import { ProductMockups } from "@/components/ProductMockups";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'telegram' | 'web'>('whatsapp');

  // References for image scroll animations
  const citizenSectionRef = useRef<HTMLDivElement>(null);
  const justiceSectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: citizenScroll } = useScroll({
    target: citizenSectionRef,
    offset: ["start end", "end start"]
  });

  const { scrollYProgress: justiceScroll } = useScroll({
    target: justiceSectionRef,
    offset: ["start end", "end start"]
  });

  const citizenScale = useTransform(citizenScroll, [0, 0.5, 1], [0.92, 1, 1.05]);
  const citizenY = useTransform(citizenScroll, [0, 1], [-20, 20]);

  const justiceScale = useTransform(justiceScroll, [0, 0.5, 1], [0.95, 1, 1.08]);
  const justiceY = useTransform(justiceScroll, [0, 1], [-30, 30]);

  const { data: settings = {}, isError: settingsFailed } = useQuery<Record<string, string | undefined>>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public');
      if (!res.ok) throw new Error('Unable to load public settings');
      return res.json() as Promise<Record<string, string | undefined>>;
    },
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const getSetting = (key: string) => settings[key];
  
  const heroTitle = getSetting('hero_title') || "Civic & Legal Shield for Nigerian Citizens";
  const heroSubtitle = getSetting('hero_subtitle') || "Instant law-backed guidance, emergency de-escalation scripts, and verified legal directory access in Nigerian Pidgin, Yoruba, Hausa, Igbo, and English.";
  const videoDemoUrl = getYouTubeEmbedUrl(getSetting('video_demo_url'));

  const whatsAppUrl = getSetting('whatsapp_bot_url');
  const telegramUrl = getSetting('telegram_bot_url');
  const appStoreUrl = getSetting('app_store_url');
  const playStoreUrl = getSetting('play_store_url');

  const triggerPwaInstall = () => {
    window.dispatchEvent(new CustomEvent('open-pwa-install'));
  };

  const channelDemos = {
    whatsapp: {
      title: "SabiRight WhatsApp Shield",
      handle: "+234 · Meta Verified Business",
      badge: "Meta Cloud API v19",
      status: "Active · Encrypted",
      userMsg: "Officer say make I unlock my phone for checkpoint. Wetin law talk?",
      userTime: "10:42 AM",
      botLang: "Nigerian Pidgin · N-ATLAS",
      citations: ["§ 37 CFRN 1999 (Privacy)", "§ 49(1) Police Act 2020"],
      botResponse: "Under Section 37 of the 1999 Constitution and Section 49(1) of the Nigeria Police Act 2020, you get full right to privacy. An officer cannot search your phone without a signed court warrant or reasonable suspicion of a felony.",
      scriptQuote: "“Officer, my phone is my private property protected under Section 37. I am ready to present my valid ID, but I do not consent to unlocking my phone without a warrant.”",
      hasVoiceNote: true,
      voiceDuration: "0:18",
      voiceLang: "Pidgin Audio Note",
      actionText: "Chat on WhatsApp",
      actionUrl: whatsAppUrl || "https://wa.me/2349000000000",
      isExternal: true,
      theme: {
        accentColor: "emerald",
        btnGradient: "from-emerald-500 via-emerald-600 to-teal-700 hover:from-emerald-400 hover:to-emerald-500",
        borderColor: "border-emerald-500/30",
        tagBg: "bg-emerald-500/15",
        tagText: "text-emerald-400"
      }
    },
    telegram: {
      title: "SabiRight Sovereign Bot",
      handle: "@SabiRightBot · MTProto 2.0",
      badge: "Telegram Bot API 7.2",
      status: "Encrypted · Instant",
      userMsg: "/rights What are my constitutional rights if arrested by law enforcement?",
      userTime: "10:43 AM",
      botLang: "Statutory Legal Engine",
      citations: ["§ 35(2) CFRN 1999 (Silence)", "§ 6 ACJA 2015", "Free Legal Aid"],
      botResponse: "Under Section 35(2) of the 1999 Constitution and Section 6 of Administration of Criminal Justice Act (ACJA) 2015: 1. You have the right to remain silent until consulting legal counsel. 2. Cause of arrest must be stated immediately. 3. Free legal aid is guaranteed if indigent.",
      scriptQuote: "“I wish to exercise my constitutional right under Section 35(2) to remain silent until I consult with my lawyer.”",
      hasVoiceNote: true,
      voiceDuration: "0:24",
      voiceLang: "English / Yoruba Audio Note",
      actionText: "Chat on Telegram",
      actionUrl: telegramUrl || "https://t.me/SabiRightBot",
      isExternal: true,
      theme: {
        accentColor: "sky",
        btnGradient: "from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-blue-500",
        borderColor: "border-sky-500/30",
        tagBg: "bg-sky-500/15",
        tagText: "text-sky-400"
      }
    },
    web: {
      title: "SabiRight Web Platform & App",
      handle: "app.sabiright.ng · Sovereign Cloud",
      badge: "Full Sovereign Suite",
      status: "Direct Secure Gateway",
      userMsg: "Match me with a nearby verified human rights lawyer in Ikeja.",
      userTime: "10:44 AM",
      botLang: "Proximity Directory & SOS",
      citations: ["3 NBA-Accredited Counsel (≤ 4.2km)", "GPS Geo-Fence Active"],
      botResponse: "Found 3 verified NBA-accredited legal professionals within 4.2 km in Ikeja, Lagos. Dispatch alert transmitted to on-call counsel with encrypted coordinates.",
      scriptQuote: "“Proximity match verified: Adv. Babatunde & Partners on standby. Turn-by-turn navigation and direct phone dispatch enabled.”",
      hasVoiceNote: false,
      voiceDuration: "",
      voiceLang: "",
      actionText: "Launch Web App",
      actionUrl: "/app",
      isExternal: false,
      theme: {
        accentColor: "blue",
        btnGradient: "from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500",
        borderColor: "border-blue-500/30",
        tagBg: "bg-blue-500/15",
        tagText: "text-blue-400"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section (Clean White Background with Ambient Royal Blue & Slate Highlights) */}
      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-white">
        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-linear-to-b from-blue-50/70 via-indigo-50/30 to-transparent blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute -top-10 right-0 w-80 h-80 bg-blue-100/40 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Content & CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Sovereign & Regulatory Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-primary shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>🇳🇬 Sovereign AI Civic Tech</span>
                <span className="text-blue-300">•</span>
                <span className="text-blue-900 font-semibold">Web · WhatsApp · Telegram · Mobile</span>
              </div>

              {/* Dynamic Hero Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
                {heroTitle}
              </h1>

              {/* Dynamic Hero Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
                {heroSubtitle}
              </p>

              {/* Action Buttons: Web App, WhatsApp, Telegram */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Launch Web App Button */}
                <Link href="/app">
                  <Button className="h-12 px-6 rounded-xl bg-primary text-white hover:bg-blue-700 font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-2xl transition-all flex items-center gap-2 group cursor-pointer">
                    <Zap className="h-4 w-4 text-blue-200 fill-blue-200" />
                    <span>Launch Web Platform</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                {/* WhatsApp Direct Bot Link */}
                {whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      className="h-12 px-5 rounded-xl border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <span>WhatsApp Agent</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    onClick={triggerPwaInstall}
                    className="h-12 px-5 rounded-xl border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-primary font-bold text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span>Install Mobile App</span>
                  </Button>
                )}

                {/* Telegram Direct Bot Link */}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      className="h-12 px-5 rounded-xl border-sky-300 bg-sky-50/70 hover:bg-sky-100/80 text-sky-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2"
                    >
                      <Send className="h-4 w-4 text-sky-600" />
                      <span>Telegram Agent</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-sky-600" />
                    </Button>
                  </a>
                )}
              </div>

              {/* App Store & Google Play Store Buttons (Styled as OuiPay, managed dynamically in Admin) */}
              <div className="pt-2">
                <AppStoreButtons size="default" variant="dark" />
              </div>

              {/* Statutory Legal Disclaimer */}
              <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Scale className="h-4 w-4 text-primary" /> Nigeria Police Act 2020 & 1999 Constitution
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-sky-600" /> Verified NBA-Accredited Lawyer Network
                </span>
              </div>
            </motion.div>

            {/* Right Column: Omnichannel Live Terminal Simulator (Solid HD Hyper-Realistic Card) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5 relative"
            >
              {/* Dynamic Ambient Backlight Glow */}
              <div 
                className="absolute -inset-2 sm:-inset-4 rounded-[2.5rem] opacity-60 blur-2xl transition-all duration-700 pointer-events-none -z-10"
                style={{
                  background: activeChannelTab === 'whatsapp'
                    ? 'radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.4), transparent 70%)'
                    : activeChannelTab === 'telegram'
                    ? 'radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.4), transparent 70%)'
                    : 'radial-gradient(circle at 50% 40%, rgba(37, 99, 235, 0.45), transparent 70%)'
                }}
              />

              {/* Hardware Device Chassis Frame */}
              <div className="relative rounded-[2rem] sm:rounded-[2.25rem] p-2 sm:p-2.5 bg-linear-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 shadow-[0_30px_70px_-15px_rgba(15,23,42,0.85),0_0_1px_1px_rgba(255,255,255,0.12)_inset]">
                {/* Physical Glass Reflection Highlight Sheen */}
                <div className="absolute top-0 inset-x-12 h-px bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Hardware Status Header (Mac/Terminal Micro-LEDs + System Status) */}
                <div className="px-3.5 py-2.5 flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 bg-slate-950/70 rounded-t-[1.6rem]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-400/40 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-400/40 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 border border-emerald-400/40 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  </div>
                  
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="tracking-wider uppercase font-bold text-slate-200">
                      N-ATLAS RELAY · ONLINE
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span className="text-slate-300 font-semibold">TLS 1.3</span>
                  </div>
                </div>

                {/* Tactile Frosted Channel Switcher Dock */}
                <div className="p-2 sm:p-2.5 bg-slate-950/40">
                  <div className="p-1 rounded-2xl bg-slate-950/90 border border-white/10 shadow-inner flex items-center gap-1">
                    {/* WhatsApp Button */}
                    <button
                      onClick={() => setActiveChannelTab('whatsapp')}
                      aria-pressed={activeChannelTab === 'whatsapp'}
                      className={`flex-1 py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        activeChannelTab === 'whatsapp'
                          ? 'bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] border-t border-white/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span>WhatsApp</span>
                      {activeChannelTab === 'whatsapp' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </button>

                    {/* Telegram Button */}
                    <button
                      onClick={() => setActiveChannelTab('telegram')}
                      aria-pressed={activeChannelTab === 'telegram'}
                      className={`flex-1 py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        activeChannelTab === 'telegram'
                          ? 'bg-linear-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] border-t border-white/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5 shrink-0" />
                      <span>Telegram</span>
                      {activeChannelTab === 'telegram' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </button>

                    {/* Web & App Button */}
                    <button
                      onClick={() => setActiveChannelTab('web')}
                      aria-pressed={activeChannelTab === 'web'}
                      className={`flex-1 py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        activeChannelTab === 'web'
                          ? 'bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] border-t border-white/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5 shrink-0" />
                      <span>Web & App</span>
                      {activeChannelTab === 'web' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated Conversation Body Screen */}
                <div className="bg-linear-to-b from-slate-950 via-slate-950 to-slate-900/95 p-4 sm:p-5 space-y-4 rounded-b-[1.75rem] border-t border-white/5 min-h-[420px] flex flex-col justify-between text-slate-100">
                  <div className="space-y-4">
                    {/* Active Channel Identity Bar */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-white/10 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md relative ${
                          activeChannelTab === 'whatsapp'
                            ? 'bg-linear-to-tr from-emerald-600 to-emerald-400 text-white'
                            : activeChannelTab === 'telegram'
                            ? 'bg-linear-to-tr from-sky-500 to-blue-500 text-white'
                            : 'bg-linear-to-tr from-blue-600 to-indigo-600 text-white'
                        }`}>
                          {activeChannelTab === 'whatsapp' ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : activeChannelTab === 'telegram' ? (
                            <Send className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-100 text-[13px] tracking-tight">
                              {channelDemos[activeChannelTab].title}
                            </span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {channelDemos[activeChannelTab].handle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-[10px] font-mono font-semibold text-slate-300 shadow-inner flex items-center gap-1.5">
                          <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                          {channelDemos[activeChannelTab].badge}
                        </span>
                      </div>
                    </div>

                    {/* User Query Bubble */}
                    <motion.div 
                      key={`user-${activeChannelTab}`}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="flex justify-end"
                    >
                      <div className="bg-linear-to-br from-slate-800 to-slate-800/90 text-white text-xs sm:text-[12.5px] px-4 py-3 rounded-2xl rounded-tr-xs max-w-[88%] leading-relaxed border border-slate-700/80 shadow-lg space-y-1.5">
                        <p className="text-slate-100 font-medium">{channelDemos[activeChannelTab].userMsg}</p>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>{channelDemos[activeChannelTab].userTime}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                      </div>
                    </motion.div>

                    {/* AI Statutory Response Bubble */}
                    <motion.div 
                      key={`bot-${activeChannelTab}`}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="flex justify-start"
                    >
                      <div className={`bg-linear-to-b from-slate-900/95 via-slate-900 to-slate-950 border text-slate-100 text-xs sm:text-[12px] p-4 rounded-2xl rounded-tl-xs max-w-[96%] space-y-3 shadow-2xl backdrop-blur-xl ${channelDemos[activeChannelTab].theme.borderColor}`}>
                        {/* Header within Bot Response */}
                        <div className="flex items-center justify-between text-[10px] font-bold border-b border-white/5 pb-2">
                          <div className="flex items-center gap-1.5 text-blue-400">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                            <span className="text-slate-200 font-extrabold">SabiRight Civic Shield</span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono">VERIFIED</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {channelDemos[activeChannelTab].botLang}
                          </span>
                        </div>

                        {/* Statutory Citations Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {channelDemos[activeChannelTab].citations.map((cite, i) => (
                            <span 
                              key={i} 
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${channelDemos[activeChannelTab].theme.tagBg} ${channelDemos[activeChannelTab].theme.tagText} border-white/10`}
                            >
                              {cite}
                            </span>
                          ))}
                        </div>

                        {/* Statutory Guidance */}
                        <p className="text-slate-300 leading-relaxed text-[11.5px] sm:text-[12px]">
                          {channelDemos[activeChannelTab].botResponse}
                        </p>

                        {/* De-escalation Script Box */}
                        {channelDemos[activeChannelTab].scriptQuote && (
                          <div className="p-2.5 rounded-xl bg-slate-950/80 border-l-2 border-primary border-slate-800 text-[11px] text-blue-200 font-medium leading-relaxed italic">
                            <span className="not-italic text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5 font-bold">
                              Citizens De-escalation Script:
                            </span>
                            {channelDemos[activeChannelTab].scriptQuote}
                          </div>
                        )}

                        {/* Voice Note Preview Bar (if applicable) */}
                        {channelDemos[activeChannelTab].hasVoiceNote && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/90 border border-white/5 text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </div>
                              <div className="flex items-center gap-1 h-3">
                                {[40, 75, 50, 100, 60, 85, 45, 90, 70, 30].map((h, i) => (
                                  <span 
                                    key={i} 
                                    className="w-0.5 bg-emerald-400/80 rounded-full animate-pulse"
                                    style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                              <span className="text-slate-300 font-semibold">{channelDemos[activeChannelTab].voiceLang}</span>
                              <span className="text-emerald-400 font-bold">{channelDemos[activeChannelTab].voiceDuration}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Channel Action Trigger Button & Trust Reassurance */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    {channelDemos[activeChannelTab].isExternal && channelDemos[activeChannelTab].actionUrl ? (
                      <a 
                        href={channelDemos[activeChannelTab].actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full block"
                      >
                        <Button 
                          className={`w-full h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all duration-300 cursor-pointer bg-linear-to-r ${channelDemos[activeChannelTab].theme.btnGradient} border-t border-white/25`}
                        >
                          <span>{channelDemos[activeChannelTab].actionText}</span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : channelDemos[activeChannelTab].isExternal ? (
                      <Button 
                        onClick={triggerPwaInstall}
                        variant="outline"
                        className="w-full h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <span>{channelDemos[activeChannelTab].actionText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link href="/app" className="w-full block">
                        <Button className={`w-full h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all duration-300 cursor-pointer bg-linear-to-r ${channelDemos[activeChannelTab].theme.btnGradient} border-t border-white/25`}>
                          <span>{channelDemos[activeChannelTab].actionText}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}

                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Zero Sign-Up Required to Ask · End-to-End Encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </header>

      <TrustMarks className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950" />

      <ProductMockups />

      {/* High-Level Software Solutions Bento Grid (Concise & Structured) */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-6 bg-white">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Core Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Comprehensive Civic Intelligence Suite
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            Built from the ground up for Nigerian reality — accessible via chat bots, mobile app, and web.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Legal First Aid */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-7 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-primary flex items-center justify-center font-bold">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Legal First Aid</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Legal First-Aid powered by statutory Nigerian jurisprudence. Instant script guidance during stop-and-search, unlawful detentions, and landlord disputes.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/80 mt-6 flex items-center justify-between text-xs font-bold text-primary">
              <span>Section 37 & 49 Scripts</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </motion.div>

          {/* Pillar 2: SabiMove Route Shield */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-7 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-sky-300 transition-all"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <MapPin className="h-6 w-6 text-sky-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900">SabiMove</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Dynamic route shield and checkpoint awareness. Community-verified safe routing, hotspot avoidance, and real-time civic traffic alerts.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/80 mt-6 flex items-center justify-between text-xs font-bold text-sky-700">
              <span>Cloaked Safe Routing</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </motion.div>

          {/* Pillar 3: Sovereign N-ATLAS Engine */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-7 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-purple-300 transition-all"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Radio className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900">N-ATLAS Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Sovereign Nigerian NLP trained on indigenous languages: Pidgin, Yoruba, Hausa, Igbo, and English voice transcription for low-literacy accessibility.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/80 mt-6 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>5 Indigenous Tongues</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </motion.div>

          {/* Pillar 4: Verified Pro Directory */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-7 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-amber-300 transition-all"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShieldCheck className="h-6 w-6 text-amber-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Verified Counsel</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Direct proximity matching to accredited Nigerian Bar Association (NBA) attorneys and emergency responders when incidents escalate.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-200/80 mt-6 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>NBA-Accredited Matching</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* IMAGE BACKGROUND SECTION 1: Citizens De-escalation with Scroll Animation */}
      <section 
        ref={citizenSectionRef}
        className="relative py-28 md:py-36 overflow-hidden bg-slate-950 text-white"
      >
        {/* Animated Background Image Container */}
        <motion.div 
          style={{ scale: citizenScale, y: citizenY }}
          className="absolute inset-0 z-0 opacity-25 filter brightness-75 contrast-125 pointer-events-none"
        >
          <img 
            src="/assets/hero-citizens.png" 
            alt="Nigerian youth asserting their civic rights" 
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-transparent z-1" />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/60 to-slate-950 z-1" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Shield className="h-4 w-4 text-blue-400" /> Human Dignity on the Streets
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Turning Street Intimidation Into Calm, Lawful Confidence.
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              When stopped on Nigerian roads, fear stems from informational disparity. SabiRight puts precise constitutional citations right in your palm or messaging app so you can stand tall without confrontation.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-2xl font-black text-blue-400">100%</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Law-Backed Citations</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ACJA 2015 & Police Act 2020</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-2xl font-black text-sky-400">&lt; 2s</div>
                <div className="text-xs text-slate-300 font-semibold mt-1">Bot Response Time</div>
                <div className="text-[11px] text-slate-400 mt-0.5">WhatsApp & Telegram API</div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/app">
                <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer">
                  <span>Explore SabiRight Platform</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IMAGE BACKGROUND SECTION 2: Lady Justice & Statutory Moat with Scroll Animation */}
      <section 
        ref={justiceSectionRef}
        className="relative py-28 md:py-36 overflow-hidden bg-slate-900 text-white"
      >
        {/* Animated Lady Justice Image */}
        <motion.div 
          style={{ scale: justiceScale, y: justiceY }}
          className="absolute inset-0 z-0 opacity-20 filter brightness-90 contrast-125 pointer-events-none"
        >
          <img 
            src="/assets/hero-justice.png" 
            alt="Lady Justice statue and statutory protection" 
            className="w-full h-full object-cover object-right"
          />
        </motion.div>

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-linear-to-l from-slate-950 via-slate-950/85 to-transparent z-1" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="ml-auto max-w-2xl space-y-6 text-left lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Scale className="h-4 w-4 text-blue-400" /> Statutory Legal MOAT
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Backed by Verified Legal Precedent and Human Counsel.
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              Unlike generic AI platforms that hallucinate foreign jurisdictions, SabiRight is rigorously grounded in the laws of the Federal Republic of Nigeria. When AI is not enough, verified lawyers are standing by.
            </p>

            <div className="pt-4 flex flex-wrap gap-3 justify-start lg:justify-end">
              <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-slate-200">
                ⚖️ 1999 Constitution (As Amended)
              </span>
              <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-slate-200">
                📜 Administration of Criminal Justice Act
              </span>
              <span className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-slate-200">
                🛡️ Cybercrimes (Prohibition) Act
              </span>
            </div>

            <div className="pt-2">
              <Link href="/about">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm">
                  <span>Learn More About Our Mission</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Walkthrough Demo (Managed dynamically from Admin CMS) */}
      {videoDemoUrl && (
        <section className="py-20 md:py-28 max-w-6xl mx-auto px-6 bg-white">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-3">
              🎥 Product Walkthrough
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              See SabiRight in Action
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Watch how everyday citizens and verified professionals use our omnichannel suite.
            </p>
          </div>
          <div className="aspect-video w-full rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-black">
            <iframe 
              src={videoDemoUrl} 
              className="w-full h-full" 
              title="SabiRight System Walkthrough"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* FAQ Section (Concise, Clean Accordion) */}
      <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-6 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Essential facts about how SabiRight protects your rights and data.
          </p>
        </div>

        <div className="space-y-3.5">
          {[
            {
              question: "How do the WhatsApp and Telegram bots work?",
              answer: "The bots interface with SabiRight's sovereign AI engine through the official Meta Cloud API and Telegram Bot API. You can ask civic and legal questions in plain English or Nigerian Pidgin directly inside your favourite messaging app without downloading extra software."
            },
            {
              question: "What laws does SabiRight reference during encounters?",
              answer: "SabiRight is anchored in the 1999 Constitution of Nigeria, the Nigeria Police Act 2020, the Administration of Criminal Justice Act (ACJA 2015), the Cybercrimes Act, and authoritative state tenancy laws."
            },
            {
              question: "How does SabiRight handle personal data?",
              answer: "Please review our Privacy Policy for details about the personal data used to provide SabiRight services. Avoid sharing unnecessary sensitive information in general inquiries or chats."
            },
            {
              question: "How can I connect with a verified human lawyer?",
              answer: "Through the SabiRight Web and Mobile platforms, users can browse our B2B directory of verified NBA-accredited legal practitioners and initiate direct consultations or emergency standby requests."
            },
            {
              question: "Can I install SabiRight without Google Play or Apple App Store?",
              answer: "SabiRight can be added to the home screen from supported browsers. On Android and desktop, use the browser's Install app or Add to Home screen option. On iPhone and iPad, open SabiRight in Safari, tap Share, then Add to Home Screen."
            }
          ].map((faq, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 text-left font-bold flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-slate-900 text-sm sm:text-base flex items-center gap-2.5">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  {faq.question}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transform transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="p-5 pt-0 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-200 bg-white">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Action CTA Banner (Clean Royal Blue Accent on White Page) */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-6">
        <div className="rounded-3xl p-8 sm:p-14 bg-linear-to-br from-slate-900 via-slate-950 to-blue-950 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Protect Your Rights with Confidence.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-normal">
            Join thousands of Nigerians equipped with instant law-backed scripts and access to verified legal professionals.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5">
            <Link href="/app">
              <Button className="h-12 px-7 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-lg cursor-pointer">
                Launch Web App
              </Button>
            </Link>
            
            {whatsAppUrl && (
              <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                <Button className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Agent</span>
                </Button>
              </a>
            )}

            <Button 
              onClick={triggerPwaInstall}
              variant="outline"
              className="h-12 px-6 rounded-xl border-slate-700 bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Smartphone className="h-4 w-4" />
              <span>Install Mobile App</span>
            </Button>
          </div>

          <div className="pt-6 flex flex-col items-center gap-2.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Available on Mobile &amp; Desktop</span>
            <AppStoreButtons size="sm" variant="glass" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
