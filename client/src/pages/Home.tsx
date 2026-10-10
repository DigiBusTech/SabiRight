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
  Download
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { TrustMarks } from "@/components/TrustMarks";
import { AppStoreButtons } from "@/components/common/AppStoreButtons";

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
      title: "WhatsApp Bot Agent",
      badge: "Meta Cloud API",
      userMsg: "Officer say make I unlock my phone for checkpoint. Wetin law talk?",
      botLang: "Nigerian Pidgin · N-ATLAS",
      botResponse: "Under Section 37 of the 1999 Constitution and Section 49(1) of the Nigeria Police Act 2020, you have the right to privacy. An officer cannot search your phone without a warrant signed by a court or reasonable suspicion of a felony. Stay calm and state: 'Officer, my phone is my private property protected under Section 37.'",
      actionText: "Chat on WhatsApp",
      actionUrl: whatsAppUrl,
      isExternal: true
    },
    telegram: {
      title: "Telegram Bot Agent",
      badge: "Telegram Bot API",
      userMsg: "/rights What are my rights if arrested by law enforcement?",
      botLang: "Statutory Legal Engine",
      botResponse: "Under Section 35(2) of the 1999 Constitution and Section 6 of ACJA 2015: 1. You have the right to remain silent until consulting a lawyer. 2. You must be told the cause of arrest immediately. 3. Free legal aid is guaranteed if indigent.",
      actionText: "Chat on Telegram",
      actionUrl: telegramUrl,
      isExternal: true
    },
    web: {
      title: "SabiRight Web Platform & App",
      badge: "Full Sovereign Suite",
      userMsg: "Match me with a nearby verified human rights lawyer in Ikeja.",
      botLang: "Proximity Directory & SOS",
      botResponse: "Found 3 verified NBA-accredited legal professionals within 4.2 km. Dispatching alert to counsel on standby. Proximity routing active.",
      actionText: "Launch Web App",
      actionUrl: "/app",
      isExternal: false
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

            {/* Right Column: Omnichannel Live Terminal Simulator */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl p-1.5 bg-linear-to-b from-slate-200 via-slate-100 to-white shadow-2xl border border-slate-200">
                {/* Header Switcher Buttons */}
                <div className="bg-slate-900 p-2.5 rounded-t-2xl flex items-center justify-between gap-1 text-white">
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      onClick={() => setActiveChannelTab('whatsapp')}
                      aria-pressed={activeChannelTab === 'whatsapp'}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeChannelTab === 'whatsapp'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setActiveChannelTab('telegram')}
                      aria-pressed={activeChannelTab === 'telegram'}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeChannelTab === 'telegram'
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Telegram</span>
                    </button>

                    <button
                      onClick={() => setActiveChannelTab('web')}
                      aria-pressed={activeChannelTab === 'web'}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeChannelTab === 'web'
                          ? 'bg-primary text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Web & App</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Conversation Body */}
                <div className="bg-slate-950 p-5 space-y-4 rounded-b-2xl min-h-[380px] flex flex-col justify-between text-slate-100">
                  <div className="space-y-4">
                    {/* Channel Header Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="font-bold text-slate-200">{channelDemos[activeChannelTab].title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 text-[10px] font-mono font-semibold">
                        {channelDemos[activeChannelTab].badge}
                      </span>
                    </div>

                    {/* User Query Bubble */}
                    <motion.div 
                      key={`user-${activeChannelTab}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex justify-end"
                    >
                      <div className="bg-slate-800 text-white text-xs px-4 py-3 rounded-2xl rounded-tr-xs max-w-[88%] leading-relaxed border border-slate-700">
                        {channelDemos[activeChannelTab].userMsg}
                      </div>
                    </motion.div>

                    {/* AI Bot Response Bubble */}
                    <motion.div 
                      key={`bot-${activeChannelTab}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-900 border border-blue-500/30 text-slate-100 text-xs p-4 rounded-2xl rounded-tl-xs max-w-[95%] space-y-2 shadow-xl">
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-400">
                          <span className="flex items-center gap-1.5">
                            <Bot className="h-3.5 w-3.5" />
                            <span>SabiRight Civic Shield</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {channelDemos[activeChannelTab].botLang}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11.5px]">
                          {channelDemos[activeChannelTab].botResponse}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Channel Action Trigger Button */}
                  <div className="pt-3 border-t border-slate-800/80">
                    {channelDemos[activeChannelTab].isExternal && channelDemos[activeChannelTab].actionUrl ? (
                      <a 
                        href={channelDemos[activeChannelTab].actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full block"
                      >
                        <Button 
                          className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                            activeChannelTab === 'whatsapp' 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-sky-500 hover:bg-sky-400 text-white'
                          }`}
                        >
                          <span>{channelDemos[activeChannelTab].actionText}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    ) : channelDemos[activeChannelTab].isExternal ? (
                      <Button 
                        onClick={triggerPwaInstall}
                        variant="outline"
                        className="w-full h-11 rounded-xl font-bold text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center gap-2"
                      >
                        <span>Access via Web App</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Link href="/app" className="w-full block">
                        <Button className="w-full h-11 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2">
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

      <TrustMarks className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950" />

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
          {/* Pillar 1: SabiGuard Legal First-Aid */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-7 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-primary flex items-center justify-center font-bold">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-900">SabiGuard</h3>
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
