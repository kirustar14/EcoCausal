// src/components/MLDashboard.tsx
// Displays all three real ML results:
// 1. Random Forest temperature forecast
// 2. K-Means day clustering
// 3. Isolation Forest zone anomalies

import { useEffect, useState } from "react";
import { Brain, Thermometer, Layers, AlertTriangle, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────

type ForecastData = {
  model: string;
  n_train: number;
  n_test: number;
  performance: {
    r2_train: number;
    r2_test: number;
    mae_f: number;
    interpretation: string;
  };
  feature_importances: { feature: string; importance: number }[];
  forecast_next_12_readings: { step: number; hour: number; temp_f_predicted: number }[];
  recent_actual_vs_predicted: { actual: number; predicted: number; error: number }[];
};

type DayCluster = {
  cluster_id: number;
  label: string;
  color: string;
  description: string;
  n_days: number;
  pct_of_year: number;
  centroid: {
    pm25: number;
    tmax_f: number;
    tmin_f: number;
    precip_mm: number;
    scripps_temp_f: number;
    scripps_humidity_pct: number;
  };
  example_dates: string[];
};

type ClusterData = {
  n_days: number;
  n_clusters: number;
  features_used: string[];
  inertia: number;
  clusters: DayCluster[];
  key_finding: string;
};

type WindowResult = {
  window: string;
  n_readings: number;
  n_anomalies: number;
  anomaly_rate: number;
  mean_temp_f: number;
  mean_humidity: number;
  mean_heat_idx: number;
  top_anomalies: {
    date: string;
    hour: number;
    temp_f: number;
    humidity_pct: number;
    heat_index_f: number;
    anomaly_score: number;
  }[];
};

type ZoneAnomalyData = {
  n_total_readings: number;
  windows: WindowResult[];
  key_finding: string;
  anomaly_timeline: { date: string; window: string; temp_f: number; humidity: number; score: number }[];
};

// ── Sub-components ────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-background" />
      </div>
      <div>
        <div className="mono text-[9px] uppercase tracking-[0.22em] text-foreground/45">{subtitle}</div>
        <div className="serif text-base leading-tight">{title}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="ink-border rounded-lg p-3 text-center">
      <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/40 mb-1">{label}</div>
      <div className="serif text-2xl text-foreground">{value}</div>
      {sub && <div className="mono text-[9px] text-foreground/40 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Panel 1: Temperature Forecast ────────────────────────────────

function TemperatureForecastPanel() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API}/ml/temperature-forecast`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ink-border rounded-xl p-5 animate-pulse h-32 bg-foreground/5" />;
  if (!data || (data as any).error) return (
    <div className="ink-border rounded-xl p-5 mono text-[10px] text-foreground/40 uppercase tracking-[0.2em]">
      Temperature forecast unavailable
    </div>
  );

  const maxImportance = Math.max(...data.feature_importances.map(f => f.importance));
  const minTemp = Math.min(...data.forecast_next_12_readings.map(f => f.temp_f_predicted));
  const maxTemp = Math.max(...data.forecast_next_12_readings.map(f => f.temp_f_predicted));
  const range   = maxTemp - minTemp || 1;

  return (
    <div className="ink-border rounded-xl p-5">
      <SectionHeader
        icon={Thermometer}
        title="Next-reading temperature forecast"
        subtitle="Random Forest · Scripps AWN time-series"
      />

      {/* Performance stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox label="Test R²"  value={data.performance.r2_test.toFixed(3)} sub="held-out data" />
        <StatBox label="MAE"      value={`${data.performance.mae_f.toFixed(2)}°F`} sub="mean abs error" />
        <StatBox label="Training" value={`${data.n_train}`} sub="sensor readings" />
      </div>

      <p className="text-xs text-foreground/55 leading-relaxed mb-4">
        {data.performance.interpretation}
      </p>

      {/* 12-step forecast sparkline */}
      <div className="mb-4">
        <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/40 mb-2">
          Next 12 readings forecast
        </div>
        <div className="flex items-end gap-1 h-16">
          {data.forecast_next_12_readings.map((f, i) => {
            const pct = ((f.temp_f_predicted - minTemp) / range) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-foreground/80 transition-all"
                  style={{ height: `${Math.max(8, pct * 0.56 + 8)}px` }}
                  title={`Hour ${f.hour}: ${f.temp_f_predicted}°F`}
                />
                <span className="mono text-[7px] text-foreground/30">{f.hour}h</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mono text-[9px] text-foreground/40 mt-1">
          <span>{minTemp.toFixed(1)}°F</span>
          <span>{maxTemp.toFixed(1)}°F</span>
        </div>
      </div>

      {/* Feature importances */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between mono text-[9px] uppercase tracking-[0.18em] text-foreground/45 hover:text-foreground/70 transition-colors"
      >
        Feature importances
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          {data.feature_importances.map(f => (
            <div key={f.feature}>
              <div className="flex justify-between mb-0.5">
                <span className="mono text-[10px] text-foreground/65">{f.feature}</span>
                <span className="mono text-[10px] font-bold">{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${(f.importance / maxImportance) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="mono text-[9px] text-foreground/30 leading-relaxed pt-1">
            Current temperature dominates because temperature is highly autocorrelated.
            Hour of day is second — capturing the daily heating/cooling cycle.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Panel 2: Day Clusters ─────────────────────────────────────────

function DayClustersPanel() {
  const [data, setData] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/ml/day-clusters?n_clusters=4`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ink-border rounded-xl p-5 animate-pulse h-48 bg-foreground/5" />;
  if (!data || (data as any).error) return (
    <div className="ink-border rounded-xl p-5 mono text-[10px] text-foreground/40 uppercase tracking-[0.2em]">
      Day clusters unavailable
    </div>
  );

  return (
    <div className="ink-border rounded-xl p-5">
      <SectionHeader
        icon={Layers}
        title="Environmental day archetypes"
        subtitle={`K-Means · ${data.n_clusters} clusters · ${data.n_days} days`}
      />

      <p className="text-xs text-foreground/55 leading-relaxed mb-4">{data.key_finding}</p>

      {/* Cluster pills — proportional width */}
      <div className="mb-4">
        <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/40 mb-2">
          Day distribution
        </div>
        <div className="flex rounded-lg overflow-hidden h-6">
          {data.clusters.map(c => (
            <button
              key={c.cluster_id}
              onClick={() => setSelected(selected === c.cluster_id ? null : c.cluster_id)}
              className="flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ width: `${c.pct_of_year}%`, backgroundColor: c.color }}
              title={`${c.label}: ${c.pct_of_year}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.clusters.map(c => (
            <button
              key={c.cluster_id}
              onClick={() => setSelected(selected === c.cluster_id ? null : c.cluster_id)}
              className="flex items-center gap-1.5 mono text-[9px]"
            >
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-foreground/60">{c.label}</span>
              <span className="font-bold text-foreground">{c.pct_of_year}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cluster detail cards */}
      <div className="space-y-2">
        {data.clusters.map(c => (
          <div key={c.cluster_id}>
            <button
              onClick={() => setSelected(selected === c.cluster_id ? null : c.cluster_id)}
              className="w-full rounded-lg border-2 p-3 text-left hover:bg-muted/40 transition-colors"
              style={{ borderColor: c.color + "66" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="serif text-sm text-foreground">{c.label}</span>
                  <span className="mono text-[9px] text-foreground/45">{c.n_days} days</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="mono text-[10px] text-foreground/55">
                    {c.centroid.tmax_f.toFixed(1)}°F · {c.centroid.pm25.toFixed(1)} µg/m³
                  </span>
                  {selected === c.cluster_id
                    ? <ChevronUp className="h-3 w-3 text-foreground/35" />
                    : <ChevronDown className="h-3 w-3 text-foreground/35" />}
                </div>
              </div>
            </button>

            {selected === c.cluster_id && (
              <div className="border-x-2 border-b-2 rounded-b-lg px-4 pb-4 pt-3 space-y-3"
                style={{ borderColor: c.color + "66" }}>
                <p className="text-xs text-foreground/60 leading-relaxed">{c.description}</p>

                {/* Centroid stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["TMAX", `${c.centroid.tmax_f.toFixed(1)}°F`],
                    ["TMIN", `${c.centroid.tmin_f.toFixed(1)}°F`],
                    ["PM2.5", `${c.centroid.pm25.toFixed(1)} µg`],
                    ["Precip", `${c.centroid.precip_mm.toFixed(1)}mm`],
                    ["Humidity", `${c.centroid.scripps_humidity_pct.toFixed(0)}%`],
                    ["Scripps T", `${c.centroid.scripps_temp_f.toFixed(1)}°F`],
                  ].map(([label, val]) => (
                    <div key={label} className="text-center">
                      <div className="mono text-[8px] uppercase tracking-[0.16em] text-foreground/35">{label}</div>
                      <div className="mono text-[11px] font-bold text-foreground">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Example dates */}
                <div>
                  <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/35 mb-1.5">
                    Example dates
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.example_dates.map(d => (
                      <span key={d} className="mono text-[9px] px-2 py-0.5 rounded-full bg-foreground/8 text-foreground/55">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-foreground/10">
        <p className="mono text-[9px] text-foreground/30 leading-relaxed">
          Features: {data.features_used.join(" · ")} · Inertia: {data.inertia.toFixed(0)}
        </p>
      </div>
    </div>
  );
}

// ── Panel 3: Zone Anomalies ───────────────────────────────────────

function ZoneAnomaliesPanel() {
  const [data, setData] = useState<ZoneAnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openWindow, setOpenWindow] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/ml/zone-anomalies`)
      .then(r => r.json())
      .then(d => { setData(d); if (d.windows?.length) setOpenWindow(d.windows[0].window); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ink-border rounded-xl p-5 animate-pulse h-40 bg-foreground/5" />;
  if (!data || (data as any).error) return (
    <div className="ink-border rounded-xl p-5 mono text-[10px] text-foreground/40 uppercase tracking-[0.2em]">
      Zone anomalies unavailable
    </div>
  );

  const maxRate = Math.max(...data.windows.map(w => w.anomaly_rate));

  return (
    <div className="ink-border rounded-xl p-5">
      <SectionHeader
        icon={AlertTriangle}
        title="Anomalous readings by time window"
        subtitle={`Isolation Forest · ${data.n_total_readings} Scripps readings`}
      />

      <p className="text-xs text-foreground/55 leading-relaxed mb-4">{data.key_finding}</p>

      {/* Window comparison bars */}
      <div className="space-y-2 mb-4">
        {data.windows.map(w => (
          <div key={w.window}>
            <button
              onClick={() => setOpenWindow(openWindow === w.window ? null : w.window)}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="mono text-[10px] text-foreground/65">{w.window}</span>
                <div className="flex items-center gap-3">
                  <span className="mono text-[10px] text-foreground/50">{w.n_anomalies} flagged</span>
                  <span className={`mono text-[10px] font-bold ${w.anomaly_rate === maxRate ? "text-amber-600" : "text-foreground"}`}>
                    {w.anomaly_rate.toFixed(1)}%
                  </span>
                  {openWindow === w.window
                    ? <ChevronUp className="h-3 w-3 text-foreground/35" />
                    : <ChevronDown className="h-3 w-3 text-foreground/35" />}
                </div>
              </div>
              <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(w.anomaly_rate / maxRate) * 100}%`,
                    backgroundColor: w.anomaly_rate === maxRate ? "#f59e0b" : "#1a1a2e",
                  }}
                />
              </div>
            </button>

            {openWindow === w.window && (
              <div className="mt-2 pl-2 border-l-2 border-foreground/15 space-y-2">
                <div className="flex gap-4">
                  <span className="mono text-[9px] text-foreground/50">Avg temp: {w.mean_temp_f}°F</span>
                  <span className="mono text-[9px] text-foreground/50">Humidity: {w.mean_humidity}%</span>
                  <span className="mono text-[9px] text-foreground/50">Heat idx: {w.mean_heat_idx}°F</span>
                </div>
                <div className="mono text-[9px] uppercase tracking-[0.16em] text-foreground/35 mt-2 mb-1">
                  Most anomalous readings
                </div>
                {w.top_anomalies.map((a, i) => (
                  <div key={i} className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        {a.date} · {a.hour}:00
                      </span>
                      <span className="mono text-[9px] text-amber-600">score {a.anomaly_score.toFixed(3)}</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <span className="mono text-[9px] text-amber-700 dark:text-amber-400">Temp: {a.temp_f}°F</span>
                      <span className="mono text-[9px] text-amber-700 dark:text-amber-400">Humidity: {a.humidity_pct}%</span>
                      <span className="mono text-[9px] text-amber-700 dark:text-amber-400">HI: {a.heat_index_f}°F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mono text-[9px] text-foreground/30 leading-relaxed">
        Isolation Forest fit independently per time window on [temp, humidity, heat_index]. Contamination=0.1.
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────

export function MLDashboard() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="pop-card bg-card mt-6">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-background" />
          </div>
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50 mb-0.5">
              sklearn · 3 real ML models
            </div>
            <div className="serif text-lg leading-tight">ML Analysis</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-2">
            <span className="stamp tag-paper">Random Forest</span>
            <span className="stamp tag-paper">K-Means</span>
            <span className="stamp tag-paper">Isolation Forest</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-foreground/40" /> : <ChevronDown className="h-4 w-4 text-foreground/40" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-foreground/10 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TemperatureForecastPanel />
            <DayClustersPanel />
            <ZoneAnomaliesPanel />
          </div>
        </div>
      )}
    </div>
  );
}