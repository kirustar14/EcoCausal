import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 group">
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Watson<span className="text-foreground/40 mx-1">&</span>Crick
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/40 hidden sm:inline">
            env-health research
          </span>
        </Link>
      </div>
    </header>
  );
}
