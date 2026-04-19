import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuestion, getResult, setQuestion } from "@/lib/run-store";
import {
  loadDebate,
  buildDebate,
  buildDebateSummary,
  type DebateLine,
  type DebateSummary,
} from "@/lib/mock-debate";

export const Route = createFileRoute("/debate")({
  component: DebatePage,
  head: () => ({
    meta: [
      { title: "The Debate Room · Watson & Crick" },
      {
        name: "description",
        content:
          "Watch Watson and Crick debate the hypothesis — argue, counter-argue, and settle on a verdict.",
      },
    ],
  }),
});

function DebatePage() {
  const navigate = useNavigate();
  const [question, setQ] = useState<string | null>(null);
  const [lines, setLines]     = useState<DebateLine[]>([]);
  const [summary, setSummary] = useState<DebateSummary | null>(null);
  const [shown, setShown]     = useState<{ idx: number; text: string }[]>([]);
  const [topic, setTopic]     = useState<string>("");
  const [loadingDebate, setLoadingDebate] = useState(true);

  useEffect(() => {
    const r = getResult();
    const q = getQuestion();
    if (!r || !q) { navigate({ to: "/" }); return; }
    setQ(q);

    // Try real API first, fall back to mock if it fails
    loadDebate(q)
      .then(({ lines: l, summary: s, hypothesis }) => {
        setLines(l);
        setSummary(s);
        setTopic(hypothesis);
      })
      .catch(() => {
        // Fallback to sync mock
        setLines(buildDebate(r));
        setSummary(buildDebateSummary(r));
        setTopic(r.report.summary);
      })
      .finally(() => setLoadingDebate(false));
  }, [navigate]);

  // Typewriter sequencer
  useEffect(() => {
    if (!lines.length) return;
    let cancelled = false;
    let idx = 0;
    let charPos = 0;
    let current = "";

    const tick = () => {
      if (cancelled) return;
      if (idx >= lines.length) return;
      const full = lines[idx].text;
      if (charPos < full.length) {
        const step = Math.max(1, Math.floor(full.length / 60));
        charPos = Math.min(full.length, charPos + step);
        current = full.slice(0, charPos);
        setShown((s) => {
          const copy = [...s];
          copy[idx] = { idx, text: current };
          return copy;
        });
        setTimeout(tick, 22);
      } else {
        idx += 1;
        charPos = 0;
        current = "";
        if (idx < lines.length) {
          setShown((s) => [...s, { idx, text: "" }]);
          setTimeout(tick, 700);
        }
      }
    };

    setShown([{ idx: 0, text: "" }]);
    setTimeout(tick, 500);
    return () => { cancelled = true; };
  }, [lines]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shown]);

  const allShown =
    shown.length === lines.length &&
    shown[lines.length - 1]?.text === lines[lines.length - 1]?.text;

  const handleRerun = (q: string) => {
    setQuestion(q);
    navigate({ to: "/run" });
  };

  if (!question || loadingDebate) {
    return (
      <main className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <span className="mono text-xs text-foreground/50 uppercase tracking-[0.2em]">
            {loadingDebate ? "Watson & Crick are preparing their arguments…" : "Loading the debate room"}
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Header */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-10">
        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> back to findings
        </Link>
        <div className="text-center mt-6">
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            The Debate Room
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-foreground tracking-tight mt-2">
            Watson <span className="text-foreground/30">vs.</span> Crick
          </h1>
        </div>

        {/* Topic banner */}
        <div className="mt-6 ink-border rounded-2xl bg-card px-5 py-4 flex items-start gap-3">
          <span className="stamp shrink-0 mt-0.5">Debating</span>
          <p className="serif text-base sm:text-lg text-foreground italic leading-snug">
            "{topic}"
          </p>
        </div>
      </section>

      {/* Stage */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-4">
          {/* Watson — green side */}
          <div className="flex flex-col items-center">
            <Scientist who="watson" size={140} />
            <div className="mt-2 mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Watson · For
            </div>
            <div className="mt-1 h-1 w-12 rounded-full bg-lab-green" />
          </div>

          {/* Conversation */}
          <div
            ref={scrollRef}
            className="pop-card-lg p-5 sm:p-6 max-h-[460px] overflow-y-auto space-y-3"
          >
            {shown.map((m) => {
              const line = lines[m.idx];
              if (!line) return null;
              const isWatson = line.speaker === "watson";
              return (
                <div
                  key={m.idx}
                  className={`flex ${isWatson ? "justify-start" : "justify-end"} animate-bubble-up`}
                >
                  <div className="max-w-[85%]">
                    <div
                      className={`mono text-[9px] uppercase tracking-[0.18em] mb-0.5 ${
                        isWatson ? "text-foreground/55" : "text-foreground/55 text-right"
                      }`}
                    >
                      {isWatson ? "Watson" : "Crick"}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isWatson ? "tag-green rounded-tl-sm" : "tag-blue rounded-tr-sm"
                      }`}
                    >
                      {m.text}
                      {m.text.length < line.text.length && (
                        <span className="inline-block w-1.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-blink" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Crick — blue side */}
          <div className="flex flex-col items-center">
            <Scientist who="crick" size={140} />
            <div className="mt-2 mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Crick · Challenges
            </div>
            <div className="mt-1 h-1 w-12 rounded-full bg-lab-blue" />
          </div>
        </div>
      </section>

      {/* Summary card */}
      {allShown && summary && (
        <section className="mx-auto w-full max-w-6xl px-6 mt-10 mb-16 animate-bubble-up">
          <div className="pop-card-lg p-7">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4 text-foreground/60" />
              <h2 className="serif text-2xl text-foreground">Verdict & next steps</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <SummaryList title="What needs more exploration" items={summary.explore} />
              <SummaryList title="Suggested experiment improvements" items={summary.improvements} />
            </div>

            <div className="mt-7">
              <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
                Recommended re-runs
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.rerunQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleRerun(q)}
                    className="rounded-full ink-border bg-card px-3.5 py-2 text-xs hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          EPA · NOAA · GWAS Catalog · Reactome · KEGG
        </div>
      </footer>
    </main>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
        {title}
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground/80">
            <span className="mono text-[11px] text-foreground/40 pt-0.5 w-5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}