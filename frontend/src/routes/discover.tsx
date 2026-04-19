import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { StudyCard } from "@/components/StudyCard";
import {
  getStudies,
  getStarsMap,
  getHotDatasets,
  type CommunityStudy,
  type CommunityTag,
} from "@/lib/community-store";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
  head: () => ({
    meta: [
      { title: "Discover Research · Watson & Crick" },
      {
        name: "description",
        content:
          "Browse community-published research on environmental health, climate, genomics, energy, and economics.",
      },
      { property: "og:title", content: "Discover Research · Watson & Crick" },
      {
        property: "og:description",
        content: "A community feed of research connecting pollutants, genes, pathways, and outcomes.",
      },
    ],
  }),
});

const TAGS: ("All" | CommunityTag)[] = ["All", "Climate", "Genomics", "Health", "Energy", "Economics"];
type Sort = "trending" | "recent" | "starred";

function isThisWeek(iso: string) {
  return Date.now() - new Date(iso).getTime() < 7 * 86_400_000;
}

function DiscoverPage() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [studies, setStudies] = useState<CommunityStudy[]>([]);
  const [stars, setStars] = useState<Record<string, number>>({});
  const [hot, setHot] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    setStudies(getStudies());
    setStars(getStarsMap());
    setHot(getHotDatasets().slice(0, 8));
  }, [tick]);

  const [filter, setFilter] = useState<(typeof TAGS)[number]>("All");
  const [sort, setSort] = useState<Sort>("trending");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = [...studies];
    if (filter !== "All") list = list.filter((s) => s.tags.includes(filter as CommunityTag));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.researcher.name.toLowerCase().includes(q) ||
          s.datasets.some((d) => d.toLowerCase().includes(q)) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
      }
      if (sort === "starred") return (stars[b.id] ?? 0) - (stars[a.id] ?? 0);
      // trending = stars in last week, then recency
      const aWeek = isThisWeek(a.posted_at) ? (stars[a.id] ?? 0) * 2 : (stars[a.id] ?? 0);
      const bWeek = isThisWeek(b.posted_at) ? (stars[b.id] ?? 0) * 2 : (stars[b.id] ?? 0);
      return bWeek - aWeek;
    });
    return list;
  }, [studies, stars, filter, sort, query]);

  const trending = useMemo(
    () =>
      [...studies]
        .filter((s) => isThisWeek(s.posted_at))
        .sort((a, b) => (stars[b.id] ?? 0) - (stars[a.id] ?? 0))
        .slice(0, 3),
    [studies, stars],
  );

  const recent = useMemo(
    () =>
      [...studies]
        .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
        .slice(0, 3),
    [studies],
  );

  const maxHot = hot[0]?.count ?? 1;

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Community Research Network
            </div>
            <h1 className="serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
              <em>Discover</em> what the community is researching.
            </h1>
            <p className="mt-4 text-base text-foreground/55 max-w-lg">
              Star, fork, and remix research connecting pollutants, genes, and outcomes — all
              shared by Watson & Crick scientists worldwide.
            </p>
          </div>
          <Link
            to="/"
            className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors"
          >
            ← ask your own
          </Link>
        </div>
      </section>

      {studies.length === 0 ? (
        <EmptyDiscover />
      ) : (
        <>
          <section className="mx-auto w-full max-w-6xl px-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SectionHeading label="Trending this week" />
                <SectionHeading label="Recently published" />
                {trending.slice(0, 1).map((s) => (
                  <StudyCard key={`tr-${s.id}`} study={s} onChange={refresh} />
                ))}
                {recent.slice(0, 1).map((s) => (
                  <StudyCard key={`re-${s.id}`} study={s} onChange={refresh} />
                ))}
              </div>
              <div className="pop-card p-5">
                <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-3">
                  🔥 Hot datasets
                </div>
                <ul className="space-y-2.5">
                  {hot.map((d, i) => (
                    <li key={d.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">
                          <span className="mono text-[10px] text-foreground/40 mr-2">#{i + 1}</span>
                          {d.name}
                        </span>
                        <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                          {d.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${(d.count / maxHot) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 pb-6 sticky top-[57px] z-10 bg-background/85 backdrop-blur">
            <div className="pop-card p-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics, datasets, researchers…"
                  className="w-full pl-9 pr-3 py-2 bg-background ink-border rounded-md text-sm focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`stamp transition-colors ${
                      filter === t ? "tag-ink" : "tag-paper hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-foreground/45 mr-1">
                  Sort
                </span>
                {(["trending", "recent", "starred"] as Sort[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full transition-colors ${
                      sort === s
                        ? "bg-foreground text-background"
                        : "ink-border bg-card hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 pb-16 flex-1">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 mb-3">
              {filtered.length} {filtered.length === 1 ? "study" : "studies"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <StudyCard key={s.id} study={s} onChange={refresh} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-8 mono text-xs text-foreground/45 uppercase tracking-[0.2em]">
                No studies match your filters.
              </div>
            )}
          </section>
        </>
      )}

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          EPA · NOAA · GWAS Catalog · Reactome · KEGG
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="col-span-1 sm:col-span-1 mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
      {label}
    </div>
  );
}

function EmptyDiscover() {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 pb-20 flex-1">
      <div className="pop-card p-10 text-center">
        <div className="flex justify-center mb-4">
          <Scientist who="watson" size={120} />
        </div>
        <p className="serif text-xl text-foreground/80 mb-2">
          <em>"Be the first to publish research to the community!"</em>
        </p>
        <p className="text-sm text-foreground/55 max-w-md mx-auto">
          Watson looks dejected. Run an analysis and share it with the world.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 px-5 py-2.5 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors mono text-[11px] uppercase tracking-[0.22em]"
        >
          Run an analysis →
        </Link>
      </div>
    </section>
  );
}
