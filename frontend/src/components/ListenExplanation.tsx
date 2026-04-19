import { useEffect, useRef, useState } from "react";
import { Volume2, Pause, Square, Loader2 } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import type { AnalyzeResponse } from "@/lib/mock-analyze";
import { speak, type VoiceHandle, hasElevenLabsKey } from "@/lib/voice";

type Props = {
  data: AnalyzeResponse;
};

export function ListenExplanation({ data }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const handleRef = useRef<VoiceHandle | null>(null);

  const text = `${data.summary} The strongest finding: ${data.hypotheses?.[0]?.hypothesis ?? ""}`;

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
    };
  }, []);

  const start = async () => {
    setState("loading");
    try {
      const h = await speak(text, "crick");
      handleRef.current = h;
      if (h.audio) {
        h.audio.addEventListener("loadedmetadata", () => setDuration(h.audio!.duration));
        h.audio.addEventListener("timeupdate", () => setProgress(h.audio!.currentTime));
        h.audio.addEventListener("ended", () => {
          setState("idle");
          setProgress(0);
        });
      } else {
        // browser TTS — no progress, treat as playing until cancelled
        const tick = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(tick);
            setState("idle");
          }
        }, 500);
      }
      setState("playing");
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  const togglePause = () => {
    const h = handleRef.current;
    if (!h?.audio) return;
    if (state === "playing") {
      h.audio.pause();
      setState("paused");
    } else if (state === "paused") {
      h.audio.play();
      setState("playing");
    }
  };

  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    setState("idle");
    setProgress(0);
  };

  const isActive = state === "playing" || state === "paused" || state === "loading";

  return (
    <div className="ink-border rounded-xl bg-card p-3">
      {!isActive ? (
        <button
          type="button"
          onClick={start}
          className="w-full flex items-center justify-between gap-3 group"
        >
          <span className="flex items-center gap-2.5">
            <span className="rounded-full bg-foreground text-background h-8 w-8 grid place-items-center group-hover:scale-110 transition-transform">
              <Volume2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground">Listen to explanation</span>
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            {hasElevenLabsKey() ? "ElevenLabs" : "Browser TTS"}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Scientist who="crick" size={44} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bubble bubble-left text-xs mb-1.5 inline-block max-w-full">
              <p className="text-foreground/80">Let me walk you through this…</p>
            </div>
            {handleRef.current?.audio && duration > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${(progress / duration) * 100}%` }}
                />
              </div>
            )}
            {!handleRef.current?.audio && state !== "loading" && (
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                Speaking · browser voice
              </div>
            )}
            {state === "loading" && (
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading audio…
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {handleRef.current?.audio && (
              <button
                type="button"
                onClick={togglePause}
                className="rounded-full ink-border h-8 w-8 grid place-items-center hover:bg-muted"
                aria-label={state === "playing" ? "Pause" : "Resume"}
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={stop}
              className="rounded-full ink-border h-8 w-8 grid place-items-center hover:bg-muted"
              aria-label="Stop"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
