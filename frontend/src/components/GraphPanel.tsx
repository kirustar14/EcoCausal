import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/mock-analyze";

type Props = { data: AnalyzeResponse };

const NODE_W = 148;
const NODE_H = 52;
const CORNER = 8;

type Colors = { fill: string; stroke: string; text: string; badge: string };

function getColors(type: string, dark: boolean): Colors {
  if (dark) {
    const map: Record<string, Colors> = {
      pollutant: { fill: "#3b1208", stroke: "#F0997B", text: "#FAECE7", badge: "#F0997B" },
      gene:      { fill: "#1a1640", stroke: "#AFA9EC", text: "#EEEDFE", badge: "#AFA9EC" },
      disease:   { fill: "#052b1e", stroke: "#5DCAA5", text: "#E1F5EE", badge: "#5DCAA5" },
      outcome:   { fill: "#052b1e", stroke: "#5DCAA5", text: "#E1F5EE", badge: "#5DCAA5" },
      pathway:   { fill: "#2a1800", stroke: "#EF9F27", text: "#FEF3C7", badge: "#EF9F27" },
    };
    return map[type] ?? map.gene;
  }
  const map: Record<string, Colors> = {
    pollutant: { fill: "#FAECE7", stroke: "#D85A30", text: "#4A1B0C", badge: "#D85A30" },
    gene:      { fill: "#EEEDFE", stroke: "#7F77DD", text: "#26215C", badge: "#7F77DD" },
    disease:   { fill: "#E1F5EE", stroke: "#1D9E75", text: "#04342C", badge: "#1D9E75" },
    outcome:   { fill: "#E1F5EE", stroke: "#1D9E75", text: "#04342C", badge: "#1D9E75" },
    pathway:   { fill: "#FEF3C7", stroke: "#BA7517", text: "#412402", badge: "#BA7517" },
  };
  return map[type] ?? map.gene;
}

export function GraphPanel({ data }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const nodes = data.graph?.nodes ?? [];
  const edges = data.graph?.links ?? (data.graph as any)?.edges ?? [];

  if (!nodes.length) {
    return (
      <div className="pop-card bg-card flex items-center justify-center h-64">
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          No graph data
        </span>
      </div>
    );
  }

  const pollutants  = nodes.filter((n: any) => n.type === "pollutant");
  const genes       = nodes.filter((n: any) => n.type === "gene");
  const outcomes    = nodes.filter((n: any) => n.type === "outcome" || n.type === "disease");
  const pathways    = nodes.filter((n: any) => n.type === "pathway");
  const middleNodes = [...genes, ...pathways];

  const COL_X = { left: 60, middle: 266, right: 472 };
  const positioned: Record<string, { x: number; y: number }> = {};
  const SVG_H = Math.max(380, middleNodes.length * 72 + 80);

  const placeCol = (list: any[], colX: number) => {
    const spacing = SVG_H / (list.length + 1);
    list.forEach((n: any, i: number) => {
      positioned[n.id] = { x: colX, y: Math.round(spacing * (i + 1)) };
    });
  };

  placeCol(pollutants,  COL_X.left);
  placeCol(middleNodes, COL_X.middle);
  placeCol(outcomes,    COL_X.right);

  const maxWeight = Math.max(...edges.map((e: any) => e.weight ?? 0.5), 0.1);

  const edgePath = (src: string, tgt: string) => {
    const s = positioned[src];
    const t = positioned[tgt];
    if (!s || !t) return null;
    const x1 = s.x + NODE_W, y1 = s.y;
    const x2 = t.x,          y2 = t.y;
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  };

  const muted  = dark ? "#555" : "#aaa";
  const border = dark ? "#2a2a2a" : "#e5e5e5";

  return (
    <div className="pop-card bg-card overflow-hidden">
      <div className="p-4 border-b border-foreground/10">
        <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-0.5">
          Causal graph
        </div>
        <div className="serif text-lg leading-tight">
          {data.env_factor} → {data.outcome}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 680 ${SVG_H + 60}`}
          role="img" style={{ display: "block" }}>
          <defs>
            <marker id="gp-arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke={muted}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          {/* Column labels */}
          {[
            { x: COL_X.left   + NODE_W / 2, label: "Exposure" },
            { x: COL_X.middle + NODE_W / 2, label: "Mediator genes" },
            { x: COL_X.right  + NODE_W / 2, label: "Outcome" },
          ].map(({ x, label }) => (
            <text key={label} x={x} y={26} textAnchor="middle"
              fontSize={10} fill={muted} fontFamily="var(--font-mono, monospace)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {label}
            </text>
          ))}

          {/* Dividers */}
          {[COL_X.middle - 18, COL_X.right - 18].map(x => (
            <line key={x} x1={x} y1={36} x2={x} y2={SVG_H + 40}
              stroke={border} strokeWidth={0.5} strokeDasharray="4 4"/>
          ))}

          {/* Edges */}
          {edges.map((e: any, i: number) => {
            const path = edgePath(e.source, e.target);
            if (!path) return null;
            const w = e.weight ?? 0.5;
            return (
              <path key={i} d={path} fill="none" stroke={muted}
                strokeWidth={0.8 + (w / maxWeight) * 2.4}
                opacity={0.25 + (w / maxWeight) * 0.65}
                markerEnd="url(#gp-arrow)"/>
            );
          })}

          {/* Nodes */}
          {nodes.map((n: any) => {
            const pos = positioned[n.id];
            if (!pos) return null;
            const c = getColors(n.type, dark);
            const typeLabel =
              n.type === "pollutant" ? "Exposure" :
              n.type === "gene"      ? "Gene" :
              n.type === "pathway"   ? "Pathway" : "Outcome";
            const displayLabel = n.label.length > 18
              ? n.label.slice(0, 16) + "…"
              : n.label;

            return (
              <g key={n.id}>
                <rect x={pos.x} y={pos.y - NODE_H / 2}
                  width={NODE_W} height={NODE_H} rx={CORNER}
                  fill={c.fill} stroke={c.stroke} strokeWidth={1.5}/>

                {/* Type badge — small, above center */}
                <text x={pos.x + NODE_W / 2} y={pos.y - 7}
                  textAnchor="middle" fontSize={8} fill={c.badge}
                  fontFamily="var(--font-mono, monospace)"
                  style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {typeLabel}
                </text>

                {/* Actual label — gene name, exposure name, etc. */}
                <text x={pos.x + NODE_W / 2} y={pos.y + 9}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={12} fontWeight={600} fill={c.text}
                  fontFamily="var(--font-sans, sans-serif)">
                  {displayLabel}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(40, ${SVG_H + 14})`}>
            {[
              { type: "pollutant", label: "Exposure" },
              { type: "gene",      label: "Gene" },
              { type: "outcome",   label: "Outcome" },
            ].map(({ type, label }, i) => {
              const c = getColors(type, dark);
              return (
                <g key={label} transform={`translate(${i * 110}, 0)`}>
                  <rect width={12} height={12} rx={3}
                    fill={c.fill} stroke={c.stroke} strokeWidth={1.5}/>
                  <text x={18} y={10} fontSize={11} fill={muted}
                    fontFamily="var(--font-sans, sans-serif)">{label}</text>
                </g>
              );
            })}
            <g transform="translate(360, 0)">
              <line x1={0} y1={6} x2={18} y2={6} stroke={muted} strokeWidth={2.5} opacity={0.8}/>
              <text x={24} y={10} fontSize={11} fill={muted} fontFamily="var(--font-sans, sans-serif)">Strong</text>
            </g>
            <g transform="translate(440, 0)">
              <line x1={0} y1={6} x2={18} y2={6} stroke={muted} strokeWidth={0.8} opacity={0.5}/>
              <text x={24} y={10} fontSize={11} fill={muted} fontFamily="var(--font-sans, sans-serif)">Weak</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}