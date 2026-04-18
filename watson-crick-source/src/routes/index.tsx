import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { SuggestionChips } from "@/components/SuggestionChips";
import { Scientist } from "@/components/Scientist";
import { SiteHeader } from "@/components/SiteHeader";
import { setQuestion } from "@/lib/run-store";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Watson & Crick — Environmental Health Research, but fun" },
      {
        name: "description",
        content:
          "Ask plain-language research questions. Watson & Crick build a causal graph from pollutants → genes → pathways → outcomes, with statistical confidence.",
      },
    ],
  }),
});

const SUGGESTIONS = [
  "Does PM2.5 exposure correlate with Alzheimer's risk?",
  "How does heat stress relate to cardiovascular disease genes?",
  "What's the link between air quality and asthma in San Diego?",
];

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (question: string) => {
    setQuestion(question);
    navigate({ to: "/run" });
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="flex-1 mx-auto w-full max-w-5xl px-6 pt-20 pb-10 flex flex-col items-center">
        {/* Hero — quiet, monochrome */}
        <div className="text-center max-w-2xl">
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-5">
            Hypothesis
          </div>
          <h1 className="serif text-5xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            What do you want to <em>research</em> today?
          </h1>
          <p className="mt-5 text-base text-foreground/55 max-w-lg mx-auto">
            Ask anything about pollutants, genes, pathways, and disease. Watson and Crick
            will piece it together, probably while bickering.
          </p>
        </div>

        {/* Scientists framing the chat */}
        <div className="mt-14 w-full max-w-3xl grid grid-cols-[auto_1fr_auto] items-end gap-2 sm:gap-6">
          {/* Watson */}
          <div className="flex flex-col items-center">
            <div className="bubble bubble-left mb-4 max-w-[170px] text-sm">
              <p className="text-foreground/80 leading-snug">What's on your mind?</p>
            </div>
            <Scientist who="watson" size={140} />
            <div className="mt-2 text-xs text-foreground/55 mono uppercase tracking-[0.18em]">
              Dr. Watson
            </div>
          </div>

          {/* Chat input column */}
          <div className="pb-16 w-full">
            <ChatInput
              value={q}
              onChange={setQ}
              onSubmit={submit}
              placeholder="e.g. does PM2.5 exposure correlate with Alzheimer's risk?"
            />
            <div className="mt-4">
              <SuggestionChips suggestions={SUGGESTIONS} onPick={submit} />
            </div>
          </div>

          {/* Crick */}
          <div className="flex flex-col items-center">
            <div className="bubble bubble-right mb-4 max-w-[170px] text-sm ml-auto">
              <p className="text-foreground/80 leading-snug text-right">
                Crack your theories, instantly.
              </p>
            </div>
            <Scientist who="crick" size={140} />
            <div className="mt-2 text-xs text-foreground/55 mono uppercase tracking-[0.18em]">
              Dr. Crick
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          EPA · NOAA · GWAS Catalog · Reactome · KEGG
        </div>
      </footer>
    </main>
  );
}
