// src/components/MLResults.tsx
// Rewritten: strips fake R² claims, leads with Isolation Forest anomaly history.
// Random Forest is reframed as "feature importance" only — not a predictive model claim.
// Ridge is removed from the headline; shown only as a supporting signal.

import { useEffect, useState } from "react";
import { Brain, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Types from /analyze ──────────────────────────────────────────

type FeatureImportance = {
  feature: string;
  importance: number;
  rank: number;
};

type MLResult = {
  n_samples: number;
  features: string[];
  random_forest: {
    r2_train: number;
    r2_cv_mean: number;
    r2_cv_std: number;
    feature_importances: FeatureImportance[];
    top_predictor: string;
  };
  ridge_regression: {
    r2_train: number;
    r2_cv_mean: number;
    coefficients: { feature: string; coefficient: number; direction: "positive" | "negative" }[];
  };
  anomaly_detection: {
    model: string;
    n_anomalies: number;
    anomaly_rate: number;
    top_anomalies: {
      date: string;
      anomaly_score: number;
      pm25: number;
      tmax_f: number;
      scripps_temp?: number;
      humidity?: number;
    }[];
  };
};

// ── Types from /campus-alert/history ────────────────────────────

type HistoricalAnomaly = {
  date: string;
  anomaly_score: number;
  level: "SAFE" | "CAUTION" | "ALERT";
  pm25_ug_m3: number;
  temp_f: number;
  humidity_pct: number;
  heat_index_f: number;
  why_anomalous: string;
};

type AnomalyHistory = {
  model: string;
  n_days_analyzed: number;
  n_anomalies: number;
  anomaly_rate_pct: number;
  top_anomalous_days: HistoricalAnomaly[];
  what_this_means: string;
  data_sources: string[];
};

const LEVEL_PILL = {
  SAFE:    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  CAUTION: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  ALERT:   "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

export function MLResults({ ml }: { ml: MLResult | null }) {
  const [expanded, setExpanded]           = useState(false);
  const [history, setHistory]             = useState<AnomalyHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch anomaly history only when the card is expanded
  useEffect(() => {
    if (!expanded || history) return;
    setHistoryLoading(true);
    fetch(`${API}/campus-alert/history?top_n=8`)
      .then((r) => r.json())
      .then(setHistory)
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [expanded, history]);

  if (!ml) return null;

  const maxImportance = Math.max(...ml.random_forest.feature_importances.map((f) => f.importance));

  return (
    <div className="pop-card bg-card mt-6">
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-background" />
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-0.5">
              sklearn · Random Forest + Isolation Forest
            </div>
            <div className="serif text-lg leading-tight">ML Analysis</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Summary pills — honest framing */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
              top environmental driver
            </div>
            <div className="mono text-sm font-bold text-foreground">
              {ml.random_forest.top_predictor}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
              anomalous days flagged
            </div>
            <div className={`mono text-sm font-bold ${ml.anomaly_detection.n_anomalies > 0 ? "text-amber-600" : "text-foreground"}`}>
              {ml.anomaly_detection.n_anomalies} / {ml.n_samples}
            </div>
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-foreground/40" />
            : <ChevronDown className="h-4 w-4 text-foreground/40" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-foreground/10 space-y-5 mt-0 pt-4">

          {/* ── Section 1: Anomaly detection — THE headline result ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                Isolation Forest — what we actually found
              </span>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="ink-border rounded-lg p-3 text-center">
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40 mb-1">Days analyzed</div>
                <div className="serif text-2xl text-foreground">{ml.n_samples}</div>
              </div>
              <div className="ink-border rounded-lg p-3 text-center">
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40 mb-1">Anomalies found</div>
                <div className={`serif text-2xl ${ml.anomaly_detection.n_anomalies > 0 ? "text-amber-600" : "text-foreground"}`}>
                  {ml.anomaly_detection.n_anomalies}
                </div>
              </div>
              <div className="ink-border rounded-lg p-3 text-center">
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40 mb-1">Anomaly rate</div>
                <div className="serif text-2xl text-foreground">
                  {(ml.anomaly_detection.anomaly_rate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Historical anomaly list from /campus-alert/history */}
            <div className="ink-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                  Most anomalous historical days
                </span>
              </div>

              {historyLoading && (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-foreground/8" />
                  ))}
                </div>
              )}

              {history && (
                <>
                  <p className="text-xs text-foreground/55 leading-relaxed mb-3">
                    {history.what_this_means}
                  </p>
                  <div className="space-y-2">
                    {history.top_anomalous_days.map((day, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border px-3 py-2.5 ${LEVEL_PILL[day.level]}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="mono text-[10px] font-bold">{day.date}</span>
                            <span className={`stamp border text-[9px] ${LEVEL_PILL[day.level]}`}>
                              {day.level}
                            </span>
                          </div>
                          <span className="mono text-[9px] opacity-60">
                            score {day.anomaly_score.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mb-1">
                          <span className="mono text-[9px] opacity-75">PM2.5: {day.pm25_ug_m3}µg/m³</span>
                          <span className="mono text-[9px] opacity-75">Temp: {day.temp_f}°F</span>
                          <span className="mono text-[9px] opacity-75">HI: {day.heat_index_f}°F</span>
                          <span className="mono text-[9px] opacity-75">Hum: {day.humidity_pct}%</span>
                        </div>
                        <p className="mono text-[9px] opacity-60 leading-relaxed">{day.why_anomalous}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Fallback: top anomalies from /analyze if history not loaded */}
              {!history && !historyLoading && ml.anomaly_detection.top_anomalies.map((a, i) => (
                <div key={i} className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5 mb-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="mono text-[10px] font-bold text-amber-800 dark:text-amber-300">{a.date}</span>
                    <span className="mono text-[9px] text-amber-600">score {a.anomaly_score.toFixed(3)}</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className="mono text-[9px] text-amber-700 dark:text-amber-400">PM2.5: {a.pm25}</span>
                    <span className="mono text-[9px] text-amber-700 dark:text-amber-400">TMAX: {a.tmax_f}°F</span>
                    {a.humidity != null && <span className="mono text-[9px] text-amber-700 dark:text-amber-400">Hum: {a.humidity}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2: Feature importance — reframed honestly ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-foreground/60" />
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                Random Forest — which environmental factors matter most
              </span>
            </div>
            <div className="ink-border rounded-xl p-4">
              <p className="text-xs text-foreground/55 leading-relaxed mb-3">
                Trained on {ml.n_samples} days of EPA, NOAA, and Scripps data.
                Feature importances show which environmental variables drive the most
                variance in campus conditions — not a disease prediction.
              </p>
              <div className="space-y-2">
                {ml.random_forest.feature_importances.map((f) => (
                  <div key={f.feature}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="mono text-[10px] text-foreground/70 truncate pr-2">{f.feature}</span>
                      <span className="mono text-[10px] font-bold text-foreground flex-shrink-0">
                        {(f.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${(f.importance / maxImportance) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-foreground/10">
                <p className="mono text-[9px] text-foreground/35 leading-relaxed">
                  Note: R² is not reported here. The regression target is a county-level
                  health prevalence proxy — not an individual-level outcome — so R² would
                  not reflect true predictive power.
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="pt-1 border-t border-foreground/10 flex flex-wrap gap-1.5">
            <span className="stamp tag-paper">RandomForestRegressor · 100 estimators</span>
            <span className="stamp tag-paper">IsolationForest · contamination=0.1</span>
            <span className="stamp tag-paper">n={ml.n_samples} observations</span>
            <span className="stamp tag-paper">EPA · NOAA · Scripps AWN</span>
          </div>
        </div>
      )}
    </div>
  );
}