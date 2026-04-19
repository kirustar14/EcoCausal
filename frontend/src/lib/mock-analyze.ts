export type NodeType = "pollutant" | "gene" | "pathway" | "outcome";

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  color?: string;
  weight?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  weight: number;
};

export type Hypothesis = {
  rank: number;
  confidence: "STRONG" | "MODERATE" | "EXPLORATORY";
  hypothesis: string;
  mechanism: string;
};

export type DatasetSource = {
  name: string;
  type: string;
  rows: number;
  coverage: string;
  measures: string[];
  url: string;
};

export type AnalyzeResponse = {
  question: string;
  generated_at: string;
  env_factor: string;
  outcome: string;
  datasets_used: string[];
  stats: {
    r: number;
    p: number;
    slope: number;
    confidence: "HIGH" | "MODERATE" | "LOW";
    n: number;
  };
  hypotheses: Hypothesis[];
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  report: string;
  summary: string;
  similar_questions: string[];
};

export type CompareResponse = {
  analysis_a: AnalyzeResponse;
  analysis_b: AnalyzeResponse;
  comparison: {
    stronger_association: string;
    reason: string;
    shared_mechanisms: string;
    key_difference: string;
    recommendation: string;
  };
};

export type SourcesResponse = {
  datasets: DatasetSource[];
  total_rows: number;
};

export type DatasetsResponse = {
  epa: { rows: number; mean_pm25: number; max_pm25: number; date_range: string };
  noaa: { rows: number; mean_tmax: number; max_tmax: number; date_range: string };
  scripps: { rows: number; mean_temp: number; mean_humidity: number };
  cdc: { asthma_rows: number; cognitive_rows: number };
  gwas: Record<string, number>;
  cache_size: number;
};

const BASE = "http://localhost:8000";

export async function analyze(question: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  return {
    ...data,
    question,
    generated_at: new Date().toISOString(),
    graph: {
      nodes: data.graph.nodes.map((n: any) => ({
        ...n,
        type: n.type === "disease" ? "outcome" : n.type,
        weight: n.type === "pollutant" ? 1 : n.type === "gene" ? 0.7 : 0.5,
      })),
      links: data.graph.edges ?? [],
    },
  };
}

export async function compare(question_a: string, question_b: string): Promise<CompareResponse> {
  const res = await fetch(`${BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_a, question_b }),
  });
  const data = await res.json();
  const normalize = (a: any, q: string): AnalyzeResponse => ({
    ...a,
    question: q,
    generated_at: new Date().toISOString(),
    graph: {
      nodes: a.graph.nodes.map((n: any) => ({
        ...n,
        type: n.type === "disease" ? "outcome" : n.type,
        weight: n.type === "pollutant" ? 1 : n.type === "gene" ? 0.7 : 0.5,
      })),
      links: a.graph.edges ?? [],
    },
  });
  return {
    analysis_a: normalize(data.analysis_a, question_a),
    analysis_b: normalize(data.analysis_b, question_b),
    comparison: data.comparison,
  };
}

export async function getSources(): Promise<SourcesResponse> {
  const res = await fetch(`${BASE}/sources`);
  return res.json();
}

export async function getDatasets(): Promise<DatasetsResponse> {
  const res = await fetch(`${BASE}/datasets`);
  return res.json();
}