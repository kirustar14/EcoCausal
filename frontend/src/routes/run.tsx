import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Scientist } from "@/components/Scientist";
import { SiteHeader } from "@/components/SiteHeader";
import { getQuestion, setResult } from "@/lib/run-store";
import { analyze } from "@/lib/mock-analyze";
import { getBanter, type BanterLine } from "@/lib/banter";

export const Route = createFileRoute("/run")({
  component: RunPage,
  head: () => ({
    meta: [
      { title: "Running analysis · Watson & Crick" },
      { name: "description", content: "Watson & Crick are running your research query." },
    ],
  }),
});

const PIPELINE = [
  "Parsing question",
  "Fetching exposure data",
  "Resolving candidate genes",
  "Mapping pathways",
  "Compiling report",
];

function RunPage() {
  const navigate = useNavigate();
  const [question, setQ] = useState<string | null>(null);
  const [banter, setBanter] = useState<BanterLine[]>([]);
  const [shown, setShown] = useState<BanterLine[]>([]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load question and fetch real banter from backend
  useEffect(() => {
    const q = getQuestion();
    if (!q) { navigate({ to: "/" }); return; }
    setQ(q);
    setBanter(getBanter(q));
  }, [navigate]);

  // Reveal banter lines one by one
  useEffect(() => {
    if (banter.length === 0) return;
    setShown([]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    banter.forEach((line, i) => {
      timers.push(setTimeout(() => setShown((p) => [...p, line]), 600 + i * 1000));
    });
    return () => timers.forEach(clearTimeout);
  }, [banter]);

  // Animate pipeline steps
  useEffect(() => {
    if (!question) return;
    setStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    PIPELINE.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), 500 + i * 1100));
    });
    return () => timers.forEach(clearTimeout);
  }, [question]);

  // Run the real analysis
  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    (async () => {
      try {
        const [res] = await Promise.all([
          analyze(question),
          new Promise((r) => setTimeout(r, 7000)),
        ]);
        if (cancelled) return;
        setResult(res);
        navigate({ to: "/results" });
      } catch {
        if (!cancelled) setError("Could not reach backend. Is uvicorn running on port 8000?");
      }
    })();
    return () => { cancelled = true; };
  }, [question, navigate]);

  // Auto-scroll banter
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [shown.length]);

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <section className="flex-1 mx-auto w-full max-w-4xl px-6 pt-12 pb-10">
        <div className="text-center mb-10">
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">Investigating</div>
          <p className="serif text-2xl sm:text-3xl text-foreground leading-snug max-w-2xl mx-auto">
            <em>"{question ?? "…"}"</em>
          </p>
        </div>

        {error && (
          <div className="mb-6 text-center">
            <p className="text-sm text-red-500 mono">{error}</p>
            <Link to="/" className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/45 hover:text-foreground mt-2 inline-block">← go back</Link>
          </div>
        )}

        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-3 sm:gap-6 mb-10">
          <div className="flex flex-col items-center">
            <Scientist who="watson" size={130} />
            <div className="mt-2 text-xs text-foreground/55 mono uppercase tracking-[0.18em]">Dr. Watson</div>
          </div>
          <div ref={scrollRef} className="pb-16 max-h-[340px] overflow-auto space-y-3 px-1">
            {shown.length === 0 && (
              <div className="flex justify-center pt-6">
                <div className="flex items-center gap-2">
                  <span className="typing-dot" style={{ animationDelay: "0s" }} />
                  <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
            {shown.map((line, i) => <ChatRow key={i} line={line} />)}
            {shown.length > 0 && shown.length < banter.length && (
              <div className="flex items-center gap-2 px-3">
                <span className="typing-dot" style={{ animationDelay: "0s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Scientist who="crick" size={130} />
            <div className="mt-2 text-xs text-foreground/55 mono uppercase tracking-[0.18em]">Dr. Crick</div>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <ol className="space-y-2">
            {PIPELINE.map((label, i) => {
              const done   = i < step - 1;
              const active = i === step - 1;
              const pending = i >= step;
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors ${done ? "bg-foreground/60" : active ? "bg-foreground animate-pulse" : "bg-foreground/15"}`} />
                  <span className={`mono text-[11px] uppercase tracking-[0.18em] ${pending ? "text-foreground/30" : active ? "text-foreground" : "text-foreground/55"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-8 text-center">
            <Link to="/" className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/40 hover:text-foreground/80 transition-colors">cancel & ask again</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChatRow({ line }: { line: BanterLine }) {
  const isWatson = line.speaker === "watson";
  return (
    <div className={`flex ${isWatson ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] ${isWatson ? "" : "text-right"}`}>
        <div className="mono text-[9px] uppercase tracking-wider text-foreground/45 mb-1 px-1">
          {isWatson ? "Dr. Watson" : "Dr. Crick"}
        </div>
        <div className="bubble text-sm text-foreground inline-block text-left">{line.text}</div>
      </div>
    </div>
  );
}