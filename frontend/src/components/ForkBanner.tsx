import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Scientist } from "@/components/Scientist";

export type ForkContext = {
  id: string;
  title: string;
  researcher: string;
  question: string;
};

export function readForkContext(): ForkContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("wc:fork:context");
    if (!raw) return null;
    return JSON.parse(raw) as ForkContext;
  } catch {
    return null;
  }
}

export function clearForkContext() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("wc:fork:context");
}

export function ForkBanner() {
  const [ctx, setCtx] = useState<ForkContext | null>(null);

  useEffect(() => {
    setCtx(readForkContext());
  }, []);

  if (!ctx) return null;

  return (
    <div className="mb-6 pop-card p-4 flex items-start gap-3 bg-card animate-bubble-up">
      <Scientist who="watson" size={48} />
      <div className="flex-1 min-w-0">
        <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
          Forking from the community
        </div>
        <p className="text-sm text-foreground/80">
          <em className="serif">"Standing on the shoulders of giants…"</em> Building on{" "}
          <span className="font-medium">"{ctx.title}"</span> by{" "}
          <span className="mono text-[11px]">{ctx.researcher}</span>. Edit the question and run
          your own analysis.
        </p>
      </div>
      <button
        onClick={() => {
          clearForkContext();
          setCtx(null);
        }}
        className="text-foreground/40 hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
