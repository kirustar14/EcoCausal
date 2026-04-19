import { useRef, useState } from "react";
import { X, Download, Twitter } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import type { AnalyzeResponse } from "@/lib/mock-analyze";

type Props = {
  open: boolean;
  onClose: () => void;
  question: string;
  data: AnalyzeResponse;
};

export function ShareDiscoveryModal({ open, onClose, question, data }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const confidenceLabel =
    data.report.confidence >= 0.85
      ? "HIGH"
      : data.report.confidence >= 0.6
      ? "MODERATE"
      : "EXPLORATORY";

  const datasets = (data.report.sources?.slice(0, 4) ?? []).map((s) => s.label);

  const downloadPng = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "watson-crick-discovery.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setBusy(false);
    }
  };

  const tweet = () => {
    const text = `Watson & Crick just cracked this: ${question} at ${confidenceLabel} confidence 🧬 Discovered using EPA, GWAS, and Scripps data. #DataHacks2026 #WatsonCrick watsonandcrick.app`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-status-in">
      <div className="pop-card-lg bg-card w-full max-w-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-foreground/40 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-2">
          Share discovery
        </div>
        <h2 className="serif text-2xl text-foreground mb-2">A card worth posting.</h2>

        <div className="flex items-start gap-3 mb-4">
          <Scientist who="crick" size={56} />
          <div className="bubble bubble-left text-sm flex-1 mt-1">
            <p className="text-foreground/80 leading-snug">
              Science is better when it's shared…
            </p>
          </div>
        </div>

        {/* Card preview */}
        <div className="rounded-lg overflow-hidden ink-border bg-background">
          <div
            ref={cardRef}
            className="p-6 bg-background"
            style={{ width: "100%", aspectRatio: "1.6 / 1" }}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold tracking-tight text-foreground">
                    Watson<span className="text-foreground/40 mx-1">&amp;</span>Crick
                  </span>
                </div>
                <span className="stamp tag-ink">Confidence · {confidenceLabel}</span>
              </div>

              <div className="mt-3 flex-1 flex items-center">
                <h3 className="serif text-2xl sm:text-3xl text-foreground leading-tight">
                  <em>"{question}"</em>
                </h3>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="ink-border rounded-md p-2.5">
                  <div className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/50">
                    p-value
                  </div>
                  <div className="serif text-xl text-foreground leading-none mt-0.5">
                    {data.report.p_value.toExponential(1)}
                  </div>
                </div>
                <div className="ink-border rounded-md p-2.5">
                  <div className="mono text-[9px] uppercase tracking-[0.2em] text-foreground/50">
                    correlation
                  </div>
                  <div className="serif text-xl text-foreground leading-none mt-0.5">
                    r = {data.report.confidence.toFixed(2)}
                  </div>
                </div>
              </div>

              {datasets.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {datasets.map((d) => (
                    <span key={d} className="stamp tag-paper">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 text-right">
                Cracked by Watson &amp; Crick
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted"
          >
            Close
          </button>
          <button
            onClick={downloadPng}
            disabled={busy}
            className="inline-flex items-center gap-2 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted disabled:opacity-60"
          >
            <Download className="h-3 w-3" />
            {busy ? "Rendering…" : "Download as PNG"}
          </button>
          <button
            onClick={tweet}
            className="inline-flex items-center gap-2 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 rounded-full bg-foreground text-background hover:opacity-90"
          >
            <Twitter className="h-3 w-3" />
            Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
