// src/components/CampusRiskClusters.tsx
// K-Means cluster panel — drop into scripps.tsx below the heatmap grid.
// Shows the 3 discovered clusters from /campus-risk-clusters with zone breakdowns.

import { useEffect, useState } from "react";
import { Layers, Thermometer, Droplets, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type ZoneInCluster = {
  zone: string;
  mean_temp_f: number;
  mean_humidity: number;
  temp_std: number;
  heat_index_f: number;
  peak_temp_f: number;
};

type Cluster = {
  label: string;
  color: string;
  risk: "HIGH" | "MODERATE" | "LOW";
  description: string;
  cluster_id: number;
  zone_count: number;
  zones: ZoneInCluster[];
  cluster_stats: {
    mean_temp_f: number;
    mean_hi_f: number;
    mean_humidity: number;
  };
};

type ClustersResponse = {
  model: string;
  features_used: string[];
  data_source: string;
  n_zones: number;
  clusters: Cluster[];
  key_finding: string;
  generated_at: string;
};

const RISK_STYLES = {
  HIGH: {
    badge:    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
    dot:      "bg-red-500",
    ring:     "ring-red-200 dark:ring-red-900",
    zonePill: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  },
  MODERATE: {
    badge:    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    dot:      "bg-amber-500",
    ring:     "ring-amber-200 dark:ring-amber-900",
    zonePill: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  LOW: {
    badge:    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    dot:      "bg-emerald-500",
    ring:     "ring-emerald-200 dark:ring-emerald-900",
    zonePill: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
};

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const [open, setOpen] = useState(cluster.risk === "HIGH");
  const s = RISK_STYLES[cluster.risk];

  return (
    <div className={`ink-border rounded-xl overflow-hidden ring-1 ${s.ring}`}>
      {/* Card header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`stamp border ${s.badge}`}>{cluster.risk}</span>
              <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                {cluster.zone_count} {cluster.zone_count === 1 ? "zone" : "zones"}
              </span>
            </div>
            <div className="serif text-base leading-snug text-foreground">{cluster.label}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:block text-right">
            <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40">Avg heat index</div>
            <div className="mono text-sm font-bold text-foreground">{cluster.cluster_stats.mean_hi_f.toFixed(1)}°F</div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40">Avg temp</div>
            <div className="mono text-sm font-bold text-foreground">{cluster.cluster_stats.mean_temp_f.toFixed(1)}°F</div>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-foreground/35" /> : <ChevronDown className="h-4 w-4 text-foreground/35" />}
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div className="px-4 pb-4 border-t border-foreground/10 pt-3 space-y-3">
          <p className="text-sm text-foreground/60 leading-relaxed">{cluster.description}</p>

          {/* Stat row */}
          <div className="flex gap-5">
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-3 w-3 text-foreground/40" />
              <span className="mono text-[10px] text-foreground/55">
                {cluster.cluster_stats.mean_temp_f.toFixed(1)}°F avg
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-foreground/40" />
              <span className="mono text-[10px] text-foreground/55">
                {cluster.cluster_stats.mean_hi_f.toFixed(1)}°F heat index
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3 w-3 text-foreground/40" />
              <span className="mono text-[10px] text-foreground/55">
                {cluster.cluster_stats.mean_humidity.toFixed(0)}% humidity
              </span>
            </div>
          </div>

          {/* Zone pills with per-zone detail */}
          <div>
            <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/40 mb-2">Zones in cluster</div>
            <div className="flex flex-wrap gap-2">
              {cluster.zones.map((z) => (
                <div
                  key={z.zone}
                  className={`rounded-lg border px-2.5 py-1.5 ${s.zonePill}`}
                  title={`Peak: ${z.peak_temp_f.toFixed(1)}°F · HI: ${z.heat_index_f.toFixed(1)}°F`}
                >
                  <div className="mono text-[10px] font-bold leading-tight">{z.zone}</div>
                  <div className="mono text-[9px] opacity-70">
                    {z.mean_temp_f.toFixed(1)}°F · {z.mean_humidity.toFixed(0)}% RH
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CampusRiskClusters() {
  const [data, setData]       = useState<ClustersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(`${API}/campus-risk-clusters`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pop-card bg-card p-5 mt-5 space-y-2 animate-pulse">
        <div className="h-3 w-40 rounded bg-foreground/10" />
        <div className="h-24 rounded-xl bg-foreground/10" />
        <div className="h-24 rounded-xl bg-foreground/10" />
        <div className="h-24 rounded-xl bg-foreground/10" />
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="pop-card bg-card p-5 mt-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
          <Layers className="h-4 w-4 text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-0.5">
            K-Means · 3 clusters · {data.data_source}
          </div>
          <div className="serif text-lg leading-tight text-foreground">
            Campus risk clusters
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className="stamp tag-paper">{data.n_zones} zones</span>
          <span className="stamp tag-blue">sklearn</span>
        </div>
      </div>

      {/* Key finding callout */}
      <div className="mb-4 rounded-lg bg-foreground/5 border border-foreground/10 px-4 py-3">
        <div className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/40 mb-1">Key finding</div>
        <p className="text-sm text-foreground/75 leading-relaxed">{data.key_finding}</p>
      </div>

      {/* Cluster cards */}
      <div className="space-y-3">
        {data.clusters.map((c) => (
          <ClusterCard key={c.cluster_id} cluster={c} />
        ))}
      </div>

      {/* Features footer */}
      <div className="mt-4 pt-3 border-t border-foreground/10 flex flex-wrap gap-1.5">
        <span className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/35 mr-1">Features:</span>
        {data.features_used.map((f) => (
          <span key={f} className="stamp tag-paper">{f}</span>
        ))}
      </div>
    </div>
  );
}