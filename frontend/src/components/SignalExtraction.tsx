import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { fetchSignalExtraction, type SignalExtractionResponse } from "@/lib/api";

function useCountUp(target: number, run: boolean, duration = 1100) {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    startedRef.current = false;
    setVal(0);
  }, [target]);

  useEffect(() => {
    if (!run || startedRef.current || target === 0) return;
    startedRef.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);

  return val;
}

type Props = {
  question: string;
  scrollAnchor?: string;
};

export function SignalExtraction({ question, scrollAnchor }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SignalExtractionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data || loading) return;
    setLoading(true);
    fetchSignalExtraction(question)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, question, data, loading]);

  return (
    <section id={scrollAnchor} className="scroll-mt-24">
      <div className="pop-card bg-card overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-foreground/60" />
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Behind the scenes
              </div>
              <div className="serif text-xl text-foreground">
                {open ? "Signal Extraction Analysis" : "View Signal Extraction Analysis"}
              </div>
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-foreground/50" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground/50" />
          )}
        </button>

        {open && (
          <div className="px-5 pb-5 pt-1 animate-status-in">
            {loading && (
              <div className="py-8 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                Extracting signal…
              </div>
            )}

            {data && (
              <>
                <Funnel stages={data.funnel} />

                <div className="mt-6 ink-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 border-b border-foreground/10 bg-muted/30">
                    Confidence breakdown · overall {(data.overall_confidence * 100).toFixed(0)}%
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {data.confidence_factors.map((f) => (
                        <tr key={f.factor} className="border-b border-foreground/5 last:border-0">
                          <td className="py-2.5 px-4 font-medium">{f.factor}</td>
                          <td className="py-2.5 px-4">
                            <div className="text-[10px] text-foreground/50 mono">{f.description}</div>
                          </td>
                          <td className="py-2.5 px-4 w-1/4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-foreground"
                                  style={{ width: `${f.score * 100}%` }}
                                />
                              </div>
                              <span className="mono text-xs text-foreground/65 w-10 text-right">
                                {(f.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`stamp ${f.score > 0.5 ? "tag-ink" : "tag-paper"}`}>
                              {f.score > 0.6 ? "PASS" : f.score > 0.3 ? "MODERATE" : "WEAK"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs text-foreground/55 italic">
                  Watson &amp; Crick applies information-theoretic filtering to extract meaningful
                  signal from noisy multi-source environmental and genomic datasets.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

type FunnelStage = {
  stage: string;
  count: number;
  label: string;
  description: string;
};

function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3">
      {stages.map((s, i) => {
        const tone = i === 0 ? "wide" : i === stages.length - 1 ? "narrow" : "mid";
        return (
          <FunnelStage
            key={s.stage}
            label={s.stage}
            target={s.count}
            sub={s.description}
            tone={tone}
            arrowAfter={i < stages.length - 1}
            max={max}
          />
        );
      })}
    </div>
  );
}

function FunnelStage({
  label,
  target,
  sub,
  tone,
  arrowAfter,
}: {
  label: string;
  target: number;
  sub: string;
  tone: "wide" | "mid" | "narrow";
  arrowAfter: boolean;
  max: number;
}) {
  const val     = useCountUp(target, target > 0);
  const padding = tone === "wide" ? "py-6" : tone === "mid" ? "py-5" : "py-4";
  const bg      = tone === "wide" ? "bg-muted/50" : tone === "mid" ? "bg-muted/70" : "bg-foreground text-background";

  return (
    <>
      <div className={`ink-border rounded-lg ${padding} px-4 text-center ${bg}`}>
        <div className="mono text-[9px] uppercase tracking-[0.22em] opacity-70">{label}</div>
        <div className="serif text-3xl mt-1 leading-none">{val.toLocaleString()}</div>
        <div className="text-[10px] mt-1 opacity-65 line-clamp-2">{sub}</div>
      </div>
      {arrowAfter && (
        <div className="hidden sm:flex items-center justify-center text-foreground/40">
          <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
            <path d="M1 7h24M19 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </>
  );
}