import { useEffect, useState } from "react";
import { Scientist } from "@/components/Scientist";

type Step = {
  who: "watson" | "crick";
  text: string;
};

const STEPS: Step[] = [
  { who: "watson", text: "Welcome to Watson & Crick, your personal research lab!" },
  {
    who: "crick",
    text: "We connect climate data, genomic data, and environmental signals…",
  },
  { who: "watson", text: "Pollutants, genes, pathways, outcomes, all stitched together." },
  { who: "crick", text: "Ask us anything. We'll crack it." },
];

const STEP_MS = 2200;

type Props = { onDone: () => void };

export function OnboardingIntro({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Step 0 = welcome, waits for the user to click Start
    if (!started) return;
    if (step >= STEPS.length) {
      // hold the last frame briefly, then exit
      const t = setTimeout(() => finish(), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, started]);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDone, 380);
  };

  const current = STEPS[Math.min(step, STEPS.length - 1)];
  const progress = Math.min((step + 1) / STEPS.length, 1);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Skip button — always visible */}
      <div className="absolute top-5 right-6 z-10">
        <button
          onClick={finish}
          className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 hover:text-foreground transition-colors px-3 py-2"
        >
          Skip intro →
        </button>
      </div>

      {/* Tiny brand mark */}
      <div className="absolute top-5 left-6 z-10">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Watson<span className="text-foreground/40 mx-1">&</span>Crick
        </span>
      </div>

      {/* Stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-6 animate-status-in">
          Lab intro · {Math.min(step + 1, STEPS.length)} / {STEPS.length}
        </div>

        {/* Both scientists, current speaker emphasized */}
        <div className="flex items-end justify-center gap-10 sm:gap-16 mb-10">
          <div
            className={`transition-all duration-500 ${
              current.who === "watson"
                ? "opacity-100 scale-100"
                : "opacity-40 scale-95"
            }`}
          >
            <Scientist who="watson" size={150} />
            <div className="mt-2 text-center mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Dr. Watson
            </div>
          </div>
          <div
            className={`transition-all duration-500 ${
              current.who === "crick"
                ? "opacity-100 scale-100"
                : "opacity-40 scale-95"
            }`}
          >
            <Scientist who="crick" size={150} />
            <div className="mt-2 text-center mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
              Dr. Crick
            </div>
          </div>
        </div>

        {/* Speech bubble — re-mounts per step to retrigger animation */}
        <div key={step} className="w-full max-w-xl animate-bubble-up">
          <div
            className={`bubble ${
              current.who === "watson" ? "bubble-left" : "bubble-right"
            } text-center`}
          >
            <p className="serif text-xl sm:text-2xl leading-snug text-foreground">
              {current.text}
            </p>
          </div>
          <div
            className={`mt-3 mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 ${
              current.who === "watson" ? "text-left" : "text-right"
            }`}
          >
            {current.who === "watson" ? "Dr. Watson" : "Dr. Crick"}
          </div>
        </div>
      </div>

      {/* Progress bar + centered Start CTA (only before user starts) */}
      <div className="px-6 pb-6">
        <div className="mx-auto max-w-xl h-[2px] bg-foreground/10 overflow-hidden">
          <div
            className="h-full bg-foreground/70 transition-[width] duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mx-auto max-w-xl mt-4 mono text-[10px] uppercase tracking-[0.22em] text-foreground/35 text-center">
          Watson & Crick · Lab intro
        </div>
        {!started && (
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => {
                setStarted(true);
                setStep(1);
              }}
              className="px-6 py-2.5 border-2 border-foreground text-foreground bg-background hover:bg-foreground hover:text-background transition-colors mono text-[11px] uppercase tracking-[0.22em] animate-status-in"
            >
              Start →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
