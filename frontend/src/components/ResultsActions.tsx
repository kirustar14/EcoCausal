import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Loader2, Swords } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/mock-analyze";
import { downloadResearchPaper } from "@/lib/pdf-export";

type Props = {
  question: string;
  data: AnalyzeResponse;
};

export function ResultsActions({ question, data }: Props) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Small delay so the "Crick is writing" state is visible
      await new Promise((r) => setTimeout(r, 700));
      await downloadResearchPaper(question, data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/debate"
        className="inline-flex items-center gap-2 rounded-full ink-border bg-card px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
      >
        <Swords className="h-3.5 w-3.5" />
        Watch Watson & Crick debate this
      </Link>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full ink-border bg-card px-4 py-2 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-70"
      >
        {busy ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Crick is writing your paper…
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" />
            Download research paper
          </>
        )}
      </button>
    </div>
  );
}
