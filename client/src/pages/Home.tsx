import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, MapPin, Search, MessageSquare, Users, Scale, AlertTriangle, ChevronDown, User, Star, Code, HelpCircle, Heart, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getYouTubeEmbedUrl } from "@/lib/utils";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: settings = {} } = useQuery<any>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public');
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const getSetting = (key: string) => settings[key];
  const videoDemoUrl = getYouTubeEmbedUrl(getSetting('video_demo_url'));

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.5, 0, 0, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const hoverScale: any = {
    hover: { 
      scale: 1.05, 
      translateY: -5,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-36 pb-20 overflow-hidden bg-linear-to-b from-blue-50/50 via-white to-slate-50">
        {/* Blobs */}
        <div className="blob bg-blue-200/50 w-[400px] h-[400px] top-[-10%] -left-20 animate-float" />
        <div className="blob bg-purple-200/50 w-[400px] h-[400px] bottom-0 -right-20 animate-float" style={{ animationDelay: "2s" }} />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border shadow-sm text-primary text-sm font-bold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Mobile AI Civic Tech Platform
            </div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight"
            >
              Know Your Rights.<br/>
              <span className="text-primary">Protect Yourself.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed"
            >
              SabiRight is an AI civic platform that helps everyday people know their rights in clear words so nobody can exploit them. It solves systemic extortion, harassment, and unfair disputes.
            </motion.p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/app">
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={hoverScale}
                >
                  <Button className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl">
                    Get Legal First Aid <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50, rotateY: -15 }}
            whileInView={{ opacity: 1, y: 0, rotateY: -8 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Realistic Hyper HD 3D Mobile Mockup Container */}
            <div className="hyper-phone-container">
              <div className="hyper-phone-frame">
                {/* Metallic Hardware buttons */}
                <div className="hyper-phone-button volume-up" />
                <div className="hyper-phone-button volume-down" />
                <div className="hyper-phone-button power" />

                {/* iPhone Screen Content */}
                <div className="hyper-phone-screen">
                  {/* Dynamic Island Cutout */}
                  <div className="dynamic-island" />

                  {/* App Container */}
                  <div className="h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar pt-10">
                    {/* Mockup Header */}
                    <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b flex justify-between items-center sticky top-0 z-20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          S
                        </div>
                        <span className="font-extrabold text-xs text-slate-800">SabiRight Mobile</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-extrabold px-1.5 py-0.5 rounded">PWA</span>
                      </div>
                    </div>

                    {/* Mockup Content */}
                    <div className="p-4 space-y-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Emergency Legal Help</p>
                        <p className="text-base font-black tracking-tight text-slate-900 leading-none mt-1">Instant Proximity Match</p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 shadow-md shadow-red-500/5"
                      >
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 shrink-0" /> Urgent Escalation
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-1.5 leading-tight">Need immediate professional backup?</p>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">Matching you with nearby verified lawyers & compliance leaders...</p>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="animate-pulse-glow bg-white p-3 border border-blue-100 rounded-2xl flex items-center gap-3 shadow-md"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] text-blue-800 font-extrabold italic">Speak to SabiDoctor AI in Pidgin...</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <span>Verified Professionals Nearby</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-blue-500 transition-all">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                              ⚖️
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 leading-none">Barr. Audu</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">Distance: 0.4km away</p>
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                          </div>

                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-green-500 transition-all">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                              🎓
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 leading-none">Advocate Tunde</p>
                              <p className="text-[10px] text-green-600 font-black mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Status: Active
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Partners & AI Multi-Model Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">POWERED BY LEAN MULTI-MODEL AI SYSTEMS</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {/* Google Gemini */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-black text-blue-900 tracking-tight">GEMINI 1.5 PRO</span>
            </div>

            {/* OpenAI GPT-4 */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-black text-emerald-900 tracking-tight">GPT-4O OMNI</span>
            </div>

            {/* Anthropic Claude */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span className="text-xs font-black text-amber-900 tracking-tight">CLAUDE 3.5 SONNET</span>
            </div>

            {/* Trae Build */}
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl shadow-xs">
              <Code className="h-4.5 w-4.5 text-purple-600" />
              <span className="text-xs font-black text-purple-900 tracking-tight">TRAE PLATFORM</span>
            </div>
          </div>

          {/* Compliance & Impact Section (NDPC, SCUML, Startup Nigeria, SDG) */}
          <div className="mt-12 border-t border-slate-100 pt-8">
            <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">COMPLIANCE, REGULATORY & SDG IMPACT AUDIT</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              {/* SDG 10 Logo Badge */}
              <div className="flex items-center gap-2.5 bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                  =
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-orange-900 uppercase leading-none">SDG 10 TARGET</p>
                  <p className="text-[10px] font-bold text-orange-700 leading-tight">Reduced Inequalities</p>
                </div>
              </div>

              {/* NDPC Logo Badge */}
              <div className="flex items-center gap-2.5 bg-teal-50 border border-teal-200 px-4 py-2 rounded-2xl shadow-xs">
                <Shield className="h-5 w-5 text-teal-600 shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-black text-teal-900 uppercase leading-none">NDPC AUDITED</p>
                  <p className="text-[10px] font-bold text-teal-700 leading-tight">Data Privacy Compliant</p>
                </div>
              </div>

              {/* SCUML Logo Badge */}
              <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-300 px-4 py-2 rounded-2xl shadow-xs">
                <Scale className="h-5 w-5 text-slate-700 shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-900 uppercase leading-none">SCUML REGISTERED</p>
                  <p className="text-[10px] font-bold text-slate-700 leading-tight">Civic Integrity Verified</p>
                </div>
              </div>

              {/* Startup Nigeria Logo Badge */}
              <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl shadow-xs">
                <Award className="h-5 w-5 text-indigo-600 shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-black text-indigo-900 uppercase leading-none">STARTUP NIGERIA</p>
                  <p className="text-[10px] font-bold text-indigo-700 leading-tight">National Startup Label</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDG 10 Focus Section */}
      <section className="py-24 bg-linear-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider">
                SDG 10: Reduced Inequalities
              </div>
              <h2 className="text-3xl lg:text-5xl font-black leading-tight">
                Bridging the Dangerous Power & Information Gap
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                We chose SDG 10 because SabiRight is designed to close the dangerous power and information gap between vulnerable citizens and predatory actors. Systemic extortion and harassment thrive when everyday people do not know their rights or cannot afford legal support.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                By translating complex legal codes into accessible local languages and providing immediate proximity matching with verified professionals, we ensure that safety and justice are not privileges reserved only for the wealthy.
              </p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-slate-900 p-8 lg:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-black mb-6 text-blue-400 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" /> Key Focus Areas
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Local Language Translation</h4>
                    <p className="text-sm text-slate-400 mt-1">Simplifying heavy laws into accessible Pidgin, Hausa, Yoruba, and Igbo.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Proximity Matching</h4>
                    <p className="text-sm text-slate-400 mt-1">Connecting users directly with nearby verified legal & compliance professionals during escalations.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Lawful Empowerment</h4>
                    <p className="text-sm text-slate-400 mt-1">Giving citizens clear, law-backed scripts to speak respectfully but firmly to officers or landlords.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">The Problem We Are Solving</h2>
            <div className="w-20 h-1.5 bg-red-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="bg-red-50/50 border-2 border-red-100 rounded-3xl p-8 lg:p-12 space-y-6">
            <p className="text-slate-800 text-lg lg:text-xl leading-relaxed font-semibold italic text-center">
              "Everyday youth and students face constant harassment, profiling, and extortion by corrupt security and immigration officers, often leading to physical abuse if they try to stand up for themselves. When these crises happen on the road, victims have zero resources or immediate access to help."
            </p>
            <div className="border-t border-red-200/50 pt-6 grid md:grid-cols-2 gap-6 text-slate-600">
              <div>
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" /> Beyond the Highways
                </h4>
                <p className="text-sm leading-relaxed">
                  Citizens face severe exploitation daily, including unfair landlord versus tenant disputes, aggressive tax enforcement officers, and fraudulent loan agents.
                </p>
              </div>
              <div>
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-2">
                  <Scale className="h-5 w-5 text-red-600" /> Bureaucracy and Barriers
                </h4>
                <p className="text-sm leading-relaxed">
                  Heavy legal language keeps ordinary people from understanding basic laws, making them easy targets for predatory authority figures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA & Design Relevance Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6 order-2 lg:order-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border shadow-xs">
                  <span className="text-4xl font-black text-primary">Instant</span>
                  <p className="text-sm font-bold mt-2 text-slate-700">PWA Loading Speed</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border shadow-xs">
                  <span className="text-4xl font-black text-primary">Large</span>
                  <p className="text-sm font-bold mt-2 text-slate-700">Panic-Reducing Text</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-xs">
                <h4 className="font-black text-slate-900 mb-2">Low Bandwidth Accessibility</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Designed to open instantly on low-spec phones even on poor networks. The UI prioritizes large text and simple navigation to reduce panic.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">
                Human-Centered Design
              </div>
              <h2 className="text-3xl lg:text-5xl font-black leading-tight">
                Designed for High-Stress Moments
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                SabiRight is deeply rooted in human centered design. Because users open our app during high stress encounters, we designed a clean Progressive Web App (PWA) that loads instantly on low bandwidth mobile phones.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                Our platform website and brand identity use calming yet authoritative visual elements to build immediate trust, showing users they have serious professional backup.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Moral, Ethical & Social Impact */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-xs font-black uppercase tracking-wider">
                Moral & Ethical Standards
              </div>
              <h2 className="text-3xl lg:text-5xl font-black leading-tight">
                Restoring Human Dignity on the Streets
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                SabiRight restores human dignity by giving ordinary people the confidence to stand tall. Knowing your rights keeps your dignity intact, and knowing you can access quick professional backup during a crisis completely removes fear.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed text-justify">
                We tackle unfair power relations by bridging the gap between vulnerable youth and authority figures. Social responsibility is at our core, which is why we secured our National Startup Label and strict data compliance with the NDPC to protect user privacy.
              </p>
            </motion.div>

            <motion.div 
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6 bg-green-50/50 border-2 border-green-100 rounded-3xl p-8 lg:p-12"
            >
              <h3 className="text-2xl font-black text-green-800 flex items-center gap-2">
                <Heart className="h-6 w-6 text-green-600" /> Beneficial Experiences
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed text-justify">
                SabiRight brings justice and fairness to the streets by giving vulnerable youth the exact legal facts to stop extortion. It creates a highly positive experience by turning a terrifying encounter into a calm moment where the user feels totally confident and backed up.
              </p>
              <p className="text-slate-700 text-sm leading-relaxed text-justify">
                We actively address social conflict through dialogue rather than arguments. Our AI gives users clear, law backed scripts to speak respectfully but firmly to officers or landlords. If the tension rises, our proximity matching instantly brings a verified professional into the conversation to peacefully mediate the issue.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Google Support (Reasonable Effort) */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-wider">
                Reasonable Effort & Technical Design
              </div>
              <h2 className="text-3xl lg:text-5xl font-black leading-tight">
                High Value, Lean Architecture
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed text-justify">
                SabiRight creates massive value with very lean effort. We use resources efficiently by dropping heavy AI networks for a single fast agent paired with direct database matching. This keeps implementation simple and server costs low.
              </p>
              <div className="border-t border-white/10 pt-6 space-y-4 text-sm text-slate-400">
                <p className="flex items-center gap-3">
                  <span className="text-green-400">✔</span> Backed by a $500 Google AI agentic build and cloud infrastructure credit
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-green-400">✔</span> B2B directory model, charging verified professionals for leads when users need backup
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-green-400">✔</span> National Startup Labels and NDPC Data Privacy Compliance
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" /> Target Audience
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="font-bold text-white">Everyday Citizens & Youth</h4>
                  <p className="text-sm text-slate-400 mt-1">Everyday youth, students, and vulnerable citizens facing systemic extortion or unfair disputes.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h4 className="font-bold text-white">Verified Professionals</h4>
                  <p className="text-sm text-slate-400 mt-1">Verified legal and compliance professionals seeking direct client leads through our B2B directory.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      {videoDemoUrl && (
        <section className="py-24 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-12">See SabiRight in Action</h2>
            <div className="max-w-4xl mx-auto aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe 
                src={videoDemoUrl} 
                className="w-full h-full" 
                title="SabiRight Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { question: "How does SabiRight protect everyday people?", answer: "SabiRight translates complex legal codes into accessible local languages like Pidgin, Hausa, Yoruba, and Igbo, giving citizens precise law-backed scripts. It also provides immediate proximity matching to verified professionals for backup during escalations." },
              { question: "Why SDG 10?", answer: "SabiRight targets SDG 10 (Reduced Inequalities) by closing the dangerous power and information gap between vulnerable citizens and predatory actors, ensuring safety and justice are not privileges reserved only for the wealthy." },
              { question: "Is my data protected and compliant?", answer: "Yes. SabiRight is strictly compliant with the National Data Protection Commission (NDPC) regulations, safeguarding user privacy and data security at all times." },
              { question: "How does SabiRight remain sustainable?", answer: "Through a B2B model, verified professional lawyers and compliance experts are listed in our directory and charged for leads when users request urgent, live backup." }
            ].map((faq, i) => (
              <div key={i} className="bg-white border rounded-2xl overflow-hidden shadow-xs">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left font-bold flex justify-between items-center hover:bg-slate-50/50 transition"
                >
                  <span className="text-slate-900 font-extrabold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`transform transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="p-6 pt-0 text-slate-600 border-t text-sm bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
