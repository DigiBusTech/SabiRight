import React from 'react';

const trustMarks = [
  { 
    name: "NITDA · NCAIR", 
    detail: "National AI Challenge",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#047857" fillOpacity="0.1" stroke="#047857" strokeWidth="1.5"/>
        <path d="M11 9h4v18h-4z" fill="#047857"/>
        <path d="M21 9h4v18h-4z" fill="#047857"/>
        <path d="M15 13h6v10h-6z" fill="#F8FAFC"/>
        <circle cx="18" cy="18" r="3.5" fill="#047857"/>
      </svg>
    )
  },
  { 
    name: "NDPC", 
    detail: "Data Privacy Compliant",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#0D9488" fillOpacity="0.1" stroke="#0D9488" strokeWidth="1.5"/>
        <path d="M18 9l7 3.2v6.8c0 4.5-3.1 8.5-7 9.8-3.9-1.3-7-5.3-7-9.8v-6.8L18 9z" fill="#0D9488" fillOpacity="0.2" stroke="#0D9488" strokeWidth="1.5"/>
        <path d="M14.5 18l2.5 2.5 4.5-4.5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: "CAC Registered", 
    detail: "Corporate Affairs Reg.",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#2563EB" fillOpacity="0.1" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M12 12h12M18 12v12M13.5 24h9" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="7" stroke="#2563EB" strokeWidth="1.2" strokeDasharray="2 2"/>
      </svg>
    )
  },
  { 
    name: "Startup Nigeria", 
    detail: "National Startup Label",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#4F46E5" fillOpacity="0.1" stroke="#4F46E5" strokeWidth="1.5"/>
        <path d="M18 10l2.2 4.5 5 .7-3.6 3.5.9 4.8-4.5-2.4-4.5 2.4.9-4.8-3.6-3.5 5-.7L18 10z" fill="#4F46E5"/>
      </svg>
    )
  },
  { 
    name: "N-ATLAS LLM", 
    detail: "Sovereign Voice & NLP",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#9333EA" fillOpacity="0.1" stroke="#9333EA" strokeWidth="1.5"/>
        <path d="M13 23V13l10 10V13" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: "Supabase", 
    detail: "Postgres & Vector DB",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="1.5"/>
        <path d="M19.5 9l-8.5 11h7.5l-1.8 7 8.5-11h-7.5l1.8-7z" fill="#10B981"/>
      </svg>
    )
  },
  { 
    name: "Vercel", 
    detail: "Global Edge Hosting",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#0F172A" fillOpacity="0.06" stroke="#0F172A" strokeWidth="1.5"/>
        <path d="M18 11l7 12H11l7-12z" fill="#0F172A"/>
      </svg>
    )
  },
  { 
    name: "UN SDG 10", 
    detail: "Reduced Inequalities",
    icon: (
      <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
        =
      </div>
    )
  },
  { 
    name: "SCUML", 
    detail: "Civic Integrity Audited",
    icon: (
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" fill="#334155" fillOpacity="0.1" stroke="#334155" strokeWidth="1.5"/>
        <path d="M14 15v-2a4 4 0 0 1 8 0v2m-10 0h12v9H12v-9z" stroke="#334155" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  }
];

interface TrustMarksProps {
  className?: string;
}

export function TrustMarks({ className = "" }: TrustMarksProps) {
  return (
    <section
      className={`py-12 ${className}`}
      aria-labelledby="trust-marks-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2
            id="trust-marks-heading"
            className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400"
          >
            COMPLIANCE, REGULATORY &amp; STANDARDS AUDIT
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Certified technical compliance and regulatory alignment for sovereign Nigerian civic infrastructure.
          </p>
        </div>

        <div className="trust-mark-window" role="region" aria-label="Organizations and platform technology">
          <div className="trust-mark-track flex w-max gap-4 py-2">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 gap-4"
                role={copy === 0 ? "list" : undefined}
                aria-label={copy === 0 ? "Organizations and platform technology" : undefined}
                aria-hidden={copy === 1}
              >
                {trustMarks.map((mark) => (
                  <div
                    key={mark.name}
                    className="flex h-[80px] w-[230px] items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white px-4 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all dark:border-slate-800 dark:bg-slate-900 sm:w-[240px]"
                    role={copy === 0 ? "listitem" : undefined}
                  >
                    <div className="shrink-0">
                      {mark.icon}
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
                        {mark.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                        {mark.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
