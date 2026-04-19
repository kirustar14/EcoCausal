import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { AnalyzeResponse, SourcesResponse, DatasetsResponse } from "@/lib/mock-analyze";
import { getSources, getDatasets } from "@/lib/mock-analyze";

type Props = {
  data: AnalyzeResponse;
  onSimilarClick: (q: string) => void;
};

type Tab = "summary" | "hypotheses" | "report" | "data" | "json";

const CONF_STYLES = {
  STRONG:      { bg: "bg-green-50 border-green-200",   badge: "bg-green-100 text-green-800",   label: "Strong" },
  MODERATE:    { bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800", label: "Moderate" },
  EXPLORATORY: { bg: "bg-gray-50 border-gray-200",     badge: "bg-gray-100 text-gray-600",     label: "Exploratory" },
};

export function ResultsPanel({ data, onSimilarClick }: Props) {
  const [tab, setTab] = useState<Tab>("summary");
  const [sources, setSources] = useState<SourcesResponse | null>(null);
  const [datasets, setDatasets] = useState<DatasetsResponse | null>(null);

  useEffect(() => {
    getSources().then(setSources).catch(() => {});
    getDatasets().then(setDatasets).catch(() => {});
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap gap-1">
        {(["summary", "hypotheses", "report", "data", "json"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition-colors ${
              tab === t ? "bg-foreground text-background" : "text-foreground/45 hover:text-foreground/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "summary"    && <SummaryView data={data} onSimilarClick={onSimilarClick} />}
        {tab === "hypotheses" && <HypothesesView data={data} />}
        {tab === "report"     && <ReportView data={data} />}
        {tab === "data"       && <DataView sources={sources} datasets={datasets} />}
        {tab === "json"       && <JsonView data={data} />}
      </div>
    </div>
  );
}

function SummaryView({ data, onSimilarClick }: { data: AnalyzeResponse; onSimilarClick: (q: string) => void }) {
  const confPct = data.stats.confidence === "HIGH" ? 85 : data.stats.confidence === "MODERATE" ? 55 : 25;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Confidence" value={data.stats.confidence} bar={confPct} />
        <Stat label="Pearson r" value={data.stats.r.toFixed(3)} sub={`p=${data.stats.p.toFixed(3)}`} />
        <Stat label="n" value={data.stats.n.toLocaleString()} sub="samples" />
      </div>
      <div>
        <SectionLabel>Plain English</SectionLabel>
        <p className="text-lg leading-snug text-foreground mt-2">{data.summary}</p>
      </div>
      <div>
        <SectionLabel>Datasets used</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.datasets_used.map((d) => (
            <span key={d} className="mono text-[11px] px-2.5 py-1 rounded-full bg-muted text-foreground/75">{d}</span>
          ))}
        </div>
      </div>
      {data.similar_questions?.length > 0 && (
        <div>
          <SectionLabel>Explore further</SectionLabel>
          <div className="mt-2 space-y-2">
            {data.similar_questions.map((q) => (
              <button
                key={q}
                onClick={() => onSimilarClick(q)}
                className="w-full text-left text-sm text-foreground/75 hover:text-foreground px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                {q} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HypothesesView({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="space-y-4">
      {data.hypotheses.map((h) => {
        const styles = CONF_STYLES[h.confidence] ?? CONF_STYLES.EXPLORATORY;
        return (
          <div key={h.rank} className={`rounded-xl border p-4 ${styles.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-[10px] text-foreground/40 uppercase tracking-[0.18em]">#{h.rank}</span>
              <span className={`mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full ${styles.badge}`}>{styles.label}</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed mb-2">{h.hypothesis}</p>
            <p className="text-xs text-foreground/55 leading-relaxed italic">{h.mechanism}</p>
          </div>
        );
      })}
    </div>
  );
}

function ReportView({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground/85">
      <ReactMarkdown>{data.report}</ReactMarkdown>
    </div>
  );
}

function DataView({ sources, datasets }: { sources: SourcesResponse | null; datasets: DatasetsResponse | null }) {
  if (!sources || !datasets) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="mono text-xs text-foreground/40 uppercase tracking-[0.18em]">Loading data…</span>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Total records</SectionLabel>
        <p className="text-4xl text-foreground mt-1">{sources.total_rows.toLocaleString()}</p>
        <p className="mono text-[10px] text-foreground/40 uppercase tracking-[0.18em] mt-1">across {sources.datasets.length} datasets</p>
      </div>
      <div className="space-y-3">
        {sources.datasets.map((ds) => (
          <div key={ds.name} className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-foreground/90">{ds.name}</div>
                <div className="mono text-[10px] text-foreground/45 uppercase tracking-[0.15em] mt-0.5">{ds.type} · {ds.coverage}</div>
              </div>
              <span className="mono text-[11px] text-foreground/55 shrink-0">{ds.rows.toLocaleString()} rows</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {ds.measures.map((m) => (
                <span key={m} className="mono text-[10px] px-2 py-0.5 rounded-full bg-background/60 text-foreground/60">{m}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <SectionLabel>EPA PM2.5</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Stat label="Mean" value={`${datasets.epa.mean_pm25} µg/m³`} />
          <Stat label="Max" value={`${datasets.epa.max_pm25} µg/m³`} />
        </div>
      </div>
      <div>
        <SectionLabel>Scripps heat map</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Stat label="Mean temp" value={`${datasets.scripps.mean_temp}°F`} />
          <Stat label="Mean humidity" value={`${datasets.scripps.mean_humidity}%`} />
        </div>
      </div>
    </div>
  );
}

function JsonView({ data }: { data: AnalyzeResponse }) {
  return (
    <pre className="mono whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-[11px] leading-relaxed text-foreground/80">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Stat({ label, value, sub, bar }: { label: string; value: string; sub?: string; bar?: number }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl text-foreground tracking-tight">{value}</span>
        {sub && <span className="mono text-[10px] text-foreground/45">{sub}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-foreground/70 transition-all" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">{children}</span>;
}