import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Scientist } from "@/components/Scientist";
import {
  publishStudy,
  getProfileName,
  setProfileName,
  type CommunityTag,
  type PublishInput,
} from "@/lib/community-store";
import type { AnalyzeResponse } from "@/lib/mock-analyze";

const TAG_OPTIONS: CommunityTag[] = ["Climate", "Genomics", "Health", "Energy", "Economics"];

type Props = {
  open: boolean;
  onClose: () => void;
  question: string;
  data: AnalyzeResponse;
  forkedFrom?: PublishInput["forkedFrom"];
  onPublished: (studyId: string) => void;
};

function suggestTags(data: AnalyzeResponse): CommunityTag[] {
  const text = `${data.parsed.exposure} ${data.parsed.outcome}`.toLowerCase();
  const out = new Set<CommunityTag>();
  if (/(pm2\.5|heat|ozone|smoke|wildfire|climate|drought|flood|air|sea)/.test(text)) out.add("Climate");
  if (/(gene|apoe|gwas|variant|allele|brca|telomere|expression)/.test(text)) out.add("Genomics");
  if (/(asthma|cardio|alzheimer|disease|cancer|stroke|heart|health|lung|stress|mortality)/.test(text)) out.add("Health");
  if (/(solar|battery|grid|energy|wind|ev|renewable)/.test(text)) out.add("Energy");
  if (/(cost|price|subsidy|economic|business|productivity|market)/.test(text)) out.add("Economics");
  if (out.size === 0) out.add("Health");
  return Array.from(out);
}

export function PublishModal({ open, onClose, question, data, forkedFrom, onPublished }: Props) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<CommunityTag[]>([]);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"form" | "celebrate">("form");
  const [studyId, setStudyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setStudyId(null);
    setTitle(`${data.parsed.exposure} → ${data.parsed.outcome}${data.parsed.location ? ` in ${data.parsed.location}` : ""}`);
    setTags(suggestTags(data));
    setName(getProfileName() === "You" ? "" : getProfileName());
  }, [open, data]);

  if (!open) return null;

  const toggleTag = (t: CommunityTag) => {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const onConfirm = () => {
    const finalName = name.trim() || "Anonymous Researcher";
    setProfileName(finalName);
    const study = publishStudy({
      title: title.trim() || question,
      question,
      tags,
      researcherName: finalName,
      result: data,
      forkedFrom,
    });
    setStudyId(study.id);
    setStep("celebrate");
    onPublished(study.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-status-in">
      <div className="pop-card-lg bg-card w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-foreground/40 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {step === "form" ? (
          <>
            <div className="mono text-[10px] uppercase tracking-[0.28em] text-foreground/45 mb-2">
              Publish to community
            </div>
            <h2 className="serif text-2xl text-foreground mb-4">Share this research</h2>

            <label className="block">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                Study title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 ink-border rounded-md bg-background text-sm"
              />
            </label>

            <div className="mt-4">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                Tags
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`stamp transition-colors ${active ? "tag-ink" : "tag-paper hover:bg-muted"}`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block mt-4">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                Display name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. A. Chen"
                className="mt-1.5 w-full px-3 py-2 ink-border rounded-md bg-background text-sm"
              />
            </label>

            {forkedFrom && (
              <div className="mt-3 mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                Will credit "{forkedFrom.title.slice(0, 60)}…" by {forkedFrom.researcher}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="mono text-[10px] uppercase tracking-[0.22em] px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90"
              >
                Publish to community →
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <Scientist who="crick" size={120} />
            </div>
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2 animate-bob" />
            <h2 className="serif text-2xl text-foreground">Your research is now live!</h2>
            <p className="mt-2 text-sm text-foreground/65">
              Crick is already telling everyone about it. Find it on the Discover feed.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={onClose}
                className="mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted"
              >
                Stay here
              </button>
              <a
                href="/discover"
                className="mono text-[10px] uppercase tracking-[0.22em] px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90"
              >
                View on Discover →
              </a>
              {studyId && (
                <a
                  href="/profile"
                  className="mono text-[10px] uppercase tracking-[0.22em] px-3 py-2 ink-border rounded-full bg-card hover:bg-muted"
                >
                  My profile
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
