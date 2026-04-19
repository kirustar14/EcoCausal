import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import type { AnalyzeResponse } from "@/lib/mock-analyze";
import {
  buildExperimentMeta,
  fetchExperimentMeta,
  type Dataset,
  type ExperimentMeta,
} from "@/lib/mock-experiment";

type Props = {
  question: string;
  data: AnalyzeResponse;
};

export function ExperimentSummary({ question, data }: Props) {
  // Start with the sync fallback so the UI renders immediately,
  // then swap in the real backend data once it arrives.
  const [meta, setMeta] = useState<ExperimentMeta>(() => buildExperimentMeta(data));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchExperimentMeta(question, data)
      .then((m) => { if (!cancelled) { setMeta(m); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [question, data]);

  return (
    <section className="mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-6 items-start">
        {/* Watson with bubble */}
        <div className="flex flex-col items-center lg:items-end lg:sticky lg:top-24">
          <div className="bubble bubble-left mb-3 max-w-[180px] text-xs">
            <p className="text-foreground/80 leading-snug">
              Here's exactly how we ran this experiment…
            </p>
          </div>
          <Scientist who="watson" size={110} />
          <div className="mt-1 mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
            Dr. Watson
          </div>
        </div>

        {/* Panel */}
        <div className="pop-card-lg p-7 space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
                Experiment Summary
              </div>
              <h2 className="serif text-2xl text-foreground mt-1">
                Lab notebook · {data.env_factor} → {data.outcome}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35 animate-pulse">
                  Loading…
                </span>
              )}
              <span className="stamp">Reviewed</span>
            </div>
          </header>

          {/* Research question */}
          <Block label="Research question">
            <p className="serif text-lg text-foreground italic">"{question}"</p>
          </Block>

          {/* Variables */}
          <Block label="Variables used">
            <div className="space-y-3">
              <VarRow tag="independent" label={meta.variables.independent} tone="green" />
              <VarRow tag="dependent" label={meta.variables.dependent} tone="blue" />
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 mb-1.5">
                  Controls
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meta.variables.controls.map((c) => (
                    <span
                      key={c}
                      className="mono text-[11px] px-2.5 py-1 rounded-full bg-muted text-foreground/75"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Block>

          {/* Datasets */}
          <Block label="Datasets">
            <ul className="divide-y divide-foreground/10 ink-border rounded-lg overflow-hidden">
              {meta.datasets.map((d) => (
                <DatasetRow key={d.id} ds={d} />
              ))}
            </ul>
          </Block>

          {/* Methodology */}
          <Block label="Methodology">
            <p className="text-sm leading-relaxed text-foreground/80">{meta.methodology}</p>
          </Block>

          {/* Limitations */}
          <Block label="Limitations">
            <ul className="space-y-2">
              {meta.limitations.map((l, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/80">
                  <span className="mono text-[11px] text-foreground/40 pt-0.5 w-5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </Block>

          {/* Stats */}
          <Block label="Statistical parameters">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCell label="p-value" value={meta.stats.pValue.toFixed(4)} />
              <StatCell label="Pearson r" value={meta.stats.rValue.toFixed(3)} />
              <StatCell label="95% CI" value={meta.stats.confidenceInterval} small />
              <StatCell label="n" value={meta.stats.sampleSize.toLocaleString()} />
            </div>
          </Block>
        </div>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function VarRow({ tag, label, tone }: { tag: string; label: string; tone: "green" | "blue" }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full ${
          tone === "green" ? "tag-green" : "tag-blue"
        }`}
      >
        {tag}
      </span>
      <span className="serif text-base text-foreground">{label}</span>
    </div>
  );
}

function StatCell({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">{label}</div>
      <div
        className={`mt-1 serif text-foreground tracking-tight ${
          small ? "text-base leading-snug" : "text-2xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DatasetRow({ ds }: { ds: Dataset }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 w-12">
            {ds.id.toUpperCase().slice(0, 4)}
          </span>
          <span className="serif text-base text-foreground">{ds.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-foreground/45 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-bubble-up">
          <Meta k="Source" v={ds.source} className="sm:col-span-3" />
          <Meta k="Date range" v={ds.dateRange} />
          <Meta k="Sample size" v={ds.sampleSize} />
          <Meta k="ID" v={ds.id} />
          <p className="sm:col-span-3 text-sm leading-relaxed text-foreground/75 mt-1">
            {ds.description}
          </p>
        </div>
      )}
    </li>
  );
}

function Meta({ k, v, className = "" }: { k: string; v: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/40">{k}</div>
      <div className="text-foreground/80 mt-0.5">{v}</div>
    </div>
  );
}