import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { setQuestion } from "@/lib/run-store";
import { ArrowRight, Sun } from "lucide-react";
import { fetchSolar, type SolarResponse } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ScatterChart,
  Scatter,
} from "recharts";

export const Route = createFileRoute("/solar")({
  component: SolarPage,
  head: () => ({
    meta: [
      { title: "Solar & Public Health · Watson & Crick" },
      {
        name: "description",
        content:
          "ZenPower solar permit data correlated with respiratory disease rates across San Diego neighborhoods.",
      },
    ],
  }),
});

function SolarPage() {
  const navigate = useNavigate();
  const [data, setData]     = useState<SolarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolar()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const explore = () => {
    setQuestion("How does solar energy adoption correlate with respiratory health outcomes in San Diego neighborhoods?");
    navigate({ to: "/run" });
  };

  // Build chart-friendly arrays from real backend data
  const barData  = data?.neighborhoods.map((n) => ({ name: n.name.replace(" ", "\n"), permits: n.solar_permits })) ?? [];
  const lineData = data?.neighborhoods.map((n) => ({ name: n.name, rate: n.asthma_prevalence_pct })) ?? [];
  const r        = data?.summary.correlation.solar_vs_asthma_r ?? 0;
  const pVal     = data?.summary.correlation.p_value ?? 1;
  const confidence = Math.abs(r) > 0.6 && pVal < 0.05 ? "HIGH" : Math.abs(r) > 0.3 ? "MODERATE" : "LOW";

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Energy × Health
            </div>
            <h1 className="serif text-4xl sm:text-5xl text-foreground leading-tight">
              Solar Energy &amp; Public Health <em>Correlations</em>
            </h1>
            <p className="mt-3 text-foreground/60 max-w-xl">
              San Diego neighborhood permit data lined up against respiratory disease prevalence.
              The shape of the curves does most of the talking.
            </p>
          </div>
          <div className="stamp tag-paper">
            <Sun className="inline h-3 w-3 mr-1" />
            ZenPower Solar — San Diego Permit Records
          </div>
        </div>

        <div className="mt-6 flex items-end gap-6">
          <div className="flex flex-col items-center">
            <div className="bubble bubble-left mb-3 max-w-[240px] text-sm">
              <p className="text-foreground/80 leading-snug">
                ZenPower's solar permit data reveals a striking pattern…
              </p>
            </div>
            <Scientist who="watson" size={84} />
          </div>
          <div className="flex flex-col items-center ml-auto">
            <div className="bubble bubble-right mb-3 max-w-[240px] text-sm">
              <p className="text-foreground/80 leading-snug text-right">
                The causality is complex but the signal is undeniable.
              </p>
            </div>
            <Scientist who="crick" size={84} />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="mx-auto w-full max-w-6xl px-6 pb-6">
          <div className="pop-card bg-card p-10 flex items-center justify-center">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Loading solar data…</span>
          </div>
        </section>
      ) : (
        <>
          {/* Charts */}
          <section className="mx-auto w-full max-w-6xl px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="pop-card bg-card p-5">
                <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
                  Solar permits by neighborhood
                </div>
                <div className="serif text-xl text-foreground mb-3">
                  San Diego County · {data?.neighborhoods[0]?.data_year ?? 2023}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 250)" />
                    <XAxis dataKey="name" stroke="oklch(0.45 0.01 250)" fontSize={9} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis stroke="oklch(0.45 0.01 250)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.16 0.01 250)", borderRadius: 8 }} />
                    <Bar dataKey="permits" fill="oklch(0.55 0.15 160)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pop-card bg-card p-5">
                <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
                  Asthma prevalence by neighborhood
                </div>
                <div className="serif text-xl text-foreground mb-3">% of population</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.005 250)" />
                    <XAxis dataKey="name" stroke="oklch(0.45 0.01 250)" fontSize={9} interval={0} angle={-35} textAnchor="end" height={55} />
                    <YAxis stroke="oklch(0.45 0.01 250)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.16 0.01 250)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="rate" stroke="oklch(0.5 0.18 245)" strokeWidth={2.5} dot={{ r: 4, fill: "oklch(0.5 0.18 245)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Correlation indicator */}
          <section className="mx-auto w-full max-w-6xl px-6 pb-6">
            <div className="pop-card-lg bg-card p-6 text-center">
              <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-2">
                Inverse correlation detected
              </div>
              <div className="serif text-6xl sm:text-7xl text-foreground leading-none">
                r = <em>{r.toFixed(3)}</em>
              </div>
              <p className="mt-3 text-sm text-foreground/60 max-w-lg mx-auto">
                {data?.summary.correlation.interpretation}
              </p>
              <div className="mt-4 inline-flex items-center gap-2">
                <span className="stamp tag-ink">Confidence · {confidence}</span>
                <span className="stamp tag-paper">p = {pVal.toFixed(4)}</span>
                <span className="stamp tag-paper">{data?.neighborhoods.length ?? 0} neighborhoods</span>
              </div>
            </div>
          </section>

          {/* Neighborhood table */}
          <section className="mx-auto w-full max-w-6xl px-6 pb-6">
            <div className="pop-card bg-card p-5">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-3">
                Neighborhood breakdown
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 border-b border-foreground/10">
                      <th className="py-2 pr-4">Neighborhood</th>
                      <th className="py-2 pr-4">Solar permits</th>
                      <th className="py-2 pr-4">Asthma prevalence</th>
                      <th className="py-2 pr-4">CO₂ offset/yr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.neighborhoods.map((n) => (
                      <tr key={n.name} className="border-b border-foreground/5 last:border-0">
                        <td className="py-3 pr-4 font-medium">{n.name}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${n.solar_coverage_pct}%` }} />
                            </div>
                            <span className="mono text-xs">{n.solar_permits.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 mono">{n.asthma_prevalence_pct.toFixed(1)}%</td>
                        <td className="py-3 pr-4 mono text-foreground/65">{n.co2_offset_tons_yr.toLocaleString()} t</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Key finding */}
          <section className="mx-auto w-full max-w-6xl px-6 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 pop-card bg-card p-6">
                <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-2">Key finding</div>
                <h2 className="serif text-3xl text-foreground leading-snug">
                  Neighborhoods with <em>high solar adoption</em> show lower rates of respiratory disease.
                </h2>
                <p className="mt-3 text-sm text-foreground/65 max-w-2xl">
                  {data?.summary.correlation.interpretation} Total of{" "}
                  {data?.summary.total_permits.toLocaleString()} permits issued across San Diego,
                  offsetting approximately {data?.summary.total_co2_offset_tons.toLocaleString()} tons of CO₂ per year.
                  Data sourced from {data?.data_sources.join(", ")}.
                </p>
              </div>
              <div className="pop-card bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-2">
                    Want the receipts?
                  </div>
                  <p className="text-sm text-foreground/70">
                    Spin this up as a Watson &amp; Crick analysis with the full causal graph.
                  </p>
                </div>
                <button
                  onClick={explore}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 mono text-[10px] uppercase tracking-[0.22em] px-4 py-3 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Explore This Correlation <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          ZenPower · EPA · CalEnviroScreen · SDAPCD
        </div>
      </footer>
    </main>
  );
}