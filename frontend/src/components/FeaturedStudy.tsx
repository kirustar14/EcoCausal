import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GitFork, Star, X } from "lucide-react";
import {
  getStudies,
  getStarsMap,
  bumpFork,
  confidenceClass,
  type CommunityStudy,
} from "@/lib/community-store";
import { setQuestion, setResult } from "@/lib/run-store";

const DISMISS_KEY = "wc:featured:dismissed";

export function FeaturedStudy() {
  const navigate = useNavigate();
  const [study, setStudy] = useState<CommunityStudy | null>(null);
  const [stars, setStars] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setHidden(true);
      return;
    }
    const all = getStudies();
    const map = getStarsMap();
    const top = [...all].sort((a, b) => (map[b.id] ?? 0) - (map[a.id] ?? 0))[0];
    if (top) {
      setStudy(top);
      setStars(map[top.id] ?? 0);
    }
  }, []);

  if (hidden || !study) return null;

  const onFork = () => {
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
    // Ensure landing page picks it up
    window.location.reload();
  };

  const onView = () => {
    if (study.result) {
      setQuestion(study.question);
      setResult(study.result);
      navigate({ to: "/results" });
    } else {
      setQuestion(study.question);
      navigate({ to: "/run" });
    }
  };

  return (
    <div className="relative pop-card p-5 mb-4 bg-card">
      <button
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setHidden(true);
        }}
        className="absolute top-3 right-3 text-foreground/40 hover:text-foreground"
        aria-label="Dismiss featured"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="stamp tag-ink">⭐ Featured</span>
        <span className={`stamp ${confidenceClass(study.confidence)}`}>{study.confidence}</span>
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-foreground/45 ml-auto inline-flex items-center gap-1">
          <Star className="h-3 w-3" /> {stars}
        </span>
      </div>
      <h3 className="serif text-xl leading-snug text-foreground line-clamp-2">{study.title}</h3>
      <div className="mt-2 text-xs text-foreground/55">
        by {study.researcher.name} · {study.datasets.slice(0, 3).join(" · ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onView}
          className="mono text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90"
        >
          View research →
        </button>
        <button
          onClick={onFork}
          className="mono text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 ink-border rounded-full bg-card hover:bg-muted inline-flex items-center gap-1"
        >
          <GitFork className="h-3 w-3" />
          Fork study
        </button>
      </div>
    </div>
  );
}
