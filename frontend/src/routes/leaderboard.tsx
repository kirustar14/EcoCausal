import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getStudies,
  getStarsMap,
  getResearchers,
  getHotDatasets,
  confidenceClass,
  type CommunityStudy,
} from "@/lib/community-store";
import { setQuestion, setResult } from "@/lib/run-store";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard · Watson & Crick" },
      {
        name: "description",
        content: "Top community research, top researchers, and trending datasets in the Watson & Crick network.",
      },
      { property: "og:title", content: "Leaderboard · Watson & Crick" },
      {
        property: "og:description",
        content: "See who's leading the environmental health research community this week.",
      },
    ],
  }),
});

type Tab = "research" | "researchers" | "datasets";

function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("research");
  const [studies, setStudies] = useState<CommunityStudy[]>([]);
  const [stars, setStars] = useState<Record<string, number>>({});

  useEffect(() => {
    setStudies(getStudies());
    setStars(getStarsMap());
  }, []);

  const topStudies = useMemo(
    () => [...studies].sort((a, b) => (stars[b.id] ?? 0) - (stars[a.id] ?? 0)).slice(0, 30),
    [studies, stars],
  );

  const topResearchers = useMemo(() => {
    const rs = getResearchers();
    return [...rs].sort((a, b) => b.total_stars - a.total_stars).slice(0, 30);
  }, [tab]);

  const hotDatasets = useMemo(() => getHotDatasets(), [tab]);
  const maxDataset = hotDatasets[0]?.count ?? 1;

  const navigate = useNavigate();
  const openStudy = (s: CommunityStudy) => {
    if (s.result) {
      setQuestion(s.question);
      setResult(s.result);
      navigate({ to: "/results" });
    } else {
      setQuestion(s.question);
      navigate({ to: "/run" });
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 pt-12 pb-6">
        <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
          Hall of fame
        </div>
        <h1 className="serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
          The <em>Leaderboard</em>
        </h1>
        <p className="mt-3 text-foreground/55 max-w-lg">
          Top research, top researchers, trending datasets — updated live from the community.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-4">
        <div className="inline-flex p-1 ink-border rounded-full bg-card">
          {(
            [
              ["research", "Top Research"],
              ["researchers", "Top Researchers"],
              ["datasets", "Trending Datasets"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`mono text-[10px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full transition-colors ${
                tab === k ? "bg-foreground text-background" : "hover:bg-muted text-foreground/65"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16 flex-1">
        {tab === "research" && (
          <ol className="space-y-2">
            {topStudies.map((s, i) => {
              const rank = i + 1;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => openStudy(s)}
                    className="w-full text-left pop-card p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop-lg)] transition-transform"
                  >
                    <div className="w-12 text-center">
                      {rank === 1 ? (
                        <Crown className="h-6 w-6 mx-auto text-foreground" />
                      ) : (
                        <span className="serif text-3xl text-foreground/55">{rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="serif text-base sm:text-lg leading-snug text-foreground line-clamp-2">
                        {s.title}
                      </div>
                      <div className="mt-1 mono text-[10px] uppercase tracking-[0.18em] text-foreground/45 truncate">
                        by {s.researcher.name} · {s.datasets.slice(0, 2).join(" · ")}
                      </div>
                    </div>
                    <span className={`stamp ${confidenceClass(s.confidence)} hidden sm:inline-flex`}>
                      {s.confidence}
                    </span>
                    <div className="inline-flex items-center gap-1.5 mono text-sm text-foreground">
                      <Star className="h-4 w-4" fill="currentColor" />
                      {stars[s.id] ?? 0}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {tab === "researchers" && (
          <ol className="space-y-2">
            {topResearchers.map((r, i) => {
              const rank = i + 1;
              const badge = rankBadge(rank);
              return (
                <li key={r.name} className="pop-card p-4 flex items-center gap-4">
                  <div className="w-12 text-center">
                    {badge ? (
                      <span className="text-2xl">{badge}</span>
                    ) : (
                      <span className="serif text-3xl text-foreground/55">{rank}</span>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full ink-border bg-muted flex items-center justify-center mono text-xs">
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-medium truncate">{r.name}</div>
                    <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                      {r.studies} studies published
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 mono text-sm text-foreground">
                    <Star className="h-4 w-4" fill="currentColor" />
                    {r.total_stars}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {tab === "datasets" && (
          <ul className="space-y-3">
            {hotDatasets.map((d, i) => (
              <li key={d.name} className="pop-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="serif text-2xl text-foreground/55 w-8 text-center">
                      {i + 1}
                    </span>
                    <span className="text-foreground font-medium">{d.name}</span>
                  </div>
                  <span className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/65">
                    {d.count} {d.count === 1 ? "study" : "studies"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{ width: `${(d.count / maxDataset) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          EPA · NOAA · GWAS Catalog · Reactome · KEGG
        </div>
      </footer>
    </main>
  );
}
