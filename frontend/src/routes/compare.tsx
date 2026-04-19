import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { compare, type CompareResponse } from "@/lib/mock-analyze";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
});

function ComparePage() {
  const [qa, setQa] = useState("");
  const [qb, setQb] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!qa.trim() || !qb.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await compare(qa, qb);
      setResult(res);
    } catch {
      setError("Backend not reachable. Is uvicorn running?");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-5xl px-6 pt-12 pb-16">
        <div className="mb-8">
          <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">Compare mode</div>
          <h1 className="text-4xl text-foreground">Compare two research questions</h1>
          <Link to="/" className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/45 hover:text-foreground mt-2 inline-block">← back</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-2 block">Question A</label>
            <textarea
              value={qa}
              onChange={(e) => setQa(e.target.value)}
              rows={3}
              placeholder="How does wildfire smoke affect asthma?"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 resize-none focus:outline-none"
            />
          </div>
          <div>
            <label className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-2 block">Question B</label>
            <textarea
              value={qb}
              onChange={(e) => setQb(e.target.value)}
              rows={3}
              placeholder="How does heat stress affect cognitive disease?"
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 resize-none focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading || !qa.trim() || !qb.trim()}
          className="mono text-[11px] uppercase tracking-[0.22em] px-6 py-3 rounded-full bg-foreground text-background disabled:opacity-40 transition-opacity"
        >
          {loading ? "Analyzing…" : "Run comparison"}
        </button>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {result && (
          <div className="mt-10 space-y-8">
            <div className="rounded-2xl bg-muted/50 p-6 space-y-4">
              <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">Comparison</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 block mb-1">Stronger association</span>
                  <span className="text-foreground font-medium">Analysis {result.comparison.stronger_association}</span>
                  <p className="text-foreground/65 mt-1">{result.comparison.reason}</p>
                </div>
                <div>
                  <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 block mb-1">Key difference</span>
                  <p className="text-foreground/65">{result.comparison.key_difference}</p>
                </div>
                <div>
                  <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 block mb-1">Shared mechanisms</span>
                  <p className="text-foreground/65">{result.comparison.shared_mechanisms}</p>
                </div>
                <div>
                  <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 block mb-1">Recommendation</span>
                  <p className="text-foreground/65">{result.comparison.recommendation}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[result.analysis_a, result.analysis_b].map((a, i) => (
                <div key={i} className="rounded-2xl bg-muted/30 p-5 space-y-3">
                  <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Analysis {i === 0 ? "A" : "B"}</div>
                  <p className="text-lg text-foreground leading-snug">"{a.question}"</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="mono text-[10px] text-foreground/40 uppercase tracking-[0.18em]">r</div>
                      <div className="text-2xl text-foreground">{a.stats.r.toFixed(3)}</div>
                    </div>
                    <div>
                      <div className="mono text-[10px] text-foreground/40 uppercase tracking-[0.18em]">p</div>
                      <div className="text-2xl text-foreground">{a.stats.p.toFixed(3)}</div>
                    </div>
                    <div>
                      <div className="mono text-[10px] text-foreground/40 uppercase tracking-[0.18em]">conf</div>
                      <div className="text-2xl text-foreground">{a.stats.confidence}</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/65">{a.summary}</p>
                  <div className="space-y-2">
                    {a.hypotheses.slice(0, 2).map((h) => (
                      <div key={h.rank} className="text-xs text-foreground/60 bg-background/40 rounded-lg px-3 py-2">
                        <span className={`inline-block mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full mr-2 ${
                          h.confidence === "STRONG" ? "bg-green-100 text-green-700" :
                          h.confidence === "MODERATE" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>{h.confidence}</span>
                        {h.hypothesis}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}