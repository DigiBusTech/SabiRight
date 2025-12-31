import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, MapPin, Search, MessageSquare, Briefcase, Users, Scale, AlertTriangle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.5, 0, 0, 1] }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-36 pb-20 overflow-hidden">
        {/* Blobs */}
        <div className="blob bg-blue-200 w-[400px] h-[400px] top-[-10%] -left-20 animate-float" />
        <div className="blob bg-purple-200 w-[400px] h-[400px] bottom-0 -right-20 animate-float" style={{ animationDelay: "2s" }} />

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
              Live in Lagos, Abuja & PH
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] mb-6">
              Know the Law.<br />
              <span className="text-gradient">Beat the Traffic. Get the Job.</span>
            </h1>
            
            <p className="text-lg text-slate-600 max-w-lg mb-10">
              SabiRight is your AI-powered Civic Super-App. Legal First Aid, Smart Traffic routing, AI-powered Jobs, and a Verified Marketplace - the essential toolkit for the modern citizen.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/app">
                <Button className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                  Launch App <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="phone-mockup w-[300px] aspect-[9/19.5]">
              <div className="h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar">
                {/* Mockup Header */}
                <div className="bg-white p-4 pt-8 border-b flex justify-between items-center sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <img src="/assets/sabiright-icon.png" alt="SabiRight" className="w-6 h-6 rounded" />
                    <span className="font-bold text-xs">SabiRight</span>
                  </div>
                  <div className="flex gap-3 text-slate-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Good Morning</p>
                    <p className="text-lg font-bold">Uyouko</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Traffic Alert · Lagos
                    </p>
                    <p className="text-xs font-bold mt-1">3rd Mainland Bridge Accident</p>
                    <p className="text-[10px] text-slate-500">Route calculation suggests +45min delay.</p>
                  </div>

                  <div className="animate-pulse-glow bg-white p-3 border rounded-xl flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Shield className="h-3 w-3" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium italic">Ask Right-To-Know AI...</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2">
                      <span>Verified Near You</span><span className="text-primary">View All</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      <div className="min-w-[130px] bg-white p-3 rounded-xl shadow-sm border">
                        <Scale className="h-4 w-4 text-primary mb-1" />
                        <p className="text-[10px] font-bold mt-1">Barr. Nnamdi</p>
                        <p className="text-[9px] text-slate-400">0.4km away · 5min</p>
                      </div>
                      <div className="min-w-[130px] bg-white p-3 rounded-xl shadow-sm border">
                        <MapPin className="h-4 w-4 text-orange-500 mb-1" />
                        <p className="text-[10px] font-bold mt-1">FixIt Pro</p>
                        <p className="text-[9px] text-slate-400">1.2km away · 12min</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl font-extrabold mb-6 leading-tight">
              Fragmented systems.<br/>
              <span className="text-red-600 uppercase">Zero protection.</span>
            </h2>
            <p className="text-slate-600 text-lg mb-8 text-justify">
              Citizens waste hours on unreliable platforms for jobs, housing, and legal information. 
              This gap leads to fraud and exploitation. We bridge it with AI-powered verified intelligence.
            </p>
            <div className="space-y-4 font-bold text-slate-700">
              <p className="flex items-center gap-3"><span className="text-red-500">✖</span> Job & Housing Scams</p>
              <p className="flex items-center gap-3"><span className="text-red-500">✖</span> Police Harassment without Defense</p>
              <p className="flex items-center gap-3"><span className="text-red-500">✖</span> Bureaucratic Language Barriers</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl"></div>
            <h3 className="text-2xl font-bold mb-8 text-blue-400">The Unified Solution</h3>
            <div className="space-y-8 relative z-10">
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">Instant Legal Defense</p>
                  <p className="text-sm text-slate-400">CITES the 1999 Constitution and NPF Act automatically.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">Proximity Marketplace</p>
                  <p className="text-sm text-slate-400">Real-life Google Maps route data matching for experts.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Agent Section */}
      <section id="ai-agent" className="py-24 bg-slate-950 text-white relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
             initial="initial"
             whileInView="animate"
             viewport={{ once: true }}
             variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8">
              <span className="text-gradient">SabiDoctor</span> AI
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-16 italic">
              Facing harassment? Landlord dispute? Get an instant, legally accurate citation telling you exactly what to say. Your pocket lawyer, powered by AI.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Scale, color: "text-brand-500", title: "Neural Knowledge Base", desc: "Retrieval-Augmented Generation (R.A.G.) citing specific sections of the 1999 Constitution and the Nigerian Police Force (NPF) Act." },
              { icon: MessageSquare, color: "text-green-400", title: "Multi-Lingual OS", desc: "Complex bureaucratic laws instantly explained in English, Pidgin, Hausa, Yoruba, or Igbo for maximum clarity." },
              { icon: Shield, color: "text-purple-400", title: "Immediate Guard", desc: "No 'hallucinations.' Our AI only uses a strictly vetted library of Federal Laws and State Bylaws." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-primary transition-colors"
              >
                <item.icon className={`h-8 w-8 ${item.color} mb-6`} />
                <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-16 leading-tight">The SabiRight Ecosystem</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Scale, color: "bg-primary", borderColor: "border-primary", title: "SabiGuard", desc: "Legal First Aid & Expert Advice powered by AI. Know your rights instantly.", badge: "Sabi Doctor" },
              { icon: MapPin, color: "bg-green-600", borderColor: "border-green-600", title: "SabiMove", desc: "Smart Traffic, Cloaked Routes & Checkpoint alerts. Navigate safely.", badge: "Sabi Navigator" },
              { icon: Search, color: "bg-purple-600", borderColor: "border-purple-600", title: "SabiMarket", desc: "Proximity-based Verified Professionals marketplace. Find trusted pros.", badge: "Find Pros" },
              { icon: Users, color: "bg-pink-600", borderColor: "border-pink-600", title: "SabiSquare", desc: "AI Jobs, Forums, and Events. Connect, learn, and earn.", badge: "The Hub" }
            ].map((pillar, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-slate-50 p-8 rounded-[2rem] border-t-8 ${pillar.borderColor} relative`}
              >
                <div className={`w-14 h-14 ${pillar.color} text-white rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-lg`}>
                  <pillar.icon className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold mb-3">{pillar.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{pillar.desc}</p>
                <span className="px-3 py-1 rounded-full bg-slate-200 text-[9px] font-black uppercase text-slate-500 tracking-widest">{pillar.badge}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Straight Answers.</h2>
          <div className="space-y-4">
            {[
              { q: "How accurate is the AI Legal Guard?", a: "It cites specific sections of the 1999 Constitution and NPF Act. Informational only, not a substitute for a lawyer." },
              { q: "Is the platform free to use?", a: "Core civic alerts and AI legal basics are free. Jobs and high-value marketplace matches use Credits." }
            ].map((faq, i) => (
              <div key={i} className="bg-white border rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left font-bold flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`transform transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="p-6 pt-0 text-slate-600 border-t text-sm bg-slate-50/50 italic animate-in slide-in-from-top-2 fade-in duration-300">
                    {faq.a}
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
