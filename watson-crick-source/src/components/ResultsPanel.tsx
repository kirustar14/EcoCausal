import { useState } from "react";
import type { AnalyzeResponse } from "@/lib/mock-analyze";

type Props = {
  data: AnalyzeResponse;
};

export function ResultsPanel({ data }: Props) {
  const [tab, setTab] = useState<"report" | "json">("report");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <TabBtn active={tab === "report"} onClick={() => setTab("report")}>Report</TabBtn>
          <TabBtn active={tab === "json"} onClick={() => setTab("json")}>JSON</TabBtn>
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
          {new Date(data.generated_at).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "report" ? <ReportView data={data} /> : <JsonView data={data} />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-foreground/45 hover:text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}

function ReportView({ data }: { data: AnalyzeResponse }) {
  const { parsed, report } = data;
  const confPct = Math.round(report.confidence * 100);
  return (
    <div className="space-y-7">
      {/* Parsed query — quiet pills */}
      <div>
        <SectionLabel>Parsed query</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill>exposure · {parsed.exposure}</Pill>
          <Pill>outcome · {parsed.outcome}</Pill>
          {parsed.location && <Pill>location · {parsed.location}</Pill>}
        </div>
      </div>

      {/* Stats — minimal */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Confidence" value={`${confPct}%`} bar={confPct} />
        <Stat
          label="p-value"
          value={report.p_value.toFixed(3)}
          sub={report.p_value < 0.01 ? "highly sig." : "significant"}
        />
        <Stat label="n" value={report.sample_size.toLocaleString()} sub="samples" />
      </div>

      {/* Summary */}
      <div>
        <SectionLabel>Summary</SectionLabel>
        <p className="serif text-lg leading-snug text-foreground mt-2">
          {report.summary}
        </p>
      </div>

      {/* Key findings */}
      <div>
        <SectionLabel>Key findings</SectionLabel>
        <ul className="mt-3 space-y-3">
          {report.key_findings.map((f, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono text-[11px] text-foreground/40 pt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-foreground/85 leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      <div>
        <SectionLabel>Sources</SectionLabel>
        <ul className="mt-3 space-y-1.5">
          {report.sources.map((s) => (
            <li key={s.label} className="flex items-baseline gap-3 text-sm">
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 w-20 shrink-0">
                {s.kind}
              </span>
              <span className="text-foreground/80">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  bar,
}: {
  label: string;
  value: string;
  sub?: string;
  bar?: number;
}) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="serif text-3xl text-foreground tracking-tight">{value}</span>
        {sub && <span className="mono text-[10px] text-foreground/45">{sub}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-foreground/70 transition-all"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center mono text-[11px] px-2.5 py-1 rounded-full bg-muted text-foreground/75">
      {children}
    </span>
  );
}

function JsonView({ data }: { data: AnalyzeResponse }) {
  return (
    <div>
      <pre className="mono whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-[11px] leading-relaxed text-foreground/80">
{JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
