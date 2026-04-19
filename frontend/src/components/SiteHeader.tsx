import { Link } from "@tanstack/react-router";

const navLinks = [
  { to: "/discover" as const, label: "Discover" },
  { to: "/scripps" as const, label: "Scripps Data" },
  { to: "/solar" as const, label: "Solar" },
  { to: "/notebook" as const, label: "Notebook" },
  { to: "/leaderboard" as const, label: "Leaderboard" },
  { to: "/history" as const, label: "History" },
  { to: "/profile" as const, label: "Profile" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2 group shrink-0">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Watson<span className="text-foreground/40 mx-1">&</span>Crick
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40 hidden sm:inline">
            env-health research
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-foreground/55" }}
              className="mono text-[11px] uppercase tracking-[0.22em] hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
