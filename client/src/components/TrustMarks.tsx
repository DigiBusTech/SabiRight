const trustMarks = [
  { name: "NITDA · NCAIR", detail: "Nigerian AI institutions" },
  { name: "NDPC", detail: "Data protection regulator" },
  { name: "CAC", detail: "Corporate registry" },
  { name: "Startup Nigeria", detail: "Startup support initiative" },
  { name: "N-ATLAS", detail: "Nigerian language AI" },
  { name: "Supabase", detail: "Database platform" },
  { name: "Vercel", detail: "Application hosting" },
  { name: "UN SDG 10", detail: "Reduced inequalities" },
  { name: "SCUML", detail: "AML compliance unit" }
];

interface TrustMarksProps {
  className?: string;
}

export function TrustMarks({ className = "" }: TrustMarksProps) {
  return (
    <section
      className={`py-10 ${className}`}
      aria-labelledby="trust-marks-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <h2
          id="trust-marks-heading"
          className="text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:tracking-[0.2em]"
        >
          Organizations, standards & platform technology
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Names are shown for context; their appearance does not imply certification, audit, partnership, or endorsement.
        </p>

        <div className="trust-mark-window mt-6" role="region" aria-label="Organizations and platform technology">
          <div className="trust-mark-track flex w-max gap-3">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 gap-3"
                role={copy === 0 ? "list" : undefined}
                aria-label={copy === 0 ? "Organizations and platform technology" : undefined}
                aria-hidden={copy === 1}
              >
                {trustMarks.map((mark) => (
                  <div
                    key={mark.name}
                    className="flex h-[76px] w-[210px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:w-[230px]"
                    role={copy === 0 ? "listitem" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-50 px-2 text-center text-[10px] font-black leading-tight text-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
                    >
                      {mark.name === "NITDA · NCAIR" ? "NITDA" : mark.name === "Startup Nigeria" ? "SN" : mark.name === "UN SDG 10" ? "10" : mark.name.slice(0, 4)}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        {mark.name}
                      </span>
                      <span className="mt-1 block text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                        {mark.detail}
                      </span>
                    </span>
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
