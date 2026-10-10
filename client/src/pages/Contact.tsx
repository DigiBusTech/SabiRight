import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { 
  Mail, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Send, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Building2,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "civic_support",
    message: ""
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;
  const contactContent = getSetting('contact_content');
  
  const email = getSetting('contact_email') || "support@sabiright.com";
  const phone = getSetting('footer_phone') || "+234 7026619186";
  const address = getSetting('footer_address') || "Lagos, Nigeria";
  const whatsAppUrl = getSetting('whatsapp_bot_url');
  const telegramUrl = getSetting('telegram_bot_url');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending support inquiry
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Transmitted",
        description: "Thank you for reaching out. A SabiRight officer will review your inquiry shortly."
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "civic_support",
        message: ""
      });
    }, 900);
  };

  const fadeInUp: any = {
    initial: { opacity: 0, y: 25 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-primary selection:text-white overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-24 md:pt-40">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header Bar */}
          <header className="text-center max-w-3xl mx-auto mb-16">
            <motion.div {...fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-primary dark:text-blue-300 text-xs font-bold mb-5 shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>National Civic Support Desk · Serving All 36 States & FCT</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Get in Touch with <span className="text-primary">SabiRight</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Whether you have an urgent civic question, need legal professional partnership information, or want to report an incident, our national desk is here to help.
              </p>
            </motion.div>
          </header>

          {/* Dynamic CMS Content View (If configured by Administrator) */}
          {contactContent && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 bg-slate-50 dark:bg-slate-900/60 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div 
                className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contactContent }}
              />
            </motion.section>
          )}

          {/* Contact Channels Grid */}
          <section className="mb-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Channel 1: WhatsApp Bot */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">WhatsApp Agent</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ask civic and legal questions 24/7 directly inside WhatsApp in Pidgin or English.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800">
                {whatsAppUrl ? (
                  <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5">
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Live on +234 7026619186</span>
                )}
              </div>
            </div>

            {/* Channel 2: Telegram Bot */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-sky-300 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-700 flex items-center justify-center font-bold">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Telegram Agent</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fast, encrypted bot channel for instant rights lookups and emergency triage.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800">
                {telegramUrl ? (
                  <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5">
                    <span>Chat on Telegram</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Available via @SabiRightBot</span>
                )}
              </div>
            </div>

            {/* Channel 3: Direct Email Support */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-950/40 text-primary flex items-center justify-center font-bold">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Email Inquiries</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  General inquiries, institutional partnerships, and verified lawyer verification.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800">
                <a href={`mailto:${email}`} className="text-xs font-bold text-primary hover:text-blue-800 truncate block">
                  {email}
                </a>
              </div>
            </div>

            {/* Channel 4: National Office Phone */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 flex items-center justify-center font-bold">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Telephone Desk</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Administrative line for official business, partnerships, and verification support.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-slate-800">
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-xs font-bold text-indigo-700 hover:text-indigo-800">
                  {phone}
                </a>
              </div>
            </div>
          </section>

          {/* Form & Operating Details 2-Column Grid */}
          <div className="grid lg:grid-cols-12 gap-12 mb-24">
            
            {/* Left 7 Columns: Interactive Inquiry Form */}
            <motion.div 
              {...fadeInUp}
              className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Send a Direct Dispatch
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Fill in the details below and our national support team will respond within 24 business hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <Input
                      placeholder="e.g. Chukwuma Adeleke"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="chukwuma@example.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Phone Number (Optional)
                    </label>
                    <Input
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-900 dark:text-white font-medium"
                    >
                      <option value="civic_support">Civic Guidance / General Support</option>
                      <option value="lawyer_verification">Lawyer & Verified Pro Network</option>
                      <option value="institution_partnership">Institutional & NGO Partnership</option>
                      <option value="press_media">Press, Media & Governance</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Your Message *
                  </label>
                  <Textarea
                    placeholder="Provide details about your question, situation, or partnership proposal..."
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Transmitting...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Transmit Dispatch</span>
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Right 5 Columns: National Presence, Operating Hours & Hotlines */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">National Headquarters</h3>
                    <p className="text-xs text-slate-400">Federal Republic of Nigeria</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm">Physical Address</p>
                      <p className="text-slate-400 mt-0.5">{address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm">Operating Hours</p>
                      <p className="text-slate-400 mt-0.5">Admin Desk: Monday – Friday, 8:00 AM – 6:00 PM WAT</p>
                      <p className="text-blue-300 mt-0.5 font-semibold">AI Civic Bots: 24/7/365 Nationwide</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm">Data Privacy & NDPC Audited</p>
                      <p className="text-slate-400 mt-0.5">
                        Inquiries are treated under strict attorney-client and data privacy rules in accordance with NDPA 2023.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Professional Verification Callout */}
              <div className="p-7 rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Are You a Licensed Lawyer?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Join our verified directory to receive direct proximity leads when citizens need emergency legal representation in your jurisdiction.
                </p>
                <div className="pt-2">
                  <a href={`mailto:${email}?subject=NBA%20Lawyer%20Directory%20Verification`}>
                    <Button variant="outline" size="sm" className="rounded-xl border-blue-300 text-primary font-bold text-xs">
                      Apply for Directory Listing
                    </Button>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Quick FAQ Section */}
          <section className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Support & Contact FAQs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Immediate answers to common questions about SabiRight's services.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  question: "How quickly does SabiRight respond to emergency incidents?",
                  answer: "Our automated AI bots on WhatsApp, Telegram, and Web respond in under 2 seconds with immediate statutory scripts. For physical legal emergencies, verified proximity lawyers receive dispatch alerts immediately."
                },
                {
                  question: "Can I use SabiRight if I don't have internet access?",
                  answer: "Yes, once you open the SabiRight PWA, key constitutional rights, Police Act scripts, and emergency telephone lines remain cached offline on your device."
                },
                {
                  question: "How do you verify listed lawyers in your directory?",
                  answer: "Every listed legal practitioner must submit their Nigerian Bar Association (NBA) Supreme Court enrollment number, valid practicing license, and branch affiliation before listing."
                }
              ].map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-5 text-left font-bold flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <span className="text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transform transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="p-5 pt-0 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
