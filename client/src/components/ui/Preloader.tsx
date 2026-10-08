import { motion } from "framer-motion";

export const Preloader = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#020617] text-white select-none overflow-hidden"
    >
      {/* Background ambient civic glow */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative mb-8 flex items-center justify-center">
        {/* Modern Pulse Glow Waves */}
        <motion.div
          className="absolute -inset-10 rounded-full bg-blue-500/15"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Outer Rotating Cyan Halo */}
        <motion.div
          className="absolute -inset-6 rounded-full border border-sky-400/30"
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Secondary Counter-rotating Ring */}
        <motion.div
          className="absolute -inset-3 rounded-full border border-blue-500/20 border-dashed"
          animate={{ rotate: -360 }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Brand Shield Container */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: [1, 1.04, 1],
            opacity: 1 
          }}
          transition={{
            scale: {
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.4 }
          }}
          className="relative h-24 w-24 bg-slate-900/90 rounded-4xl shadow-2xl shadow-blue-500/25 flex items-center justify-center p-4 border border-sky-400/40 backdrop-blur-md overflow-hidden"
        >
          <img 
            src="/assets/sabiright-icon.png" 
            alt="SabiRight Emblem" 
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.4)]"
          />

          {/* Holographic light sweep shimmer */}
          <motion.div 
            className="absolute inset-0 bg-linear-to-tr from-sky-400/20 via-transparent to-blue-600/20"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Brand Logotype & Tagline */}
      <div className="relative text-center px-4">
        <motion.h2 
          className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Sabi<span className="text-sky-400">Right</span>
        </motion.h2>

        <motion.p
          className="text-xs font-semibold tracking-wider text-slate-400 uppercase mt-2 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          AI Civic Super-App • Nigerian Statutory First-Aid
        </motion.p>

        {/* Progress Shimmer Bar */}
        <div className="w-52 h-1 bg-slate-800 rounded-full mt-5 mx-auto overflow-hidden relative border border-slate-700/50">
          <motion.div 
            className="h-full bg-linear-to-r from-blue-600 via-sky-400 to-blue-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

