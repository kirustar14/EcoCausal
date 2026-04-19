import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { Slider } from "@/components/ui/slider";
import { setQuestion } from "@/lib/run-store";
import { ArrowRight, Thermometer } from "lucide-react";
import { fetchScripps, type ScrippsResponse } from "@/lib/api";

export const Route = createFileRoute("/scripps")({
  component: ScrippsPage,
  head: () => ({
    meta: [
      { title: "Scripps Heat Map · Watson & Crick" },
      {
        name: "description",
        content:
          "UCSD campus heat map from Scripps Institution of Oceanography. Explore urban heat island effects across campus zones.",
      },
    ],
  }),
});

type Metric = "temp_f" | "humidity" | "heat_index";
type TimeOfDay = "morning" | "afternoon" | "evening";

const TIME_LABELS: { key: TimeOfDay; label: string }[] = [
  { key: "morning",   label: "Morning"   },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening",   label: "Evening"   },
];

function colorFor(metric: Metric, value: number): string {
  let t = 0;
  if (metric === "temp_f")     t = (value - 50) / 45;
  else if (metric === "humidity")   t = (value - 40) / 55;
  else                              t = (value - 50) / 50;
  t = Math.max(0, Math.min(1, t));
  const hue       = 245 - t * 220;
  const lightness = 0.78 - t * 0.18;
  const chroma    = 0.12 + t * 0.08;
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function ScrippsPage() {
  const navigate = useNavigate();
  const [metric, setMetric]   = useState<Metric>("temp_f");
  const [timeIdx, setTimeIdx] = useState(1); // afternoon
  const [data, setData]       = useState<ScrippsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const currentTime = TIME_LABELS[timeIdx].key;

  // Fetch whenever time changes
  useEffect(() => {
    setLoading(true);
    fetchScripps(currentTime)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentTime]);

  const values = useMemo(() => {
    if (!data) return [];
    return data.zones.map((z) => ({ name: z.zone, value: z[metric], risk: z.risk, zone: z }));
  }, [data, metric]);

  const max     = values.length ? Math.max(...values.map((v) => v.value)) : 0;
  const min     = values.length ? Math.min(...values.map((v) => v.value)) : 0;
  const avg     = values.length ? values.reduce((s, v) => s + v.value, 0) / values.length : 0;
  const hottest = values.length ? values.reduce((a, b) => (a.value > b.value ? a : b)) : null;

  const unit        = metric === "humidity" ? "%" : "°F";
  const metricLabel = metric === "temp_f" ? "Temperature" : metric === "humidity" ? "Humidity" : "Heat Index";

  const runCorrelation = () => {
    setQuestion("How does urban heat stress on the UCSD campus correlate with cardiovascular health outcomes?");
    navigate({ to: "/run" });
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Heat Map · UCSD Campus
            </div>
            <h1 className="serif text-4xl sm:text-5xl text-foreground leading-tight">
              The campus is <em>not</em> one temperature.
            </h1>
            <p className="mt-3 text-foreground/60 max-w-xl">
              Real microclimate readings from 12 zones. Watch the heat island bloom across
              concrete and dissipate by the shore.
            </p>
          </div>
          <div className="stamp tag-paper">
            <Thermometer className="inline h-3 w-3 mr-1" />
            Scripps Institution of Oceanography — UCSD Campus Heat Mapping Study
          </div>
        </div>

        <div className="mt-6 flex items-end gap-6">
          <div className="flex flex-col items-center">
            <div className="bubble bubble-left mb-3 max-w-[220px] text-sm">
              <p className="text-foreground/80 leading-snug">
                {data?.summary.data_source === "Scripps AWN sensors (real)"
                  ? "This is live Scripps AWN sensor data from the UCSD campus."
                  : "Scripps Institution has been tracking this campus heat data for years…"}
              </p>
            </div>
            <Scientist who="watson" size={84} />
          </div>
          <div className="flex flex-col items-center ml-auto">
            <div className="bubble bubble-right mb-3 max-w-[240px] text-sm">
              <p className="text-foreground/80 leading-snug text-right">
                Notice how the heat island effect concentrates near concrete structures.
              </p>
            </div>
            <Scientist who="crick" size={84} />
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-4">
        <div className="pop-card bg-card p-5">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-2">
              {(["temp_f", "humidity", "heat_index"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 rounded-full transition-colors ${
                    metric === m ? "bg-foreground text-background" : "ink-border bg-card hover:bg-muted"
                  }`}
                >
                  {m === "heat_index" ? "Heat Index" : m === "temp_f" ? "Temperature" : "Humidity"}
                </button>
              ))}
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
              Time of day · {TIME_LABELS[timeIdx].label}
              {data && <span className="ml-2 text-foreground/35">({data.hour_range})</span>}
            </div>
          </div>

          <div className="mt-5">
            <Slider
              value={[timeIdx]}
              min={0}
              max={2}
              step={1}
              onValueChange={(v) => setTimeIdx(v[0])}
            />
            <div className="mt-2 flex justify-between mono text-[9px] uppercase tracking-[0.18em] text-foreground/45">
              {TIME_LABELS.map((t) => <span key={t.key}>{t.label}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap + Stats */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Heatmap grid */}
          <div className="lg:col-span-2 pop-card bg-card p-5">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-3">
              {metricLabel} · {TIME_LABELS[timeIdx].label}
              {data?.summary.data_source && (
                <span className="ml-2 text-foreground/35">· {data.summary.data_source}</span>
              )}
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                Loading sensor data…
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {values.map((v) => (
                  <div
                    key={v.name}
                    className="rounded-md ink-border p-3 flex flex-col justify-between min-h-[88px] transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: colorFor(metric, v.value) }}
                  >
                    <div className="text-[11px] font-medium text-foreground leading-tight">{v.name}</div>
                    <div>
                      <div className="serif text-2xl text-foreground">
                        {Math.round(v.value)}
                        <span className="text-xs ml-0.5 text-foreground/70">{unit}</span>
                      </div>
                      {v.risk === "HIGH" && (
                        <div className="mono text-[9px] uppercase tracking-[0.18em] text-red-600 mt-0.5">High risk</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-5 flex items-center gap-3">
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/50">Cool</span>
              <div
                className="h-2 flex-1 rounded-full ink-border"
                style={{ background: "linear-gradient(to right, oklch(0.78 0.12 245), oklch(0.78 0.14 180), oklch(0.74 0.16 90), oklch(0.6 0.2 25))" }}
              />
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/50">Warm</span>
            </div>
          </div>

          {/* Stats */}
          <div className="pop-card bg-card p-5">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-4">
              Live stats
            </div>
            {loading ? (
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Loading…</div>
            ) : (
              <div className="space-y-4">
                <Stat label="Max"         value={`${Math.round(max)}${unit}`}       sub="across campus" />
                <Stat label="Min"         value={`${Math.round(min)}${unit}`}       sub="across campus" />
                <Stat label="Average"     value={`${avg.toFixed(1)}${unit}`}        sub="all zones" />
                <Stat label="Hottest zone" value={hottest?.name ?? "—"}             sub={hottest ? `${Math.round(hottest.value)}${unit}` : ""} />
                {data?.summary.high_risk_zones.length ? (
                  <Stat label="High risk zones" value={`${data.summary.high_risk_zones.length}`} sub={data.summary.high_risk_zones.join(", ")} />
                ) : null}
              </div>
            )}

            <button
              onClick={runCorrelation}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 mono text-[10px] uppercase tracking-[0.22em] px-4 py-3 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Run Correlation Analysis <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="pop-card bg-card p-6">
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-2">Why this matters</div>
          <h2 className="serif text-3xl text-foreground mb-4">Heat islands are a <em>health</em> story.</h2>
          <div className="space-y-3 text-sm text-foreground/70 max-w-3xl leading-relaxed">
            <p>
              UCSD's central campus consistently runs 8–12°F warmer than nearby coastal zones in
              afternoon hours. Concrete plazas, low-albedo rooftops, and constrained airflow
              between buildings concentrate heat that lingers well into the evening.
            </p>
            <p>
              Sustained exposure to elevated wet-bulb temperatures correlates strongly with
              cardiovascular stress — particularly in individuals with existing hypertension or
              APOE-ε4 carrier status. Emergency department visits for heat-related cardiac events
              spike approximately 18% during weeks with sustained ≥85°F afternoons in San Diego County.
            </p>
            <p>
              Respiratory outcomes follow a parallel pattern. Warmer air holds more particulate
              matter and ozone precursors, compounding microclimate burden in zones already at the
              top of the campus heat distribution.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          Scripps · UCSD · NOAA · EPA
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/45">{label}</div>
      <div className="serif text-2xl text-foreground leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-foreground/55">{sub}</div>}
    </div>
  );
}