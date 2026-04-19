import type { AnalyzeResponse } from "@/lib/mock-analyze";
import { ForceGraph } from "./ForceGraph";

type Props = {
  data: AnalyzeResponse;
};

const LEGEND: { label: string; dot: string }[] = [
  { label: "Pollutant", dot: "bg-foreground" },
  { label: "Gene", dot: "bg-foreground/55" },
  { label: "Pathway", dot: "bg-foreground/30" },
  { label: "Outcome", dot: "bg-foreground/10 border border-foreground/30" },
];

export function GraphPanel({ data }: Props) {
  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
          Fig. 01 · Causal graph
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
          drag to rearrange
        </span>
      </div>

      <div className="relative flex-1 rounded-2xl bg-muted/40 overflow-hidden">
        <ForceGraph nodes={data.graph.nodes} links={data.graph.links} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-2 text-xs text-foreground/65">
            <span className={`h-2 w-2 rounded-full ${l.dot}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
