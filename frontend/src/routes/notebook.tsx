import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { Slider } from "@/components/ui/slider";
import { BookOpen, ExternalLink, FileCode, Loader2 } from "lucide-react";

export const Route = createFileRoute("/notebook")({
  component: NotebookPage,
  head: () => ({
    meta: [
      { title: "Notebook · Watson & Crick" },
      {
        name: "description",
        content:
          "Interactive Marimo notebook for raw correlation analysis. Adjust parameters and explore the model.",
      },
    ],
  }),
});

const DATASETS = [
  "EPA AQS",
  "GWAS Catalog",
  "Scripps Heat Map",
  "NOAA Climate",
  "ZenPower Solar",
] as const;

const YEARS = Array.from({ length: 10 }, (_, i) => 2015 + i);
const SCOPES = ["San Diego County", "Southern California", "California", "National"];
const PVALS = ["0.05", "0.01", "0.001"];

function NotebookPage() {
  const [threshold, setThreshold] = useState(0.5);
  const [active, setActive] = useState<Set<string>>(
    new Set(["EPA AQS", "GWAS Catalog", "Scripps Heat Map"]),
  );
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2024);
  const [scope, setScope] = useState(SCOPES[0]);
  const [pval, setPval] = useState(PVALS[0]);

  const toggle = (d: string) => {
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Interactive Notebook
            </div>
            <h1 className="serif text-4xl sm:text-5xl text-foreground leading-tight">
              Raw <em>correlation</em> analysis.
            </h1>
          </div>
          <div className="stamp tag-paper">
            <FileCode className="inline h-3 w-3 mr-1" />
            Powered by Marimo — Interactive Python Notebooks
          </div>
        </div>

        <div className="mt-6 flex items-end gap-6">
          <div className="flex flex-col items-center">
            <div className="bubble bubble-left mb-3 max-w-[280px] text-sm">
              <p className="text-foreground/80 leading-snug">
                Dive into the raw correlation analysis. Adjust parameters and see how the results
                change.
              </p>
            </div>
            <Scientist who="watson" size={84} />
          </div>
          <div className="flex flex-col items-center ml-auto">
            <div className="bubble bubble-right mb-3 max-w-[260px] text-sm">
              <p className="text-foreground/80 leading-snug text-right">
                This is where the real science happens. No black boxes here.
              </p>
            </div>
            <Scientist who="crick" size={84} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Parameters */}
          <aside className="lg:col-span-4 pop-card bg-card p-5 h-fit">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-4">
              Parameters
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/65">
                    Correlation threshold
                  </label>
                  <span className="mono text-xs text-foreground">{threshold.toFixed(2)}</span>
                </div>
                <Slider
                  value={[threshold]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => setThreshold(v[0])}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/65 block mb-2">
                  Datasets
                </label>
                <div className="space-y-1.5">
                  {DATASETS.map((d) => (
                    <label
                      key={d}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground text-foreground/75"
                    >
                      <input
                        type="checkbox"
                        checked={active.has(d)}
                        onChange={() => toggle(d)}
                        className="h-3.5 w-3.5 accent-foreground"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/65 block mb-2">
                  Date range
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="flex-1 ink-border bg-background rounded-md px-2 py-1.5 text-sm"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <span className="text-foreground/40">→</span>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="flex-1 ink-border bg-background rounded-md px-2 py-1.5 text-sm"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/65 block mb-2">
                  Geographic scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full ink-border bg-background rounded-md px-2 py-1.5 text-sm"
                >
                  {SCOPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/65 block mb-2">
                  P-value cutoff
                </label>
                <select
                  value={pval}
                  onChange={(e) => setPval(e.target.value)}
                  className="w-full ink-border bg-background rounded-md px-2 py-1.5 text-sm"
                >
                  {PVALS.map((p) => (
                    <option key={p} value={p}>p &lt; {p}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Notebook embed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="pop-card bg-card overflow-hidden">
              <div className="aspect-[4/3] bg-muted/40 flex flex-col items-center justify-center text-center p-8 border-b border-foreground/10">
                <div className="mono text-[9px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
                  marimo
                </div>
                <div className="h-12 w-12 rounded-full ink-border bg-background flex items-center justify-center mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground/60" />
                </div>
                <div className="serif text-2xl text-foreground">
                  Interactive Notebook Loading…
                </div>
                <p className="mt-2 text-sm text-foreground/55 max-w-sm">
                  Adjust parameters on the left to explore the correlation model.
                </p>
              </div>

              <div className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                  {active.size} dataset{active.size === 1 ? "" : "s"} · {startYear}–{endYear} · {scope}
                </div>
                <div className="flex gap-2">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted transition-colors"
                  >
                    <BookOpen className="h-3 w-3" /> Documentation
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Open Full Notebook <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pop-card bg-card p-5">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55 mb-2">
                What you can do here
              </div>
              <ul className="text-sm text-foreground/70 space-y-1.5 list-disc list-inside">
                <li>Re-run any Watson &amp; Crick correlation with your own thresholds.</li>
                <li>Swap in alternative datasets to test robustness.</li>
                <li>Export reproducible Python — every cell is inspectable.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          Marimo · Sphinx · Python · Reproducible Science
        </div>
      </footer>
    </main>
  );
}
