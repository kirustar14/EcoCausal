import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { StudyCard } from "@/components/StudyCard";
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history-store";
import { setQuestion, setResult } from "@/lib/run-store";
import { getStudies, getSavedIds, type CommunityStudy } from "@/lib/community-store";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Research History · Watson & Crick" },
      {
        name: "description",
        content: "Your past research sessions with Watson & Crick. Search, revisit, and revise.",
      },
    ],
  }),
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceTag(c: number) {
  if (c >= 0.8) return { label: "High", cls: "tag-green" };
  if (c >= 0.6) return { label: "Medium", cls: "tag-blue" };
  return { label: "Low", cls: "tag-paper" };
}

function HistoryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [savedStudies, setSavedStudies] = useState<CommunityStudy[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"history" | "saved">("history");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEntries(getHistory());
    const saved = getSavedIds();
    setSavedStudies(getStudies().filter((s) => saved.includes(s.id)));
    setLoaded(true);
  }, [tick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.question.toLowerCase().includes(q) ||
        e.result.parsed.exposure.toLowerCase().includes(q) ||
        e.result.parsed.outcome.toLowerCase().includes(q) ||
        (e.result.parsed.location ?? "").toLowerCase().includes(q),
    );
  }, [entries, query]);

  const open = (entry: HistoryEntry) => {
    setQuestion(entry.question);
    setResult(entry.result);
    navigate({ to: "/results" });
  };

  const remove = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(getHistory());
  };

  const wipe = () => {
    if (!confirm("Clear all research history? This can't be undone.")) return;
    clearHistory();
    setEntries([]);
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Lab notebook
            </div>
            <h1 className="serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-foreground">
              Research <em>history</em>
            </h1>
            <p className="mt-4 text-base text-foreground/55 max-w-lg">
              Every question you've asked Watson and Crick, with their findings.
              Click a card to revisit the full report.
            </p>
          </div>
          <Link
            to="/"
            className="mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors"
          >
            ← ask something new
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex p-1 ink-border rounded-full bg-card">
          {(
            [
              ["history", `My History (${entries.length})`],
              ["saved", `Saved (${savedStudies.length})`],
            ] as ["history" | "saved", string][]
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

        {tab === "history" && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by question, exposure, outcome, or location…"
                className="w-full px-4 py-2.5 bg-background border-2 border-foreground/15 rounded-md text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/60 transition-colors"
              />
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
              {filtered.length} / {entries.length} entries
            </div>
            {entries.length > 0 && (
              <button
                onClick={wipe}
                className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-16 flex-1">
        {!loaded ? (
          <div className="mono text-xs text-foreground/40 uppercase tracking-[0.2em]">
            Loading…
          </div>
        ) : tab === "history" ? (
          entries.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="mt-8 mono text-xs text-foreground/45 uppercase tracking-[0.2em]">
              No entries match "{query}".
            </div>
          ) : (
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((e) => (
                <HistoryCard
                  key={e.id}
                  entry={e}
                  onOpen={() => open(e)}
                  onDelete={() => remove(e.id)}
                />
              ))}
            </ul>
          )
        ) : savedStudies.length === 0 ? (
          <SavedEmpty />
        ) : (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedStudies.map((s) => (
              <StudyCard key={s.id} study={s} onChange={() => setTick((t) => t + 1)} />
            ))}
          </div>
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

function HistoryCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: HistoryEntry;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const conf = confidenceTag(entry.result.report.confidence);
  const topFinding = entry.result.report.key_findings[0];
  const { exposure, outcome, location } = entry.result.parsed;

  return (
    <li className="group relative">
      <button
        onClick={onOpen}
        className="block w-full text-left pop-card p-5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop-lg)] transition-transform"
      >
        {/* Header: avatars + meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1">
            <Scientist who="watson" size={36} />
            <Scientist who="crick" size={36} />
          </div>
          <div className="flex items-center gap-2">
            <span className={`stamp ${conf.cls}`}>
              {conf.label} · {Math.round(entry.result.report.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="mt-4 serif text-lg leading-snug text-foreground line-clamp-3">
          "{entry.question}"
        </div>

        {/* Parsed pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="stamp tag-blue">{exposure}</span>
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/40 self-center">
            →
          </span>
          <span className="stamp tag-green">{outcome}</span>
          {location && (
            <span className="stamp tag-paper">{location}</span>
          )}
        </div>

        {/* Top finding */}
        {topFinding && (
          <p className="mt-4 text-sm text-foreground/65 line-clamp-2">
            {topFinding}
          </p>
        )}

        {/* Footer meta */}
        <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center justify-between mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          <span>{fmtDate(entry.saved_at)}</span>
          <span>p = {entry.result.report.p_value} · n = {entry.result.report.sample_size.toLocaleString()}</span>
        </div>
      </button>

      {/* Delete (outside main button to avoid nested button) */}
      <button
        onClick={onDelete}
        aria-label="Delete entry"
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity mono text-[10px] uppercase tracking-[0.22em] text-foreground/45 hover:text-foreground px-2 py-1"
      >
        ✕
      </button>
    </li>
  );
}

function SavedEmpty() {
  return (
    <div className="mt-8 pop-card p-10 text-center max-w-2xl mx-auto">
      <div className="flex justify-center mb-5">
        <Scientist who="crick" size={80} />
      </div>
      <h2 className="serif text-2xl text-foreground">No saved research yet.</h2>
      <p className="mt-3 text-foreground/55 max-w-md mx-auto">
        Star studies on the Discover feed to bookmark them — they'll appear here.
      </p>
      <Link
        to="/discover"
        className="inline-block mt-6 px-5 py-2.5 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors mono text-[11px] uppercase tracking-[0.22em]"
      >
        Browse Discover →
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 pop-card p-10 text-center max-w-2xl mx-auto">
      <div className="flex justify-center gap-2 mb-5">
        <Scientist who="watson" size={80} />
        <Scientist who="crick" size={80} />
      </div>
      <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
        Empty notebook
      </div>
      <h2 className="serif text-2xl text-foreground">
        No research yet.
      </h2>
      <p className="mt-3 text-foreground/55 max-w-md mx-auto">
        Ask Watson and Crick your first question and we'll log every finding here
        so you can revisit it anytime.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 px-5 py-2.5 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors mono text-[11px] uppercase tracking-[0.22em]"
      >
        Start researching →
      </Link>
    </div>
  );
}
