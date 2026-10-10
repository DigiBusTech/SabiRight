import React from 'react';

export function ComplianceLogos() {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
      {/* NITDA & NCAIR Official Badge */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-blue-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#047857" fillOpacity="0.08" stroke="#047857" strokeWidth="1.5"/>
          <path d="M12 10h5v20h-5z" fill="#047857"/>
          <path d="M23 10h5v20h-5z" fill="#047857"/>
          <path d="M17 14h6v12h-6z" fill="#F8FAFC"/>
          <circle cx="20" cy="20" r="4" fill="#047857"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">NITDA · NCAIR</p>
          <p className="text-[10px] font-semibold text-emerald-700 leading-tight mt-0.5">National AI Challenge</p>
        </div>
      </div>

      {/* NDPC (Nigeria Data Protection Commission) */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-teal-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#0D9488" fillOpacity="0.08" stroke="#0D9488" strokeWidth="1.5"/>
          <path d="M20 10l8 3.5v7.5c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11v-7.5L20 10z" fill="#0D9488" fillOpacity="0.2" stroke="#0D9488" strokeWidth="1.5"/>
          <path d="M16 20l3 3 5-5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">NDPC AUDITED</p>
          <p className="text-[10px] font-semibold text-teal-700 leading-tight mt-0.5">Data Privacy Compliant</p>
        </div>
      </div>

      {/* CAC (Corporate Affairs Commission) */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-blue-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#2563EB" fillOpacity="0.08" stroke="#2563EB" strokeWidth="1.5"/>
          <path d="M13 13h14M20 13v14M15 27h10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="20" cy="20" r="8" stroke="#2563EB" strokeWidth="1.2" strokeDasharray="2 2"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">CAC REGISTERED</p>
          <p className="text-[10px] font-semibold text-blue-700 leading-tight mt-0.5">Corporate Affairs Reg.</p>
        </div>
      </div>

      {/* STARTUP NIGERIA (National Startup Label) */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-indigo-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#4F46E5" fillOpacity="0.08" stroke="#4F46E5" strokeWidth="1.5"/>
          <path d="M20 11l2.5 5 5.5.8-4 3.9 1 5.3-5-2.6-5 2.6 1-5.3-4-3.9 5.5-.8L20 11z" fill="#4F46E5"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">STARTUP NIGERIA</p>
          <p className="text-[10px] font-semibold text-indigo-700 leading-tight mt-0.5">National Startup Label</p>
        </div>
      </div>

      {/* N-ATLAS Sovereign LLM */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-purple-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#9333EA" fillOpacity="0.08" stroke="#9333EA" strokeWidth="1.5"/>
          <path d="M14 26V14l12 12V14" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">N-ATLAS LLM</p>
          <p className="text-[10px] font-semibold text-purple-700 leading-tight mt-0.5">Indigenous Voice & NLP</p>
        </div>
      </div>

      {/* SUPABASE Official Logo */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-emerald-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#10B981" fillOpacity="0.08" stroke="#10B981" strokeWidth="1.5"/>
          <path d="M21.5 10l-9.5 12h8.5l-2 8 9.5-12h-8.5l2-8z" fill="#10B981"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">SUPABASE</p>
          <p className="text-[10px] font-semibold text-emerald-700 leading-tight mt-0.5">PostgreSQL & Vector DB</p>
        </div>
      </div>

      {/* VERCEL Official Logo */}
      <div className="flex items-center gap-3 bg-white border border-slate-200/90 hover:border-slate-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#0F172A" fillOpacity="0.06" stroke="#0F172A" strokeWidth="1.5"/>
          <path d="M20 12l8 14H12l8-14z" fill="#0F172A"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">VERCEL</p>
          <p className="text-[10px] font-semibold text-slate-600 leading-tight mt-0.5">Edge Cloud Infrastructure</p>
        </div>
      </div>

      {/* UN SDG 10 Official Badge */}
      <div className="flex items-center gap-3 bg-orange-50/70 border border-orange-200 hover:border-orange-300 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shrink-0">
          =
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black text-orange-950 uppercase tracking-tight leading-none">SDG 10 TARGET</p>
          <p className="text-[10px] font-semibold text-orange-700 leading-tight mt-0.5">Reduced Inequalities</p>
        </div>
      </div>

      {/* SCUML Civic Integrity Badge */}
      <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-300 hover:border-slate-400 px-4 py-2.5 rounded-2xl shadow-xs transition-all">
        <svg className="w-8 h-8 shrink-0" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" fill="#334155" fillOpacity="0.08" stroke="#334155" strokeWidth="1.5"/>
          <path d="M15 17v-2a5 5 0 0 1 10 0v2m-12 0h14v11H13V17z" stroke="#334155" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">SCUML AUDITED</p>
          <p className="text-[10px] font-semibold text-slate-700 leading-tight mt-0.5">Civic Integrity Verified</p>
        </div>
      </div>
    </div>
  );
}

