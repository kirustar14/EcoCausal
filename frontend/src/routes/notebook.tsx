import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Scientist } from "@/components/Scientist";
import { BookOpen, ExternalLink, FileCode } from "lucide-react";

export const Route = createFileRoute("/notebook")({
  component: NotebookPage,
  head: () => ({
    meta: [
      { title: "Notebook · Watson & Crick" },
      {
        name: "description",
        content:
          "Interactive Marimo notebook for raw correlation analysis. Adjust parameters and explore the model.",
      },
    ],
  }),
});

function NotebookPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/40 mb-3">
              Interactive Notebook
            </div>
            <h1 className="serif text-4xl sm:text-5xl text-foreground leading-tight">
              Raw <em>correlation</em> analysis.
            </h1>
          </div>
          <div className="stamp tag-paper">
            <FileCode className="inline h-3 w-3 mr-1" />
            Powered by Marimo — Interactive Python Notebooks
          </div>
        </div>

        <div className="mt-6 flex items-end gap-6">
          <div className="flex flex-col items-center">
            <div className="bubble bubble-left mb-3 max-w-[280px] text-sm">
              <p className="text-foreground/80 leading-snug">
                Dive into the raw correlation analysis. Adjust parameters and see how the results change.
              </p>
            </div>
            <Scientist who="watson" size={84} />
          </div>
          <div className="flex flex-col items-center ml-auto">
            <div className="bubble bubble-right mb-3 max-w-[260px] text-sm">
              <p className="text-foreground/80 leading-snug text-right">
                This is where the real science happens. No black boxes here.
              </p>
            </div>
            <Scientist who="crick" size={84} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="space-y-4">
          <div className="pop-card bg-card overflow-hidden">
            <iframe
              src="http://localhost:8081"
              className="w-full"
              style={{ height: "1100px", border: "none" }}
              title="Watson & Crick Marimo Notebook"
            />
            <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
                Watson & Crick · Live Correlation Explorer · Marimo
              </div>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted transition-colors"
                >
                  <BookOpen className="h-3 w-3" /> Documentation
                </a>
                <a
                  href="http://localhost:8081"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Open Full Notebook <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center mono text-[10px] uppercase tracking-[0.22em] text-foreground/30">
          Marimo · Sphinx · Python · Reproducible Science
        </div>
      </footer>
    </main>
  );
}