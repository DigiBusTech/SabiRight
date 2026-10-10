import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { 
  Shield, 
  Target, 
  Users, 
  Award, 
  Heart, 
  HelpCircle, 
  Code, 
  Zap, 
  Scale, 
  CheckCircle2, 
  Globe2, 
  Lock, 
  Database, 
  BookOpen, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function About() {
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;
  const aboutContent = getSetting('about_content');

  const fadeInUp: any = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-primary selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 md:pt-40">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header Bar / National Status Pill */}
          <header className="text-center max-w-4xl mx-auto mb-20">
            <motion.div {...fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-primary dark:text-blue-300 text-xs font-bold mb-6 shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Sovereign Civic Infrastructure · Serving the Nation</span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Empowering Nigerian Citizens With <span className="text-primary">Lawful Confidence</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
                SabiRight is Nigeria's premier sovereign civic technology platform, designed to close the information disparity between everyday citizens and authorities across all 36 States and the FCT.
              </p>
            </motion.div>
          </header>

          {/* Dynamic CMS Content View (If configured by Administrator) */}
          {aboutContent && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-20 bg-slate-50 dark:bg-slate-900/60 p-8 md:p-14 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div 
                className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: aboutContent }}
              />
            </motion.section>
          )}

          {/* National Scale Metrics Strip */}
          <section className="mb-24">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { number: "36 + FCT", label: "Nationwide Coverage", desc: "Accessible in every state and territory" },
                { number: "100%", label: "Nigerian Statutory Law", desc: "Anchored in 1999 Constitution & Police Act" },
                { number: "5 Tongues", label: "Indigenous Languages", desc: "Pidgin, Hausa, Yoruba, Igbo, and English" },
                { number: "24 / 7", label: "Instant Access", desc: "WhatsApp, Telegram, Web and Mobile App" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center hover:border-blue-300 transition-colors"
                >
                  <p className="text-3xl sm:text-4xl font-black text-primary dark:text-blue-400 mb-1">{stat.number}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{stat.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* SDG 10: Reduced Inequalities & Moral Mandate */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-xs font-black uppercase tracking-wider">
                United Nations Sustainable Development Goal
              </div>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight text-slate-900 dark:text-white">
                SDG 10: Reduced Inequalities
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed text-justify">
                We chose SDG 10 (Reduced Inequalities) because SabiRight is engineered to dismantle the dangerous power and informational asymmetry between ordinary citizens and predatory actors. Systemic extortion, arbitrary detention, and harassment thrive when everyday people do not know their legal protections or cannot afford rapid legal backup.
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed text-justify">
                By translating complex statutory codes into accessible indigenous vernaculars and providing immediate proximity matching with accredited Nigerian Bar Association (NBA) attorneys, we ensure that justice and dignity are universal rights, not luxury privileges reserved for the wealthy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden shadow-2xl border border-slate-800 text-white"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-blue-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black text-white">Platform Mission Charter</h3>
              </div>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  <strong className="text-white">Mandate:</strong> Sovereign Civic Technology Platform for 200M+ Nigerian citizens.
                </p>
                <p>
                  <strong className="text-white">Problem Solved:</strong> Street-level profiling, illegal phone searches, unlawful detentions, aggressive tenancy exploitation, and opaque bureaucratic extortion.
                </p>
                <p>
                  <strong className="text-white">Strategic Advantage:</strong> Grounded strictly in domestic Nigerian jurisprudence (Constitution, ACJA 2015, Police Act 2020) powered by N-ATLAS indigenous NLP.
                </p>
                <p>
                  <strong className="text-white">Professional Ecosystem:</strong> Transparent directory connecting users with nearby verified legal counsel for live escalation management.
                </p>
              </div>
            </motion.div>
          </div>

          {/* 4 Architectural Pillars Grid */}
          <section className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Four Pillars of Citizen Protection
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
                A purpose-built civic platform designed to function under Nigerian infrastructure constraints.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-primary flex items-center justify-center">
                  <Scale className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Statutory MOAT</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every AI response cites specific sections of the 1999 Constitution, ACJA 2015, or the Police Act 2020. No foreign hallucination.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">N-ATLAS Vernacular</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Trained on Nigerian Pidgin, Yoruba, Hausa, and Igbo to eliminate literacy barriers and provide natural voice guidance.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verified Legal Network</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Direct proximity directory connecting citizens with accredited Nigerian lawyers when digital guidance requires physical backup.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">NDPC Audited Privacy</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built to the highest data protection standards under the Nigeria Data Protection Act. We never sell, monetize, or exploit user data.
                </p>
              </div>
            </div>
          </section>

          {/* Restoring Dignity & De-escalation Through Dialogue */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-24">
            <motion.div {...fadeInUp} className="space-y-6">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" /> Restoring Human Dignity on the Streets
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed text-justify">
                SabiRight restores human dignity by giving ordinary people the confidence to stand tall. Knowing your statutory rights keeps your dignity intact, and knowing you can summon verified legal backup during an encounter eliminates paralyzing fear.
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed text-justify">
                We tackle abusive power dynamics by bridging the gap between vulnerable youth and authority figures. Social responsibility is at our foundation: we secured our National Startup Label and maintain strict compliance with the National Data Protection Commission (NDPC) to protect every citizen's privacy.
              </p>
            </motion.div>

            <motion.div {...fadeInUp} className="space-y-6">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-500" /> Peaceful De-escalation Through Dialogue
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed text-justify">
                SabiRight brings peace and clarity to confrontations by giving citizens calm, respectful, law-backed scripts. It transforms hostile checkpoints and contentious disputes into professional exchanges where statutory facts govern conduct.
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed text-justify">
                Rather than promoting arguments, our AI coaches users to speak with firmness and respect. If tension escalates, our directory allows users to immediately connect with verified professionals who can intervene peacefully and legally.
              </p>
            </motion.div>
          </div>

          {/* Compliance & Regulatory Badges */}
          <section className="mb-24 py-12 px-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase mb-8">
              RECOGNITION, GOVERNANCE & AUDIT COMPLIANCE
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <span className="text-base">🇳🇬</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">NITDA · NCAIR Innovation Challenge</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <Shield className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">NDPC Data Privacy Audited</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <Scale className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">CAC Registered Entity</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <Award className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">Startup Nigeria Label</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <Lock className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">SCUML Audited Integrity</span>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section className="text-center py-16 px-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Ready to Experience Sovereign Civic Intelligence?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Access law-backed scripts and connect with verified legal advocates across Nigeria today.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link href="/app">
                  <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-xl">
                    Launch SabiRight Platform
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm">
                    Contact Our National Desk
                  </Button>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
