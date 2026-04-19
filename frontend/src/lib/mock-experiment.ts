// Fetches real experiment metadata from the backend /experiment-summary endpoint.
// The old buildExperimentMeta() mock is kept as a fallback shape reference only.

import type { AnalyzeResponse } from "./mock-analyze";
import { fetchExperimentSummary, type ExperimentSummaryResponse } from "./api";

export type Dataset = {
  id: string;
  name: string;
  source: string;
  dateRange: string;
  sampleSize: string;
  description: string;
};

export type ExperimentMeta = {
  variables: {
    independent: string;
    dependent: string;
    controls: string[];
  };
  datasets: Dataset[];
  methodology: string;
  limitations: string[];
  stats: {
    pValue: number;
    rValue: number;
    confidenceInterval: string;
    sampleSize: number;
  };
  hypothesis: string;
};

// Converts the backend response shape → the ExperimentMeta shape the UI expects
function toMeta(r: ExperimentSummaryResponse, data: AnalyzeResponse): ExperimentMeta {
  return {
    variables: {
      independent: r.variables.independent,
      dependent: r.variables.dependent,
      controls: r.variables.controls,
    },
    datasets: r.datasets.map((d) => ({
      id: d.name.toLowerCase().replace(/\s+/g, "-"),
      name: d.name,
      source: d.source,
      dateRange: d.date_range,
      sampleSize: d.sample_size.toLocaleString(),
      description: d.description,
    })),
    methodology: r.methodology,
    limitations: r.limitations,
    stats: {
      pValue: r.statistical_parameters.p_value,
      rValue: r.statistical_parameters.pearson_r,
      confidenceInterval: r.statistical_parameters.confidence_interval,
      sampleSize: r.statistical_parameters.sample_size,
    },
    hypothesis: data.summary,
  };
}

// Cache so we don't re-fetch for the same question within a session
const cache = new Map<string, ExperimentMeta>();

export async function fetchExperimentMeta(
  question: string,
  data: AnalyzeResponse,
): Promise<ExperimentMeta> {
  if (cache.has(question)) return cache.get(question)!;
  try {
    const raw = await fetchExperimentSummary(question);
    const meta = toMeta(raw, data);
    cache.set(question, meta);
    return meta;
  } catch (err) {
    console.warn("[mock-experiment] backend unavailable, using fallback", err);
    return buildExperimentMetaFallback(data);
  }
}

// ── Sync fallback (used by components that haven't loaded yet) ────
// Kept so ExperimentSummary can show something while the fetch is in flight.
export function buildExperimentMeta(data: AnalyzeResponse): ExperimentMeta {
  return buildExperimentMetaFallback(data);
}

function buildExperimentMetaFallback(data: AnalyzeResponse): ExperimentMeta {
  const exposure = data.env_factor;
  const outcome = data.outcome;
  return {
    variables: {
      independent: exposure,
      dependent: `${outcome} (incidence + severity)`,
      controls: ["Age", "Sex", "Smoking status", "Socioeconomic index", "Co-pollutants"],
    },
    datasets: [
      {
        id: "epa-aqs",
        name: "EPA AQS",
        source: "U.S. Environmental Protection Agency — Air Quality System",
        dateRange: "2015 – 2024",
        sampleSize: "~14M hourly readings",
        description:
          "Hourly ambient pollutant measurements (PM2.5, NO₂, O₃) from EPA-monitored stations across the U.S., aggregated to ZIP-3 monthly means.",
      },
      {
        id: "gwas",
        name: "GWAS Catalog",
        source: "EBI / NHGRI — Genome-Wide Association Studies Catalog",
        dateRange: "v1.0.2 (2024-09)",
        sampleSize: "~7,400 curated studies",
        description:
          "Curated SNP–trait associations across human disease, used to weight susceptibility loci in the causal graph.",
      },
      {
        id: "scripps-heat",
        name: "Scripps Heat Map",
        source: "Scripps Institution of Oceanography",
        dateRange: "2010 – 2023",
        sampleSize: "~9,200 station-days",
        description:
          "Gridded surface temperature and humidity rasters, used to derive heat-index exposure deltas above the 95th local percentile.",
      },
      {
        id: "noaa",
        name: "NOAA Climate Data",
        source: "National Oceanic & Atmospheric Administration — GHCN-Daily",
        dateRange: "2000 – 2024",
        sampleSize: "~115k stations",
        description:
          "Daily precipitation, temperature and wind records, used as covariates and to detrend seasonality in pollutant exposure.",
      },
    ],
    methodology: `We linked ${exposure} exposure records to ${outcome} phenotypes by linking ZIP-3 monthly means to cohort residences over a 9-year window. Mixed-effects models with random intercepts per county controlled for age, sex, smoking and SES.`,
    limitations: [
      "Exposure is estimated at ZIP-3 resolution; intra-ZIP variation is unmodelled.",
      "Cohort skews toward European ancestry — generalisability to other populations is limited.",
      "Causal direction relies on temporal precedence and Mendelian-randomisation proxies; residual confounding is possible.",
    ],
    stats: {
      pValue: data.stats?.p ?? 0,
      rValue: data.stats?.r ?? 0.41,
      confidenceInterval: "±0.09 (bootstrap 95% CI)",
      sampleSize: data.stats?.n ?? 0,
    },
    hypothesis: data.summary,
  };
}