import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Expand,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Send,
  Shield,
  Sparkles,
  Volume2
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";

const previews = [
  {
    id: "dashboard",
    title: "Mobile Dashboard",
    subtitle: "Citizen Overview · Good evening, Uyouko",
    image: "/assets/homepage-mockups/screen-mobile-dashboard-uyouko.webp",
    alt: "SabiRight mobile web dashboard showing Good evening, Uyouko and the Uyo jurisdiction",
    icon: LayoutDashboard,
    color: "blue"
  },
  {
    id: "whatsapp",
    title: "WhatsApp · Yoruba",
    subtitle: "Yoruba chat, voice notes and quick actions",
    image: "/assets/homepage-mockups/screen-whatsapp-yoruba.webp",
    alt: "SabiRight WhatsApp conversation in Yoruba with a voice note and language options",
    icon: MessageSquare,
    color: "emerald"
  },
  {
    id: "telegram",
    title: "Telegram · Igbo",
    subtitle: "Igbo-language assistance in Telegram",
    image: "/assets/homepage-mockups/screen-telegram-igbo.webp",
    alt: "SabiRight Telegram bot onboarding and an Igbo voice note",
    icon: Send,
    color: "sky"
  },
  {
    id: "web-chat",
    title: "Web Chat · Igbo",
    subtitle: "Igbo legal guidance in the web chat",
    image: "/assets/homepage-mockups/screen-web-chat-igbo.webp",
    alt: "SabiRight web Legal First Aid AI chat in Igbo",
    icon: Volume2,
    color: "indigo"
  },
  {
    id: "native-app",
    title: "Native App",
    subtitle: "The SabiRight app on a mobile device",
    image: "/assets/homepage-mockups/screen-native-app.webp",
    alt: "SabiRight native mobile app dashboard with citizen credits and offline checkpoint cards",
    icon: Smartphone,
    color: "indigo"
  },
  {
    id: "first-aid",
    title: "Offline First-Aid",
    subtitle: "Rights cards and calm scripts, ready offline",
    image: "/assets/homepage-mockups/screen-offline-first-aid.webp",
    alt: "SabiRight offline-ready first-aid screen with a constitutional rights card",
    icon: Shield,
    color: "cyan"
  }
] as const;

const colorStyles: Record<string, { active: string; icon: string; ring: string }> = {
  emerald: {
    active: "border-emerald-300 bg-emerald-50 shadow-emerald-900/5",
    icon: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-300"
  },
  sky: {
    active: "border-sky-300 bg-sky-50 shadow-sky-900/5",
    icon: "bg-sky-100 text-sky-700",
    ring: "ring-sky-300"
  },
  blue: {
    active: "border-blue-300 bg-blue-50 shadow-blue-900/5",
    icon: "bg-blue-100 text-blue-700",
    ring: "ring-blue-300"
  },
  indigo: {
    active: "border-indigo-300 bg-indigo-50 shadow-indigo-900/5",
    icon: "bg-indigo-100 text-indigo-700",
    ring: "ring-indigo-300"
  },
  cyan: {
    active: "border-cyan-300 bg-cyan-50 shadow-cyan-900/5",
    icon: "bg-cyan-100 text-cyan-700",
    ring: "ring-cyan-300"
  }
};

export function ProductMockups() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const activePreview = previews[activeIndex];
  const previousPreview = previews[(activeIndex + previews.length - 1) % previews.length];
  const nextPreview = previews[(activeIndex + 1) % previews.length];

  return (
    <section id="product-preview" className="relative isolate overflow-hidden bg-[#f5f7fc] py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -left-40 top-12 h-96 w-96 rounded-full bg-blue-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[32rem] w-[32rem] rounded-full bg-cyan-100/60 blur-[110px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-wide text-blue-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              IPHONE 14-STYLE PREVIEW · 6 REAL SCREENS
            </div>
            <h2 className="text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl">
              One civic shield.
              <span className="mt-1 block bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Every screen, clear.
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Explore SabiRight on WhatsApp and Telegram, in the Igbo web chat, and across the mobile dashboard, native app and offline First-Aid Mode.
            </p>

            <div className="mt-8 space-y-2.5" role="tablist" aria-label="SabiRight product screens">
              {previews.map((preview, index) => {
                const Icon = preview.icon;
                const colors = colorStyles[preview.color];
                const isActive = index === activeIndex;
                return (
                  <button
                    key={preview.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="product-mockup-screen"
                    onClick={() => setActiveIndex(index)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 sm:px-4 ${
                      isActive
                        ? `${colors.active} shadow-md`
                        : "border-transparent bg-white/55 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">{preview.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500 sm:text-sm">{preview.subtitle}</span>
                    </span>
                    <ArrowUpRight className={`h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/app">
                <Button className="h-11 rounded-xl bg-blue-700 px-5 font-bold text-white shadow-lg shadow-blue-900/15 hover:bg-blue-800">
                  Explore the app
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs font-medium text-slate-500">Tap a screen to inspect it at full size.</span>
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[690px] w-full max-w-[660px] items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/80 bg-gradient-to-br from-[#e9efff] via-white to-[#e2f8f6] px-3 py-10 shadow-[0_35px_100px_-55px_rgba(30,64,175,0.45)] sm:min-h-[760px] sm:px-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#94a3b8_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-300/35 via-indigo-200/25 to-cyan-200/40 blur-3xl" />

            <div className="absolute left-4 top-5 z-20 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 shadow-sm backdrop-blur sm:left-7 sm:top-7">
              iPhone 14-style frame
            </div>
            <div className="absolute right-4 top-5 z-20 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-emerald-800 shadow-sm sm:right-7 sm:top-7">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeIndex + 1} / {previews.length}
            </div>

            <div className="absolute inset-x-0 bottom-24 top-20 flex items-center justify-center">
              <div className="absolute left-[2%] top-1/2 hidden -translate-y-1/2 -rotate-[9deg] opacity-45 drop-shadow-2xl transition-all duration-500 sm:block sm:left-[7%]">
                <div className="w-[156px] rounded-[2.25rem] border-2 border-[#b7bbc3] bg-[#17191e] p-[5px] shadow-2xl">
                  <img src={previousPreview.image} alt="" aria-hidden="true" width="576" height="1280" className="block aspect-[390/844] w-full rounded-[1.9rem] object-cover" loading="lazy" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.button
                  key={activePreview.id}
                  id="product-mockup-screen"
                  type="button"
                  role="tabpanel"
                  aria-label={`View full-size ${activePreview.title} screenshot`}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  onClick={() => setIsExpanded(true)}
                  className={`relative z-10 w-[304px] max-w-[82vw] rounded-[3.5rem] border-[3px] border-[#b7bbc3] bg-gradient-to-br from-[#f3f4f6] via-[#858a94] to-[#d6d8dc] p-[7px] shadow-[0_34px_75px_-30px_rgba(15,23,42,0.8),0_0_0_1px_rgba(255,255,255,0.65)_inset] ring-1 ${colorStyles[activePreview.color].ring} focus-visible:outline-none focus-visible:ring-4`}
                >
                  <span aria-hidden="true" className="pointer-events-none absolute -left-[5px] top-[112px] h-7 w-[3px] rounded-l-sm bg-[#858a94] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.5)]" />
                  <span aria-hidden="true" className="pointer-events-none absolute -left-[5px] top-[153px] h-12 w-[3px] rounded-l-sm bg-[#858a94] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.5)]" />
                  <span aria-hidden="true" className="pointer-events-none absolute -right-[5px] top-[142px] h-16 w-[3px] rounded-r-sm bg-[#858a94] shadow-[inset_1px_0_1px_rgba(255,255,255,0.5)]" />
                  <span aria-hidden="true" className="pointer-events-none absolute -right-[1px] top-1/2 z-20 h-6 w-[3px] -translate-y-1/2 rounded-r-sm bg-black" />
                  <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[17px] z-20 h-[25px] w-[88px] -translate-x-1/2 rounded-full bg-black shadow-[0_1px_2px_rgba(255,255,255,0.16)]" />
                  <span className="relative block aspect-[390/844] overflow-hidden rounded-[2.9rem] bg-slate-950">
                    <img
                      src={activePreview.image}
                      alt={activePreview.alt}
                      width="576"
                      height="1280"
                      className="block h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 z-10 h-[5px] w-[92px] -translate-x-1/2 rounded-full bg-white/85 shadow" />
                  </span>
                </motion.button>
              </AnimatePresence>

              <div className="absolute right-[2%] top-1/2 hidden -translate-y-1/2 rotate-[9deg] opacity-45 drop-shadow-2xl transition-all duration-500 sm:block sm:right-[7%]">
                <div className="w-[156px] rounded-[2.25rem] border-2 border-[#b7bbc3] bg-[#17191e] p-[5px] shadow-2xl">
                  <img src={nextPreview.image} alt="" aria-hidden="true" width="576" height="1280" className="block aspect-[390/844] w-full rounded-[1.9rem] object-cover" loading="lazy" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-5 left-1/2 z-20 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/90 bg-white/90 px-4 py-2.5 shadow-lg shadow-slate-900/10 backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <activePreview.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-slate-900">{activePreview.title}</span>
                <span className="block text-[11px] font-medium text-slate-500">Original screen · iPhone 14-style frame</span>
              </span>
              <Expand className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </div>
        </div>

        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-h-[96vh] max-w-[min(96vw,620px)] overflow-hidden border-slate-700 bg-slate-950 p-2 text-white sm:rounded-3xl">
            <DialogTitle className="sr-only">{activePreview.title} full-size screenshot</DialogTitle>
            <DialogDescription className="sr-only">
              Expanded view of the {activePreview.title} screenshot.
            </DialogDescription>
            <div className="flex max-h-[92vh] items-center justify-center overflow-auto rounded-2xl bg-black">
              <img
                src={activePreview.image}
                alt={activePreview.alt}
                width="576"
                height="1280"
                className="h-auto max-h-[92vh] w-auto max-w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
