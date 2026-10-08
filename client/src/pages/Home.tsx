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
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeEmbedUrl } from "@/lib/utils";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState<'whatsapp' | 'telegram' | 'web'>('whatsapp');

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
  const videoDemoUrl = getYouTubeEmbedUrl(getSetting('video_demo_url'));

  const whatsAppUrl = getSetting('whatsapp_bot_url');
  const telegramUrl = getSetting('telegram_bot_url');

  const channelDemos = {
    whatsapp: {
      title: "WhatsApp Bot Agent",
      userMsg: "What should I know if I have a legal question?",
      botLang: "Illustrative sample",
      botResponse: "This is a static example, not a live AI response. AI-generated legal information may be incomplete or wrong. Check any cited law and consult a qualified lawyer about your situation.",
      actionText: "Chat on WhatsApp",
      actionUrl: whatsAppUrl,
      isExternal: true
    },
    telegram: {
      title: "Telegram Bot Agent",
      userMsg: "/rights",
      botLang: "Illustrative sample",
      botResponse: "This is a static example, not a live AI response. AI-generated legal information may be incomplete or wrong. Check any cited law and consult a qualified lawyer about your situation.",
      actionText: "Chat on Telegram",
      actionUrl: telegramUrl,
      isExternal: true
    },
    web: {
      title: "SabiRight Web Platform",
      userMsg: "How can I explore civic and legal information?",
      botLang: "Illustrative sample",
      botResponse: "This is a static example, not a live AI response. AI-generated legal information may be incomplete or wrong. Check any cited law and consult a qualified lawyer about your situation.",
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
              {/* Platform summary */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>🇳🇬 AI-assisted civic information</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-normal">Web and configured chat channels</span>
              </div>

              {/* Punchy Hero Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Civic and Legal Information <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  with AI assistance.
                </span>
              </h1>

              {/* Concise Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
                Explore civic and legal information on the web, or use a chat bot when its link is configured. Language support depends on the active model. AI responses can be incomplete or wrong; verify legal information with reliable sources or a qualified lawyer.
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

                {whatsAppUrl && (
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
                )}

                {telegramUrl && (
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
                )}
              </div>

              {settingsFailed && (
                <p role="status" className="text-xs text-amber-300">
                  Chat links are temporarily unavailable. Please use the web app.
                </p>
              )}

              {/* Legal information disclaimer */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Scale className="h-4 w-4 text-emerald-400" /> Information only, not legal advice
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-sky-400" /> Verify important claims and citations
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
                      aria-pressed={activeChannelTab === 'whatsapp'}
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
                      aria-pressed={activeChannelTab === 'telegram'}
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
                      aria-pressed={activeChannelTab === 'web'}
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

                {/* Illustrative, non-live conversation sample */}
                <div className="bg-slate-950/90 p-5 space-y-4 rounded-b-xl min-h-[350px] flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header bar of illustrative sample */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="font-bold text-slate-300">{channelDemos[activeChannelTab].title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {channelDemos[activeChannelTab].botLang} · not live
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
                          <Bot className="h-3 w-3" />
                          <span>Illustrative sample response</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {channelDemos[activeChannelTab].botResponse}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Dynamic Launch CTA Inside Preview */}
                  <div className="pt-2 border-t border-slate-900">
                    {channelDemos[activeChannelTab].isExternal && channelDemos[activeChannelTab].actionUrl ? (
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
                    ) : channelDemos[activeChannelTab].isExternal ? (
                      <p role="status" className="py-3 text-center text-xs text-slate-400">
                        This bot link is not configured yet.
                      </p>
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
              Open the web app or use a configured chat channel.
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {whatsAppUrl ? "Link configured" : "Unavailable"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the WhatsApp bot link when one is configured. AI responses may be incomplete or wrong; verify important legal information.
                </p>
              </div>
              <div className="pt-5">
                {whatsAppUrl ? (
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
                ) : (
                  <p className="text-center text-xs text-slate-500">WhatsApp access is not configured.</p>
                )}
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {telegramUrl ? "Link configured" : "Unavailable"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the Telegram bot link when one is configured. AI responses may be incomplete or wrong; verify important legal information.
                </p>
              </div>
              <div className="pt-5">
                {telegramUrl ? (
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
                ) : (
                  <p className="text-center text-xs text-slate-500">Telegram access is not configured.</p>
                )}
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
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Web access</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explore the available civic tools. Features and location-based results depend on configuration, permissions, and local availability.
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

      {/* Structured overview of available tools */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> SabiRight tools
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Civic tools, with clear limitations.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Explore the available tools and check important information with qualified sources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: AI assistance */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI-assisted information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Available model providers may include N-ATLAS when configured. Language support and response quality depend on the active model and may vary.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verify important translations
            </div>
          </motion.div>

          {/* Pillar 2: Legal information */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Legal information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-generated responses may include legal references, but they can be incomplete or incorrect. Check citations against current authoritative sources and seek qualified advice.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-sky-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Not a substitute for a lawyer
            </div>
          </motion.div>

          {/* Pillar 3: Legal referrals */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Legal help and referrals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The app may offer lawyer-contact or referral features where available. Confirm each practitioner's credentials, availability, and suitability directly.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Availability varies by location
            </div>
          </motion.div>

          {/* Pillar 4: Route information */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">SabiMove route information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Route updates may use available traffic data and AI-generated estimates. They are not verified checkpoint reports and cannot guarantee a safe route.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2 text-[11px] text-purple-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Estimates may be incomplete
            </div>
          </motion.div>
        </div>
      </section>

      {/* Set clear expectations for AI and channel availability */}
      <section className="py-14 bg-slate-900/80 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-lg font-black text-emerald-400">AI responses can be wrong</div>
              <div className="text-xs text-slate-400">Check citations and important guidance against reliable sources.</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-black text-sky-400">Chat bots are configuration-dependent</div>
              <div className="text-xs text-slate-400">WhatsApp and Telegram links appear only when configured.</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-black text-purple-400">Use care with sensitive information</div>
              <div className="text-xs text-slate-400">Review the Privacy Policy before sharing personal or location data.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section (if configured) */}
      {videoDemoUrl && (
        <section className="py-20 max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">System in Action</h2>
            <p className="text-xs text-slate-400 mt-1">Product walkthrough; features depend on configuration and availability</p>
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
          <p className="text-xs text-slate-400 mt-1">Important information about AI responses and service availability.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              question: "Are the channel previews live bot conversations?",
              answer: "No. The landing-page conversation is a static illustration. WhatsApp and Telegram access is shown only when an administrator has configured a valid link; availability also depends on the provider and bot service."
            },
            {
              question: "Can AI legal information be wrong?",
              answer: "Yes. AI responses can be incomplete, outdated, or incorrect, including legal references. Verify citations with current authoritative sources and consult a qualified Nigerian lawyer for advice about your circumstances."
            },
            {
              question: "Can the app connect me to a lawyer?",
              answer: "Lawyer-contact or referral tools may be available in the app, depending on location and service configuration. Independently confirm a practitioner's identity, credentials, availability, and suitability. The service is not an emergency response guarantee."
            },
            {
              question: "How should I handle personal or location data?",
              answer: "Review the Privacy Policy to understand how account, message, and location data are handled. Avoid sharing sensitive details unless necessary. Location-based features may require device permission."
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
            Explore civic information and tools.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            Start with the web app, or open a configured chat bot. AI-generated information is not a substitute for qualified legal advice.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app">
              <Button className="h-11 px-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-lg">
                Launch Web App
              </Button>
            </Link>
            {whatsAppUrl && <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </Button>
            </a>}
            {telegramUrl && <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5">
                <Send className="h-4 w-4" />
                <span>Chat on Telegram</span>
              </Button>
            </a>}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
