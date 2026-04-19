import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraphPanel } from "@/components/GraphPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Scientist } from "@/components/Scientist";
import { SiteHeader } from "@/components/SiteHeader";
import { ExperimentSummary } from "@/components/ExperimentSummary";
import { AskScientists } from "@/components/AskScientists";
import { ResultsActions } from "@/components/ResultsActions";
import { ListenExplanation } from "@/components/ListenExplanation";
import { SignalExtraction } from "@/components/SignalExtraction";
import { SimilarResearch } from "@/components/SimilarResearch";
import { MLResults } from "@/components/MLResults";
import { getQuestion, getResult, setQuestion } from "@/lib/run-store";
import type { AnalyzeResponse } from "@/lib/mock-analyze";
import { MLDashboard } from "@/components/MLDashboard";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  head: () => ({
    meta: [
      { title: "Findings · Watson & Crick" },
      { name: "description", content: "Causal graph and structured report from your research query." },
    ],
  }),
});

function ResultsPage() {
  const navigate = useNavigate();
  const [question, setQ] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    const r = getResult();
    const q = getQuestion();
    if (!r || !q) { navigate({ to: "/" }); return; }
    setQ(q);
    setData(r);
  }, [navigate]);

  function handleSimilarClick(q: string) {
    setQuestion(q);
    navigate({ to: "/run" });
  }

  if (!data || !question) {
    return (
      <main className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <span className="mono text-xs text-foreground/50 uppercase tracking-[0.2em]">Loading findings</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Findings · {new Date(data.generated_at).toLocaleDateString()}
            </div>
            <h1 className="serif text-3xl sm:text-4xl text-foreground leading-tight">
              <em>"{question}"</em>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ResultsActions question={question} data={data} />
            <div className="flex items-center gap-4">
              <Link to="/compare" className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors">
                compare →
              </Link>
              <Link to="/" className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors">
                ← ask another
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-end gap-6 opacity-90">
          <div className="flex flex-col items-center">
            <Scientist who="watson" size={72} />
            <div className="mt-1 text-[10px] text-foreground/50 mono uppercase tracking-[0.18em]">Dr. Watson</div>
          </div>
          <div className="flex flex-col items-center">
            <Scientist who="crick" size={72} />
            <div className="mt-1 text-[10px] text-foreground/50 mono uppercase tracking-[0.18em]">Dr. Crick</div>
          </div>
          <div className="flex-1 mb-2 bubble text-sm text-foreground/80 max-w-md">
            We've laid it out below. The graph traces the causal chain; the report on the right walks through what we found.
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <GraphPanel data={data} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <ListenExplanation data={data} />
            <ResultsPanel data={data} onSimilarClick={handleSimilarClick} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <ExperimentSummary question={question} data={data} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <MLDashboard />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <SignalExtraction question={question} scrollAnchor="signal-extraction" />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <SimilarResearch question={question} data={data} />
      </section>

      <AskScientists question={question} data={data} />

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          EPA · NOAA · GWAS Catalog · Reactome · KEGG
        </div>
      </footer>
    </main>
  );
}