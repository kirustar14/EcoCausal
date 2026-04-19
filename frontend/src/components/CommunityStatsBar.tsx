import { useEffect, useState } from "react";
import { getStats, type CommunityStats } from "@/lib/community-store";

export function CommunityStatsBar() {
  const [stats, setStats] = useState<CommunityStats | null>(null);

  useEffect(() => {
    setStats(getStats());
    const id = setInterval(() => setStats(getStats()), 4000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 ink-border rounded-full bg-card mono text-[10px] uppercase tracking-[0.2em] text-foreground/70">
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
        </span>
        Live
      </span>
      <span className="text-foreground/30">·</span>
      <span>
        <span className="text-foreground font-medium">{stats.total_researchers}</span> researchers
      </span>
      <span className="text-foreground/30">·</span>
      <span>
        <span className="text-foreground font-medium">{stats.total_studies}</span> studies
      </span>
      <span className="text-foreground/30">·</span>
      <span>
        <span className="text-foreground font-medium">{stats.studies_this_week}</span> this week
      </span>
    </div>
  );
}
