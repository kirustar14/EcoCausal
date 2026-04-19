// Fetches debate data from the real /debate backend endpoint.
// The old buildDebate() mock is kept as a fallback.

import type { AnalyzeResponse } from "./mock-analyze";
import { fetchDebate, type DebateResponse } from "./api";

export type DebateLine = { speaker: "watson" | "crick"; text: string };

export type DebateSummary = {
  explore: string[];
  improvements: string[];
  rerunQueries: string[];
};

// ── Real API call ─────────────────────────────────────────────────

export async function loadDebate(question: string): Promise<{
  lines: DebateLine[];
  summary: DebateSummary;
  hypothesis: string;
}> {
  const res: DebateResponse = await fetchDebate(question);
  return {
    hypothesis: res.hypothesis,
    lines: res.turns.map((t) => ({ speaker: t.speaker, text: t.message })),
    summary: {
      explore:       res.summary.needs_exploration,
      improvements:  res.summary.suggested_improvements,
      rerunQueries:  res.summary.recommended_reruns.map((r) => r.query),
    },
  };
}

// ── Sync fallbacks (used if backend is unavailable) ───────────────

export function buildDebate(data: AnalyzeResponse): DebateLine[] {
  const exposure = data.env_factor;
  const outcome  = data.outcome;
  const r        = data.stats?.r?.toFixed(2) ?? "0.41";
  const p        = data.stats?.p?.toFixed(3) ?? "0.05";
  const n        = data.stats?.n?.toLocaleString() ?? "n";
  return [
    {
      speaker: "watson",
      text: `The hypothesis stands: ${exposure} is meaningfully linked to ${outcome}. We have p = ${p}, n = ${n}, and a biologically plausible inflammatory pathway tying them together. The signal is real.`,
    },
    {
      speaker: "crick",
      text: `Real, perhaps — but fragile. Your r-value is ${r}; that leaves the majority of variance unexplained. And ZIP-3 exposure resolution is far too coarse to claim individual-level causality. You're conflating ecological and individual effects.`,
    },
    {
      speaker: "watson",
      text: `An r of ${r} in a noisy real-world cohort is respectable, and the mediation analysis through the genetic susceptibility loci replicates the direction of effect. It's not just correlation — the temporal precedence and the dose–response gradient point the same way.`,
    },
    {
      speaker: "crick",
      text: `Then strengthen it. Re-run with finer spatial resolution, stratify by ancestry rather than averaging across, and include an independent replication cohort. Until that lands, I'd flag this as suggestive, not established.`,
    },
    {
      speaker: "watson",
      text: `Agreed — next steps: (1) ZIP-5 exposure linkage, (2) ancestry-stratified models, (3) pre-registered replication in an external cohort, and (4) Mendelian-randomisation as a second causal probe. That should settle it.`,
    },
    {
      speaker: "crick",
      text: `Verdict: promising but requires replication. The biology is plausible and the statistics are honest — but extraordinary claims need extraordinary evidence. Let's not announce until the replication lands.`,
    },
  ];
}

export function buildDebateSummary(data: AnalyzeResponse): DebateSummary {
  const exposure = data.env_factor;
  const outcome  = data.outcome;
  return {
    explore: [
      `Finer spatial resolution for ${exposure} exposure (ZIP-5 or address-level).`,
      `Ancestry-stratified replication beyond the European-skewed primary cohort.`,
      `Mechanistic validation of the top mediating pathway in cell or animal models.`,
    ],
    improvements: [
      `Pre-register the replication analysis to lock the primary endpoint and model spec.`,
      `Add Mendelian-randomisation as an independent causal probe.`,
      `Quantify exposure measurement error explicitly via simulation.`,
    ],
    rerunQueries: [
      `Re-run ${exposure} → ${outcome} stratified by APOE genotype`,
      `Test ${exposure} effect on ${outcome} controlling for socioeconomic index`,
      `Compare ${exposure} → ${outcome} across ancestry groups`,
    ],
  };
}