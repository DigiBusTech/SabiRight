import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Target, Users, Award, Heart, HelpCircle, Code, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Navbar />

      <main className="pt-36 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {aboutContent ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-slate lg:prose-xl max-w-none bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100"
              dangerouslySetInnerHTML={{ __html: aboutContent }}
            />
          ) : (
            <>
              <header className="text-center mb-24">
                <motion.div {...fadeInUp}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-primary text-sm font-bold mb-6">
                    SabiRight · About Us
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tight">
                    Our Mission to <span className="text-primary">Empower</span> Citizens
                  </h1>
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    SabiRight is a mobile AI civic tech platform designed to close the dangerous power and information gap between vulnerable citizens and predatory actors.
                  </p>
                </motion.div>
              </header>

              {/* SDG 10 reduced inequality block */}
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider">
                    Our Core Alignment
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-black leading-tight">SDG 10: Reduced Inequalities</h2>
                  <p className="text-slate-600 text-lg leading-relaxed text-justify">
                    We chose SDG 10 (Reduced Inequalities) because SabiRight is designed to close the dangerous power and information gap between vulnerable citizens and predatory actors. Systemic extortion and harassment thrive when everyday people do not know their rights or cannot afford legal support.
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed text-justify">
                    By translating complex legal codes into accessible local languages and providing immediate proximity matching with verified professionals, we ensure that safety and justice are not privileges reserved only for the wealthy.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-slate-900 text-white rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                  <h3 className="text-2xl font-black mb-6 text-blue-400">Project Overview</h3>
                  <div className="space-y-4 text-slate-300">
                    <p>
                      <strong>Project Type:</strong> Mobile AI civic tech platform
                    </p>
                    <p className="text-sm leading-relaxed text-justify">
                      SabiRight is an AI civic platform that helps everyday people know their rights in clear words so nobody can exploit them. It solves systemic extortion, harassment, and unfair disputes.
                    </p>
                    <p className="text-sm leading-relaxed text-justify">
                      When a civic escalation happens, it uses proximity matching to instantly connect users with nearby verified professionals like lawyers, compliance experts, and local leaders for backup. It protects vulnerable youth facing injustice with no resources.
                    </p>
                    <p className="text-sm leading-relaxed text-justify">
                      We are unique because we translate complex laws into local languages like Pidgin, Hausa, Yoruba, and Igbo.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Problem statement Section */}
              <section className="mb-24 py-16 bg-white border border-slate-100 rounded-3xl p-8 lg:p-12">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h2 className="text-3xl font-black text-center text-slate-900 mb-6">The Problem We Are Tackling</h2>
                  <p className="text-slate-700 text-lg leading-relaxed text-justify">
                    Everyday youth and students face constant harassment, profiling, and extortion by corrupt security and immigration officers, often leading to physical abuse if they try to stand up for themselves. When these crises happen on the road, victims have zero resources or immediate access to help.
                  </p>
                  <p className="text-slate-700 text-lg leading-relaxed text-justify">
                    Beyond the highways, citizens face severe exploitation daily, including unfair landlord versus tenant disputes, aggressive tax enforcement officers, and fraudulent loan agents. Heavy legal language also keeps ordinary people from understanding basic laws.
                  </p>
                </div>
              </section>

              {/* Moral Standards & Ethical Experiences */}
              <div className="grid lg:grid-cols-2 gap-16 items-start mb-24">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" /> Moral & Ethical Standards
                  </h3>
                  <p className="text-slate-600 text-md leading-relaxed text-justify">
                    SabiRight restores human dignity by giving ordinary people the confidence to stand tall. Knowing your rights keeps your dignity intact, and knowing you can access quick professional backup during a crisis completely removes fear.
                  </p>
                  <p className="text-slate-600 text-md leading-relaxed text-justify">
                    We tackle unfair power relations by bridging the gap between vulnerable youth and authority figures. Social responsibility is at our core, which is why we secured our National Startup Label and strict data compliance with the NDPC to protect user privacy. We respect cultural traditions by translating laws into Pidgin, Hausa, Yoruba, and Igbo, using lean software that keeps server energy use low.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <Heart className="h-6 w-6 text-red-500" /> Beneficial Experiences
                  </h3>
                  <p className="text-slate-600 text-md leading-relaxed text-justify">
                    SabiRight brings justice and fairness to the streets by giving vulnerable youth the exact legal facts to stop extortion. It creates a highly positive experience by turning a terrifying encounter into a calm moment where the user feels totally confident and backed up.
                  </p>
                  <p className="text-slate-600 text-md leading-relaxed text-justify">
                    We actively address social conflict through dialogue rather than arguments. Our AI gives users clear, law backed scripts to speak respectfully but firmly to officers or landlords. If the tension rises, our proximity matching instantly brings a verified professional into the conversation to peacefully mediate the issue.
                  </p>
                </motion.div>
              </div>

              {/* Design Relevance & Technical Design */}
              <section className="mb-24 py-16 bg-slate-100 rounded-3xl p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                      <Zap className="h-6 w-6 text-amber-500" /> Human-Centered Design
                    </h3>
                    <p className="text-slate-600 text-md leading-relaxed text-justify">
                      SabiRight is deeply rooted in human centered design. Because users open our app during high stress encounters, we designed a clean Progressive Web App that loads instantly on low bandwidth mobile phones.
                    </p>
                    <p className="text-slate-600 text-md leading-relaxed text-justify">
                      The user interface prioritizes large text and simple navigation to reduce panic. We actively redesign how everyday people experience the law by translating heavy legal codes into accessible Pidgin, Hausa, Yoruba, and Igbo. Our platform website and brand identity use calming yet authoritative visual elements to build immediate trust, showing users they have serious professional backup.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                      <Code className="h-5 w-5" /> Reasonable Effort & Sustainability
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed text-justify">
                      SabiRight creates massive value with very lean effort. We use resources efficiently by dropping heavy AI networks for a single fast agent paired with direct database matching. This keeps implementation simple and server costs low.
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed text-justify">
                      We are self funded and backed by a 500 dollar Google AI agentic build and cloud infrastructure credit. Long term, the platform sustains itself through a B2B model, charging verified professionals in our directory for leads when users need urgent backup. Measurable results include a live beta app, National Startup Labels, and NDPC data compliance.
                    </p>
                  </div>
                </div>
              </section>

              {/* Core Values / Stats */}
              <div className="bg-primary/5 rounded-[3rem] p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 text-center">
                  {[
                    { icon: Shield, label: "Trust", value: "NDPC Compliant" },
                    { icon: Target, label: "SDG 10", value: "Reduced Inequalities" },
                    { icon: Users, label: "Audience", value: "Youth & Students" },
                    { icon: Award, label: "Recognition", value: "National Label" }
                  ].map((item, i) => (
                    <div key={i}>
                      <item.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-lg font-black text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
