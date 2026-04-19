import { useNavigate } from "@tanstack/react-router";
import { GitFork } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import {
  getStudies,
  getSimilarStudies,
  bumpFork,
  confidenceClass,
  timeAgo,
  type CommunityStudy,
} from "@/lib/community-store";
import { setQuestion, setResult } from "@/lib/run-store";
import type { AnalyzeResponse } from "@/lib/mock-analyze";

type Props = {
  question: string;
  data: AnalyzeResponse;
};

// Build a synthetic study-like target so we can match against the community.
function targetFromData(question: string, data: AnalyzeResponse): CommunityStudy {
  const datasets = data.datasets_used ?? [];
  return {
    id: "__current__",
    title: question,
    question,
    confidence: "MODERATE",
    datasets,
    tags: [],
    researcher: { name: "you", initials: "ME" },
    posted_at: new Date().toISOString(),
    summary: data.summary ?? "",
  };
}

export function SimilarResearch({ question, data }: Props) {
  const navigate = useNavigate();
  const target = targetFromData(question, data);
  let similar = getSimilarStudies(target, 3);
  if (similar.length === 0) {
    // Fallback — show 3 most recent so the panel is never empty
    similar = getStudies().slice(0, 3);
  }

  const onView = (s: CommunityStudy) => {
    if (s.result) {
      setQuestion(s.question);
      setResult(s.result);
      navigate({ to: "/results" });
    } else {
      setQuestion(s.question);
      navigate({ to: "/run" });
    }
  };

  const onFork = (s: CommunityStudy) => {
    bumpFork(s.id);
    sessionStorage.setItem(
      "wc:fork:context",
      JSON.stringify({
        id: s.id,
        title: s.title,
        researcher: s.researcher.name,
        question: s.question,
      }),
    );
    navigate({ to: "/" });
  };

  if (similar.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-end gap-4 mb-4">
        <Scientist who="watson" size={56} />
        <div className="flex-1">
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-1">
            Similar research from the community
          </div>
          <p className="serif text-lg text-foreground/80">
            <em>"You're not alone in this inquiry…"</em>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {similar.map((s) => (
          <article key={s.id} className="pop-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`stamp ${confidenceClass(s.confidence)}`}>{s.confidence}</span>
              <span className="mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                {timeAgo(s.posted_at)}
              </span>
            </div>
            <h3 className="serif text-base leading-snug line-clamp-3 text-foreground">{s.title}</h3>
            <div className="text-[11px] text-foreground/55">by {s.researcher.name}</div>
            <div className="flex flex-wrap gap-1">
              {s.datasets.slice(0, 2).map((d) => (
                <span key={d} className="stamp tag-blue">
                  {d}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 pt-2">
              <button
                onClick={() => onView(s)}
                className="mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-full bg-foreground text-background hover:opacity-90"
              >
                View
              </button>
              <button
                onClick={() => onFork(s)}
                className="mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1.5 ink-border rounded-full bg-card hover:bg-muted inline-flex items-center gap-1"
              >
                <GitFork className="h-3 w-3" />
                Fork
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
