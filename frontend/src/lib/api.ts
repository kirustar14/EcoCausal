// Central API client — all backend calls go through here.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── /experiment-summary ───────────────────────────────────────────

export type ExperimentSummaryResponse = {
  research_question: string;
  variables: {
    independent: string;
    dependent: string;
    mediators: string[];
    controls: string[];
  };
  datasets: {
    name: string;
    source: string;
    date_range: string;
    sample_size: number;
    description: string;
    url: string;
  }[];
  methodology: string;
  limitations: string[];
  statistical_parameters: {
    pearson_r: number;
    p_value: number;
    slope: number | null;
    confidence_interval: string;
    sample_size: number;
    confidence_level: string;
  };
};

export const fetchExperimentSummary = (question: string) =>
  apiPost<ExperimentSummaryResponse>("/experiment-summary", { question });

// ── /chat ─────────────────────────────────────────────────────────

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
  speaker?: "watson" | "crick";
};

export type ChatResponse = {
  speaker: "watson" | "crick";
  speaker_name: string;
  message: string;
  is_rerun_request: boolean;
  suggested_rerun_query: string | null;
};

export const fetchChat = (
  question: string,
  message: string,
  history: ChatHistoryItem[],
) =>
  apiPost<ChatResponse>("/chat", { question, message, history });

// ── /debate ───────────────────────────────────────────────────────

export type DebateTurn = {
  speaker: "watson" | "crick";
  message: string;
  verdict?: string;
};

export type DebateResponse = {
  hypothesis: string;
  env_factor: string;
  outcome: string;
  turns: DebateTurn[];
  summary: {
    needs_exploration: string[];
    suggested_improvements: string[];
    recommended_reruns: { label: string; query: string }[];
  };
};

export const fetchDebate = (question: string) =>
  apiPost<DebateResponse>("/debate", { question });

// ── /generate-paper ───────────────────────────────────────────────

export type PaperResponse = {
  title: string;
  abstract: string;
  methodology: string;
  datasets_used: string[];
  statistical_findings: {
    pearson_r: number;
    p_value: number;
    n: number;
    confidence: string;
    slope: number | null;
  };
  hypotheses: { rank: number; confidence: string; hypothesis: string; mechanism: string }[];
  biological_interpretation: string;
  limitations: string[];
  conclusion: string;
  genes: string[];
  generated_at: string;
};

export const fetchPaper = (question: string) =>
  apiPost<PaperResponse>("/generate-paper", { question });