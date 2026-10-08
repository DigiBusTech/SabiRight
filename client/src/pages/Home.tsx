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
  Lock, 
  CheckCircle2, 
  Bot, 
  Radio, 
  Volume2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeEmbedUrl } from "@/lib/utils";

function formatWhatsAppUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim() === "") {
    return "https://wa.me/2348000000000?text=Hello%20SabiRight";
  }
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleaned = trimmed.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleaned}?text=Hello%20SabiRight`;
}

function formatTelegramUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim() === "") {
    return "https://t.me/SabiRightBot";
  }
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleaned = trimmed.replace(/^@/, "");
  return `https://t.me/${cleaned}`;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'telegram' | 'web'>('whatsapp');

  const { data: settings = {} } = useQuery<any>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public');
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const getSetting = (key: string) => settings[key];
  const videoDemoUrl = getYouTubeEmbedUrl(getSetting('video_demo_url'));

  const whatsAppUrl = formatWhatsAppUrl(getSetting('whatsapp_bot_url'));
  const telegramUrl = formatTelegramUrl(getSetting('telegram_bot_url'));

  const channelDemos = {
    whatsapp: {
      title: "WhatsApp Bot Agent",
      badge: "WhatsApp Cloud API",
      color: "emerald",
      userMsg: "Officer say make I unlock my phone for checkpoint. Wetin the law talk?",
      botLang: "Nigerian Pidgin / English",
      botResponse: "Under Section 37 of the 1999 Constitution (Right to Privacy) and Police Act 2020 Section 38, an officer CANNOT search your phone without a valid warrant issued by a court, or specific reasonable suspicion of an indictable offense. Speak respectfully: 'Officer, my phone contains private communications protected under the law.'",
      actionText: "Chat on WhatsApp",
      actionUrl: whatsAppUrl,
      isExternal: true
    },
    telegram: {
      title: "Telegram Bot Agent",
      badge: "Telegram Bot API",
      color: "sky",
      userMsg: "/rights checkpoint extortion & illegal search",
      botLang: "Instant Command Line",
      botResponse: "Statutory Shield Activated: 1999 CFRN s.35 (Personal Liberty), Police Act 2020 s.49-54 (Bail is Free). If detention exceeds 24-48 hours, detention is unconstitutional. Tap [Nearby NBA Advocate] below to alert verified pro-bono lawyers within 2.5km.",
      actionText: "Chat on Telegram",
      actionUrl: telegramUrl,
      isExternal: true
    },
    web: {
      title: "SabiRight Web Platform",
      badge: "Sovereign N-ATLAS Core",
      color: "blue",
      userMsg: "Mo fẹ mọ awọn ẹtọ mi nigbati wọn ba mu mi ni ilodi si.",
      botLang: "Yorùbá / Sovereign AI",
      botResponse: "Labẹ abala 35 ti Ofin Orilẹ-ede 1999, o ni ẹtọ si ominira rẹ. O ni ẹtọ lati dakẹ titi ti agbẹjọro rẹ yoo fi de. Ti wọn ba mu ọ, wọn gbọdọ fi ẹsun kan ọ laarin wakati 24 tabi 48.",
      actionText: "Launch Web App",
      actionUrl: "/app",
      isExternal: false
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-gradient-to-tr from-emerald-500/20 via-blue-500/15 to-purple-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text & Dynamic Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Sovereign Innovation Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>🇳🇬 Sovereign N-ATLAS AI Core</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-normal">Omnichannel WhatsApp & Telegram</span>
              </div>

              {/* Punchy Hero Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Sovereign AI Legal Shield <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  for Every Nigerian.
                </span>
              </h1>

              {/* Concise Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
                Instant statutory legal first-aid in <span className="text-white font-medium">Pidgin, Yoruba, Hausa, Igbo & English</span>. Grounded in the 1999 Constitution, accessible 24/7 on WhatsApp, Telegram, or Web.
              </p>

              {/* Bot Launch Buttons Grid */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Web Launch */}
                <Link href="/app">
                  <Button className="h-12 px-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group">
                    <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                    <span>Launch Web Agent</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                {/* WhatsApp Bot Direct Link */}
                <a 
                  href={whatsAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button 
                    variant="outline" 
                    className="h-12 px-5 rounded-xl border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  </Button>
                </a>

                {/* Telegram Bot Direct Link */}
                <a 
                  href={telegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button 
                    variant="outline" 
                    className="h-12 px-5 rounded-xl border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 hover:text-sky-200 font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <Send className="h-4 w-4 text-sky-400" />
                    <span>Chat on Telegram</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-sky-400" />
                  </Button>
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 1999 CFRN & Police Act 2020
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-sky-400" /> NDPC Privacy Compliant
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Lock className="h-4 w-4 text-amber-400" /> Zero Panic Street De-escalation
                </span>
              </div>
            </motion.div>

            {/* Right Column: Interactive Omnichannel Terminal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-2xl p-1 bg-gradient-to-b from-slate-700/60 via-slate-800/40 to-slate-900/80 shadow-2xl backdrop-blur-xl border border-slate-700/50">
                {/* Top Channel Switcher Tabs */}
                <div className="bg-slate-950/80 p-2 rounded-t-xl border-b border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 w-full">
                    <button
                      onClick={() => setActiveChannelTab('whatsapp')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        activeChannelTab === 'whatsapp'
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setActiveChannelTab('telegram')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        activeChannelTab === 'telegram'
                          ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5 text-sky-400" />
                      <span>Telegram</span>
                    </button>

                    <button
                      onClick={() => setActiveChannelTab('web')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        activeChannelTab === 'web'
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5 text-blue-400" />
                      <span>Web App</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Conversation Feed */}
                <div className="bg-slate-950/90 p-5 space-y-4 rounded-b-xl min-h-[350px] flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header bar of simulated chat */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-300">{channelDemos[activeChannelTab].title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {channelDemos[activeChannelTab].botLang}
                      </span>
                    </div>

                    {/* Animated User Query Bubble */}
                    <motion.div 
                      key={`user-${activeChannelTab}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-end"
                    >
                      <div className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed">
                        {channelDemos[activeChannelTab].userMsg}
                      </div>
                    </motion.div>

                    {/* Animated Bot Response Bubble */}
                    <motion.div 
                      key={`bot-${activeChannelTab}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-900/95 border border-emerald-500/30 text-slate-200 text-xs p-3.5 rounded-2xl rounded-tl-xs max-w-[95%] space-y-2 shadow-lg shadow-black/40">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          <span>SabiRight Sovereign Engine</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {channelDemos[activeChannelTab].botResponse}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Dynamic Launch CTA Inside Preview */}
                  <div className="pt-2 border-t border-slate-900">
                    {channelDemos[activeChannelTab].isExternal ? (
                      <a 
                        href={channelDemos[activeChannelTab].actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full block"
                      >
                        <Button 
                          className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                            activeChannelTab === 'whatsapp' 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-sky-600 hover:bg-sky-500 text-white'
                          }`}
                        >
                          <span>{channelDemos[activeChannelTab].actionText}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    ) : (
                      <Link href="/app" className="w-full block">
                        <Button className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2">
                          <span>Launch Web App</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </header>

      {/* Omnichannel Quick-Access Cards */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xs font-black tracking-[0.2em] text-emerald-400 uppercase">
              Omnichannel Access Layer
            </h2>
            <p className="text-lg font-bold text-white mt-1">
              Choose your preferred channel to get immediate legal first-aid.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* WhatsApp Card */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>WhatsApp Bot Agent</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Official Cloud API</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send text or voice notes directly inside WhatsApp. Get instant de-escalation scripts, constitutional citations, and emergency contacts.
                </p>
              </div>
              <div className="pt-5">
                <a 
                  href={whatsAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                    <span>Chat on WhatsApp</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Telegram Card */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-sky-500/20 hover:border-sky-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Telegram Bot Agent</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Ultra Fast</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero setup required. Use quick commands (<code className="text-sky-300">/rights</code>, <code className="text-sky-300">/emergency</code>) to verify police protocol and request assistance in seconds.
                </p>
              </div>
              <div className="pt-5">
                <a 
                  href={telegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                    <span>Chat on Telegram</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Web & PWA App Card */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-blue-500/20 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Web App & PWA</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Full Suite</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive legal workspace with real-time GPS lawyer proximity matching, offline constitution reader, and SabiMove route cloaking.
                </p>
              </div>
              <div className="pt-5">
                <Link href="/app">
                  <Button className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5">
                    <span>Open Web App</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Bento Grid: 4 Core Software Solutions */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Complete System Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Enterprise Civic Technology Built for Reality.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            No endless paragraphs. Four robust engineering pillars powering justice across Nigeria.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: N-ATLAS Sovereign LLM */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Sovereign N-ATLAS LLM</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fine-tuned from <code className="text-emerald-300 font-mono">NCAIR1/N-ATLaS</code> 8B. Native speech recognition and conversational legal reasoning in Yoruba, Hausa, Igbo, Pidgin & English.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Speech & Local Dialects
            </div>
          </motion.div>

          {/* Pillar 2: Statutory MOAT Grounding */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Statutory Legal MOAT</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every response is strictly verified against the 1999 Constitution (as amended), Police Act 2020, and ACJA 2015. Zero AI hallucinations in critical moments.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-sky-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Exact Statute Grounding
            </div>
          </motion.div>

          {/* Pillar 3: Verified Lawyer Network */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Verified Legal Network</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant proximity matching with accredited Nigerian Bar Association (NBA) attorneys and paralegals when encounters require physical intervention or bail.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Proximity Geolocation
            </div>
          </motion.div>

          {/* Pillar 4: SabiMove Civic Shield */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">SabiMove Route Shield</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time civic alerts, community checkpoint reporting, and cloaked safe passage routing to keep citizens out of extortion hotspots.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-purple-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Live Checkpoint Alerts
            </div>
          </motion.div>
        </div>
      </section>

      {/* High-Impact Numerical Metrics Banner */}
      <section className="py-14 bg-slate-900/80 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">&lt;500ms</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">De-escalation Latency</div>
              <div className="text-[11px] text-slate-500">Real-time edge responses</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-sky-400">5 Dialects</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Multilingual Core</div>
              <div className="text-[11px] text-slate-500">Pidgin, Yoruba, Hausa, Igbo, Eng</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-purple-400">100%</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Statutory Grounded</div>
              <div className="text-[11px] text-slate-500">1999 CFRN & Police Act 2020</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">3 Channels</div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Omnichannel Sync</div>
              <div className="text-[11px] text-slate-500">WhatsApp, Telegram & Web</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section (if configured) */}
      {videoDemoUrl && (
        <section className="py-20 max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">System in Action</h2>
            <p className="text-xs text-slate-400 mt-1">Live walkthrough of SabiRight de-escalation engine</p>
          </div>
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
            <iframe 
              src={videoDemoUrl} 
              className="w-full h-full" 
              title="SabiRight Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Structured FAQ Section (Limited Text, Punchy Answers) */}
      <section id="faq" className="py-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400 mt-1">Key information about access, security, and statutory accuracy.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              question: "How do the WhatsApp and Telegram bot agents work?",
              answer: "You can message our verified WhatsApp or Telegram bot directly without installing any heavy app. Ask legal questions in English, Pidgin, Yoruba, Hausa, or Igbo, or send voice notes. The bot returns exact legal sections and de-escalation scripts within seconds."
            },
            {
              question: "How does SabiRight prevent AI hallucinations?",
              answer: "SabiRight employs strict Retrieval-Augmented statutory grounding. All legal responses are constrained against Nigeria's 1999 Constitution, the Police Act 2020, and the Administration of Criminal Justice Act (ACJA), complete with exact section citations."
            },
            {
              question: "Can I connect to a real, licensed lawyer during an incident?",
              answer: "Yes. In both the Web App and bots, you can trigger proximity lawyer dispatch. SabiGuard matches your location with nearby verified Nigerian Bar Association (NBA) legal practitioners for immediate call, bail representation, or mediation."
            },
            {
              question: "Is user identity and location data private?",
              answer: "Yes. SabiRight strictly adheres to the Nigeria Data Protection Commission (NDPC) guidelines. Emergency incident logs and location coordinates are protected with enterprise-grade encryption."
            }
          ].map((faq, i) => (
            <div key={i} className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden transition-all">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 sm:p-5 text-left font-bold flex justify-between items-center hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  {faq.question}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transform transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="p-4 sm:p-5 pt-0 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Action CTA Banner */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border border-slate-800 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Stand Protected. Anywhere in Nigeria.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            Access statutory first-aid right now on your favourite chat app or launch our web platform.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app">
              <Button className="h-11 px-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-lg">
                Launch Web App
              </Button>
            </Link>
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </Button>
            </a>
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5">
                <Send className="h-4 w-4" />
                <span>Chat on Telegram</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
