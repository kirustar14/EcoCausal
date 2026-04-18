export type NodeType = "pollutant" | "gene" | "pathway" | "outcome";

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  weight?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  weight: number;
};

export type AnalyzeResponse = {
  question: string;
  parsed: {
    exposure: string;
    outcome: string;
    location: string | null;
  };
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  report: {
    summary: string;
    key_findings: string[];
    confidence: number;
    p_value: number;
    sample_size: number;
    sources: { label: string; kind: string }[];
  };
  generated_at: string;
};

const ALZ: Omit<AnalyzeResponse, "question" | "generated_at"> = {
  parsed: { exposure: "PM2.5", outcome: "Alzheimer's disease", location: "San Diego, CA" },
  graph: {
    nodes: [
      { id: "pm25", type: "pollutant", label: "PM2.5", weight: 1 },
      { id: "no2", type: "pollutant", label: "NO₂", weight: 0.6 },
      { id: "apoe", type: "gene", label: "APOE-ε4", weight: 0.9 },
      { id: "trem2", type: "gene", label: "TREM2", weight: 0.7 },
      { id: "cr1", type: "gene", label: "CR1", weight: 0.5 },
      { id: "neuro", type: "pathway", label: "Neuroinflammation", weight: 0.8 },
      { id: "oxstr", type: "pathway", label: "Oxidative stress", weight: 0.7 },
      { id: "bbb", type: "pathway", label: "BBB disruption", weight: 0.6 },
      { id: "ad", type: "outcome", label: "Alzheimer's risk ↑", weight: 1 },
      { id: "cog", type: "outcome", label: "Cognitive decline", weight: 0.7 },
    ],
    links: [
      { source: "pm25", target: "neuro", weight: 0.78 },
      { source: "pm25", target: "oxstr", weight: 0.71 },
      { source: "pm25", target: "bbb", weight: 0.55 },
      { source: "no2", target: "neuro", weight: 0.42 },
      { source: "neuro", target: "apoe", weight: 0.62 },
      { source: "neuro", target: "trem2", weight: 0.58 },
      { source: "oxstr", target: "trem2", weight: 0.55 },
      { source: "bbb", target: "cr1", weight: 0.48 },
      { source: "apoe", target: "ad", weight: 0.84 },
      { source: "trem2", target: "ad", weight: 0.59 },
      { source: "cr1", target: "ad", weight: 0.45 },
      { source: "ad", target: "cog", weight: 0.7 },
    ],
  },
  report: {
    summary:
      "Long-term PM2.5 exposure in San Diego shows a significant association with elevated Alzheimer's risk, mediated by neuroinflammation and oxidative stress involving APOE-ε4 and TREM2.",
    key_findings: [
      "+1 µg/m³ annual PM2.5 → ~8% higher AD incidence in cohort.",
      "APOE-ε4 carriers show a 2.3× amplified effect.",
      "Neuroinflammation pathway (GO:0150076) is the strongest mediator (β = 0.41).",
    ],
    confidence: 0.86,
    p_value: 0.002,
    sample_size: 12480,
    sources: [
      { label: "EPA AQS — San Diego County (2015–2023)", kind: "EPA" },
      { label: "GWAS Catalog — AD susceptibility loci", kind: "GWAS" },
      { label: "Reactome R-HSA-168256 — Neuroinflammation", kind: "Reactome" },
    ],
  },
};

const HEAT: Omit<AnalyzeResponse, "question" | "generated_at"> = {
  parsed: { exposure: "Heat stress", outcome: "Cardiovascular disease", location: null },
  graph: {
    nodes: [
      { id: "heat", type: "pollutant", label: "Heat stress", weight: 1 },
      { id: "humid", type: "pollutant", label: "Humidity", weight: 0.5 },
      { id: "ace", type: "gene", label: "ACE", weight: 0.85 },
      { id: "nos3", type: "gene", label: "NOS3", weight: 0.7 },
      { id: "hsp70", type: "gene", label: "HSPA1A", weight: 0.65 },
      { id: "vaso", type: "pathway", label: "Vasodilation", weight: 0.8 },
      { id: "raas", type: "pathway", label: "RAAS activation", weight: 0.7 },
      { id: "thromb", type: "pathway", label: "Thrombosis", weight: 0.6 },
      { id: "mi", type: "outcome", label: "MI risk ↑", weight: 1 },
      { id: "stroke", type: "outcome", label: "Stroke risk ↑", weight: 0.8 },
    ],
    links: [
      { source: "heat", target: "vaso", weight: 0.7 },
      { source: "heat", target: "raas", weight: 0.65 },
      { source: "heat", target: "thromb", weight: 0.55 },
      { source: "humid", target: "thromb", weight: 0.4 },
      { source: "vaso", target: "nos3", weight: 0.6 },
      { source: "raas", target: "ace", weight: 0.75 },
      { source: "thromb", target: "hsp70", weight: 0.5 },
      { source: "ace", target: "mi", weight: 0.78 },
      { source: "nos3", target: "mi", weight: 0.6 },
      { source: "hsp70", target: "stroke", weight: 0.55 },
      { source: "ace", target: "stroke", weight: 0.5 },
    ],
  },
  report: {
    summary:
      "Acute heat stress activates RAAS and impairs vasodilation, elevating MI and stroke risk — particularly in carriers of ACE I/D variants.",
    key_findings: [
      "Each +1 °C above local 95th percentile → 2.7% rise in CV mortality.",
      "ACE D/D carriers show 1.8× MI risk under sustained heat.",
      "NOS3 expression suppressed within 48h of heatwave onset.",
    ],
    confidence: 0.79,
    p_value: 0.008,
    sample_size: 8421,
    sources: [
      { label: "NOAA Heat Index Archive", kind: "NOAA" },
      { label: "UK Biobank — CV phenotypes", kind: "BioBank" },
      { label: "KEGG hsa04270 — Vascular smooth muscle", kind: "KEGG" },
    ],
  },
};

const ASTHMA: Omit<AnalyzeResponse, "question" | "generated_at"> = {
  parsed: { exposure: "Air quality (O₃, PM2.5)", outcome: "Asthma", location: "San Diego, CA" },
  graph: {
    nodes: [
      { id: "o3", type: "pollutant", label: "Ozone (O₃)", weight: 1 },
      { id: "pm25", type: "pollutant", label: "PM2.5", weight: 0.8 },
      { id: "no2", type: "pollutant", label: "NO₂", weight: 0.6 },
      { id: "il13", type: "gene", label: "IL13", weight: 0.85 },
      { id: "orm1", type: "gene", label: "ORMDL3", weight: 0.7 },
      { id: "tslp", type: "gene", label: "TSLP", weight: 0.6 },
      { id: "th2", type: "pathway", label: "Th2 inflammation", weight: 0.85 },
      { id: "epi", type: "pathway", label: "Epithelial damage", weight: 0.7 },
      { id: "mucus", type: "pathway", label: "Mucus hypersecretion", weight: 0.6 },
      { id: "asthma", type: "outcome", label: "Asthma exacerbation", weight: 1 },
      { id: "er", type: "outcome", label: "ER visits ↑", weight: 0.7 },
    ],
    links: [
      { source: "o3", target: "epi", weight: 0.78 },
      { source: "o3", target: "th2", weight: 0.6 },
      { source: "pm25", target: "th2", weight: 0.7 },
      { source: "pm25", target: "mucus", weight: 0.55 },
      { source: "no2", target: "epi", weight: 0.5 },
      { source: "th2", target: "il13", weight: 0.82 },
      { source: "th2", target: "tslp", weight: 0.6 },
      { source: "epi", target: "orm1", weight: 0.55 },
      { source: "il13", target: "asthma", weight: 0.85 },
      { source: "orm1", target: "asthma", weight: 0.6 },
      { source: "tslp", target: "asthma", weight: 0.55 },
      { source: "asthma", target: "er", weight: 0.75 },
    ],
  },
  report: {
    summary:
      "Combined O₃ and PM2.5 exposure in the San Diego air basin drives Th2-mediated inflammation and epithelial damage, increasing asthma exacerbations and ER visits — strongest in IL13/ORMDL3 risk-allele carriers.",
    key_findings: [
      "Ozone exceedance days correlate with 14% spike in pediatric ER asthma visits.",
      "IL13 rs20541 carriers show 1.6× exacerbation rate.",
      "Effect is concentrated in zip codes near I-5 and I-805 corridors.",
    ],
    confidence: 0.82,
    p_value: 0.004,
    sample_size: 9876,
    sources: [
      { label: "EPA AirNow — San Diego (2018–2024)", kind: "EPA" },
      { label: "GWAS Catalog — Asthma loci", kind: "GWAS" },
      { label: "GO:0002460 — Adaptive immune response", kind: "GO" },
    ],
  },
};

function pickDataset(q: string): Omit<AnalyzeResponse, "question" | "generated_at"> {
  const s = q.toLowerCase();
  if (s.includes("heat") || s.includes("cardio") || s.includes("heart")) return HEAT;
  if (s.includes("asthma") || s.includes("air quality") || s.includes("ozone")) return ASTHMA;
  return ALZ;
}

export async function mockAnalyze(question: string): Promise<AnalyzeResponse> {
  await new Promise((r) => setTimeout(r, 3200));
  return {
    ...pickDataset(question),
    question,
    generated_at: new Date().toISOString(),
  };
}
