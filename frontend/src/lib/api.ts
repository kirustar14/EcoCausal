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

// ── /analyze ─────────────────────────────────────────────────────

export type AnalyzeAPIResponse = {
  env_factor: string;
  outcome: string;
  stats: { r: number; p: number; slope: number | null; confidence: "HIGH" | "MODERATE" | "LOW"; n: number };
  hypotheses: { rank: number; confidence: string; hypothesis: string; mechanism: string }[];
  graph: {
    nodes: { id: string; label: string; type: string; color: string }[];
    edges: { source: string; target: string; weight: number }[];
  };
  report: string;
  summary: string;
  similar_questions: string[];
  datasets_used: string[];
};

export const fetchAnalyze = (question: string) =>
  apiPost<AnalyzeAPIResponse>("/analyze", { question });

// ── /banter ──────────────────────────────────────────────────────

export type BanterStep = "ingesting_data" | "computing_stats" | "mapping_genes" | "generating_hypotheses" | "complete";

export type BanterResponse = {
  step: BanterStep;
  step_index: number;
  watson: string;
  crick: string;
  env_factor: string;
  outcome: string;
};

export const fetchBanterStep = (question: string, step: BanterStep, step_index: number) =>
  apiPost<BanterResponse>("/banter", { question, step, step_index });

// ── /signal-extraction ────────────────────────────────────────────

export type SignalExtractionResponse = {
  question: string;
  funnel: { stage: string; count: number; label: string; description: string }[];
  confidence_factors: { factor: string; score: number; weight: number; contribution: number; description: string }[];
  overall_confidence: number;
  confidence_level: "HIGH" | "MODERATE" | "LOW";
  env_factor: string;
  outcome: string;
  datasets_used: string[];
};

export const fetchSignalExtraction = (question: string) =>
  apiPost<SignalExtractionResponse>("/signal-extraction", { question });

// ── /scripps ─────────────────────────────────────────────────────

export type ScrippsResponse = {
  time_of_day: string;
  hour_range: string;
  zones: { zone: string; temp_f: number; temp_c: number; humidity: number; heat_index: number; risk: "HIGH" | "MODERATE" | "LOW" }[];
  summary: { mean_temp_f: number; max_temp_f: number; mean_humidity: number; high_risk_zones: string[]; data_source: string; n_readings: number };
  metrics: string[];
};

export const fetchScripps = (time: "morning" | "afternoon" | "evening" = "afternoon") =>
  fetch(`${BASE}/scripps?time=${time}`).then((r) => r.json()) as Promise<ScrippsResponse>;

// ── /solar/sandiego ───────────────────────────────────────────────

export type SolarResponse = {
  neighborhoods: { name: string; solar_permits: number; lat: number; lng: number; asthma_prevalence_pct: number; respiratory_er_per_10k: number; co2_offset_tons_yr: number; solar_coverage_pct: number; data_year: number }[];
  summary: { total_permits: number; total_co2_offset_tons: number; mean_asthma_pct: number; correlation: { solar_vs_asthma_r: number; p_value: number; interpretation: string } };
  chart_series: { x_label: string; y1_label: string; y2_label: string; points: { x: number; y1: number; y2: number; label: string }[] };
  data_sources: string[];
  generated_at: string;
};

export const fetchSolar = () =>
  fetch(`${BASE}/solar/sandiego`).then((r) => r.json()) as Promise<SolarResponse>;