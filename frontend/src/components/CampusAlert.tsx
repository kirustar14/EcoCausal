// src/components/CampusAlert.tsx
// Daily campus environmental risk card — fuses Scripps + EPA + NWS heat index + Isolation Forest.
// Drop into results.tsx (after ExperimentSummary) and/or index.tsx (below ChatInput).

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, Thermometer, Wind, Droplets, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Factor = {
  value: number;
  level: "SAFE" | "CAUTION" | "ALERT";
  threshold_caution: number;
  threshold_alert: number;
  unit: string;
  source: string;
};

type AnomalyFlag = {
  flagged: boolean;
  anomaly_score?: number;
  interpretation?: string;
  reason?: string;
};

type AlertResponse = {
  level: "SAFE" | "CAUTION" | "ALERT";
  color: string;
  date: string;
  factors: {
    temperature_f: Factor;
    humidity_pct: Factor;
    pm25_ug_m3: Factor;
    heat_index_f: Factor;
  };
  anomaly: AnomalyFlag;
  recommendations: string[];
  data_sources: string[];
  generated_at: string;
};

const LEVEL_CONFIG = {
  SAFE: {
    icon: ShieldCheck,
    label: "Safe conditions",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-300 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    bar: "bg-emerald-500",
  },
  CAUTION: {
    icon: ShieldAlert,
    label: "Caution advised",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    bar: "bg-amber-500",
  },
  ALERT: {
    icon: ShieldX,
    label: "Alert — act now",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-800 dark:text-red-300",
    badge: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
    bar: "bg-red-500",
  },
};

const FACTOR_LEVEL_COLORS = {
  SAFE:    "text-emerald-700 dark:text-emerald-400",
  CAUTION: "text-amber-700 dark:text-amber-400",
  ALERT:   "text-red-700 dark:text-red-400",
};

function FactorBar({ value, caution, alert, unit }: { value: number; caution: number; alert: number; unit: string }) {
  // Normalize to 0–100 where alert threshold = 90%
  const pct = Math.min(100, Math.round((value / (alert * 1.1)) * 100));
  const cautionPct = Math.round((caution / (alert * 1.1)) * 100);
  const alertPct  = Math.round((alert  / (alert * 1.1)) * 100);

  return (
    <div className="relative mt-1.5 h-1.5 w-full rounded-full bg-foreground/10 overflow-visible">
      {/* caution marker */}
      <div
        className="absolute top-0 h-1.5 w-px bg-amber-400 z-10"
        style={{ left: `${cautionPct}%` }}
      />
      {/* alert marker */}
      <div
        className="absolute top-0 h-1.5 w-px bg-red-400 z-10"
        style={{ left: `${alertPct}%` }}
      />
      {/* fill */}
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: value >= alert ? "#ef4444" : value >= caution ? "#f59e0b" : "#10b981",
        }}
      />
    </div>
  );
}

export function CampusAlert({ compact = false }: { compact?: boolean }) {
  const [data, setData]       = useState<AlertResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API}/campus-alert`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pop-card bg-card p-5 flex items-center gap-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-foreground/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 rounded bg-foreground/10" />
          <div className="h-2 w-48 rounded bg-foreground/10" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pop-card bg-card p-5 mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
        Campus alert unavailable
      </div>
    );
  }

  const cfg   = LEVEL_CONFIG[data.level];
  const Icon  = cfg.icon;
  const f     = data.factors;

  const factorRows = [
    { key: "temp",     label: "Temperature",  icon: Thermometer, factor: f.temperature_f },
    { key: "hi",       label: "Heat index",   icon: Thermometer, factor: f.heat_index_f  },
    { key: "humidity", label: "Humidity",     icon: Droplets,    factor: f.humidity_pct  },
    { key: "pm25",     label: "PM2.5",        icon: Wind,        factor: f.pm25_ug_m3    },
  ];

  return (
    <div className={`pop-card border-2 ${cfg.border} ${compact ? "p-4" : "p-5"}`}>
      {/* ── Header row ── */}
      <button
        onClick={() => !compact && setExpanded((e) => !e)}
        className={`w-full flex items-center justify-between gap-4 ${compact ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badge} border`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-0.5">
              Campus alert · {data.date}
            </div>
            <div className={`serif text-xl leading-tight ${cfg.text}`}>
              {cfg.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Quick factor pills */}
          <div className="hidden sm:flex items-center gap-2">
            {factorRows.map(({ key, label, factor }) => (
              <div key={key} className="text-center">
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40">{label}</div>
                <div className={`mono text-[11px] font-bold ${FACTOR_LEVEL_COLORS[factor.level]}`}>
                  {Math.round(factor.value)}{factor.unit}
                </div>
              </div>
            ))}
          </div>
          {!compact && (
            expanded
              ? <ChevronUp className="h-4 w-4 text-foreground/40" />
              : <ChevronDown className="h-4 w-4 text-foreground/40" />
          )}
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {(expanded || compact) && (
        <div className="mt-4 border-t border-foreground/10 pt-4 space-y-4">

          {/* Factor bars */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {factorRows.map(({ key, label, icon: FactorIcon, factor }) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FactorIcon className="h-3 w-3 text-foreground/40" />
                    <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                      {label}
                    </span>
                  </div>
                  <span className={`mono text-[11px] font-bold ${FACTOR_LEVEL_COLORS[factor.level]}`}>
                    {factor.value.toFixed(1)}{factor.unit}
                  </span>
                </div>
                <FactorBar
                  value={factor.value}
                  caution={factor.threshold_caution}
                  alert={factor.threshold_alert}
                  unit={factor.unit}
                />
                <div className="mt-0.5 flex justify-between mono text-[8px] text-foreground/30">
                  <span>caution ≥{factor.threshold_caution}</span>
                  <span>alert ≥{factor.threshold_alert}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Anomaly flag */}
          {data.anomaly.flagged && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400 mb-0.5">
                  Isolation Forest flag
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {data.anomaly.interpretation}
                  {data.anomaly.anomaly_score !== undefined && (
                    <span className="ml-1 opacity-60">(score: {data.anomaly.anomaly_score.toFixed(3)})</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-2">
              Recommended actions
            </div>
            <ul className="space-y-1.5">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.bar}`} />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-foreground/10 flex flex-wrap gap-1.5">
            {data.data_sources.map((s) => (
              <span key={s} className="stamp tag-paper">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}