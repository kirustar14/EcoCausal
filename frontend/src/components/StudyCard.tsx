import { Link, useNavigate } from "@tanstack/react-router";
import { Star, GitFork } from "lucide-react";
import { useState } from "react";
import {
  toggleStar,
  isStarred as checkStarred,
  getStarCount,
  getForkCount,
  bumpFork,
  timeAgo,
  confidenceClass,
  type CommunityStudy,
} from "@/lib/community-store";
import { setQuestion, setResult } from "@/lib/run-store";

type Props = {
  study: CommunityStudy;
  onChange?: () => void;
};

export function StudyCard({ study, onChange }: Props) {
  const navigate = useNavigate();
  const [starred, setStarred] = useState(() => checkStarred(study.id));
  const [stars, setStars] = useState(() => getStarCount(study.id));
  const forks = getForkCount(study.id);

  const onStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = toggleStar(study.id);
    setStarred(r.starred);
    setStars(r.count);
    onChange?.();
  };

  const onView = () => {
    if (study.result) {
      setQuestion(study.question);
      setResult(study.result);
      navigate({ to: "/results" });
    } else {
      // Seeded study without a synthetic result — kick off a real run.
      setQuestion(study.question);
      navigate({ to: "/run" });
    }
  };

  const onFork = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bumpFork(study.id);
    sessionStorage.setItem(
      "wc:fork:context",
      JSON.stringify({
        id: study.id,
        title: study.title,
        researcher: study.researcher.name,
        question: study.question,
      }),
    );
    navigate({ to: "/" });
  };

  return (
    <article className="pop-card p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop-lg)] transition-transform">
      <div className="flex items-start justify-between gap-3">
        <span className={`stamp ${confidenceClass(study.confidence)}`}>{study.confidence}</span>
        <button
          onClick={onStar}
          className={`inline-flex items-center gap-1.5 mono text-[11px] uppercase tracking-[0.18em] px-2.5 py-1 ink-border rounded-full transition-colors ${
            starred ? "bg-foreground text-background" : "bg-card hover:bg-muted"
          }`}
          aria-label={starred ? "Unstar study" : "Star study"}
        >
          <Star className="h-3 w-3" fill={starred ? "currentColor" : "none"} />
          {stars}
        </button>
      </div>

      <button onClick={onView} className="text-left">
        <h3 className="serif text-xl leading-snug text-foreground hover:underline underline-offset-4 line-clamp-3">
          {study.title}
        </h3>
      </button>

      <p className="text-sm text-foreground/65 line-clamp-2">{study.summary}</p>

      <div className="flex flex-wrap gap-1.5">
        {study.datasets.map((d) => (
          <span key={d} className="stamp tag-blue">
            {d}
          </span>
        ))}
        {study.tags.map((t) => (
          <span key={t} className="stamp tag-paper">
            #{t}
          </span>
        ))}
      </div>

      {study.forked_from && (
        <div className="mono text-[10px] uppercase tracking-[0.2em] text-foreground/45 flex items-center gap-1.5">
          <GitFork className="h-3 w-3" /> Forked from "{study.forked_from.title.slice(0, 40)}…" by{" "}
          {study.forked_from.researcher}
        </div>
      )}

      <div className="mt-1 pt-3 border-t border-foreground/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-full ink-border bg-muted flex items-center justify-center mono text-[10px] tracking-wider shrink-0">
            {study.researcher.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-foreground truncate">{study.researcher.name}</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
              {timeAgo(study.posted_at)}
              {forks > 0 && <> · {forks} forks</>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onFork}
            className="mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1.5 ink-border rounded-full bg-card hover:bg-muted transition-colors inline-flex items-center gap-1"
            aria-label="Fork study"
          >
            <GitFork className="h-3 w-3" />
            Fork
          </button>
          <button
            onClick={onView}
            className="mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            View →
          </button>
        </div>
      </div>
    </article>
  );
}
