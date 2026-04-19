// Community Research Network store.
// Mocks "shared" cross-user storage in localStorage so the app can act like a
// social platform without a real backend. Structured so the API surface
// (publishStudy, starStudy, listStudies, etc.) can later swap in a Cloud
// backend with no component changes.

import type { AnalyzeResponse } from "@/lib/mock-analyze";

// ---- Storage keys ---------------------------------------------------------
const SEED_FLAG = "wc:community:seeded:v1";
const STUDIES_KEY = "wc:community:studies:v1";
const STARS_KEY = "wc:community:stars:v1";
const FORKS_KEY = "wc:community:forks:v1";
const RESEARCHERS_KEY = "wc:community:researchers:v1";
const STATS_KEY = "wc:community:stats:v1";

const PROFILE_NAME_KEY = "wc:profile:name";
const PROFILE_SAVED_KEY = "wc:profile:saved:v1";
const PROFILE_PUBLISHED_KEY = "wc:profile:published:v1";

// ---- Types ----------------------------------------------------------------
export type Confidence = "HIGH" | "MODERATE" | "EXPLORATORY";
export type CommunityTag = "Climate" | "Genomics" | "Health" | "Energy" | "Economics";

export type CommunityStudy = {
  id: string;
  title: string;
  question: string;
  confidence: Confidence;
  datasets: string[];
  tags: CommunityTag[];
  researcher: { name: string; initials: string };
  posted_at: string;
  result?: AnalyzeResponse;
  summary: string;
  forked_from?: { id: string; title: string; researcher: string } | null;
};

export type Researcher = {
  name: string;
  initials: string;
  joined_at: string;
  studies: number;
  total_stars: number;
};

// ---- Safe JSON helpers ----------------------------------------------------
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

function uuid() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function initials(name: string) {
  const parts = name.replace(/^Dr\.\s*/i, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---- Time helpers ---------------------------------------------------------
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// ---- Confidence styling helpers ------------------------------------------
export function confidenceClass(c: Confidence) {
  if (c === "HIGH") return "tag-green";
  if (c === "MODERATE") return "tag-blue";
  return "tag-paper";
}

// ---- Seed data ------------------------------------------------------------
const NAMED_STUDIES: Omit<CommunityStudy, "id" | "posted_at">[] = [
  {
    title: "PM2.5 Exposure Correlates with Early-Onset Alzheimer's in San Diego County",
    question: "Does PM2.5 exposure correlate with early-onset Alzheimer's risk in San Diego?",
    confidence: "HIGH",
    datasets: ["EPA AQS", "GWAS Catalog"],
    tags: ["Climate", "Genomics"],
    researcher: { name: "Dr. A. Chen", initials: "AC" },
    summary: "Long-term fine-particulate exposure shows a significant association with early-onset AD, mediated by APOE-ε4 and neuroinflammation pathways.",
  },
  {
    title: "Urban Heat Islands Amplify Cardiovascular Stress Markers in Coastal Cities",
    question: "How do urban heat islands amplify cardiovascular stress in coastal populations?",
    confidence: "HIGH",
    datasets: ["Scripps Heat Map", "NOAA", "GWAS Catalog"],
    tags: ["Climate", "Health"],
    researcher: { name: "M. Patel", initials: "MP" },
    summary: "Coastal heat-island intensity correlates with elevated CV biomarkers and ACE I/D variant penetrance during sustained heatwaves.",
  },
  {
    title: "Solar Energy Adoption Inversely Correlates with Respiratory Disease Rates",
    question: "Does residential solar adoption correlate with lower respiratory disease incidence?",
    confidence: "MODERATE",
    datasets: ["ZenPower Solar", "EPA AQS"],
    tags: ["Energy", "Health"],
    researcher: { name: "J. Rivera", initials: "JR" },
    summary: "Zip codes with >18% solar permit density show measurable reductions in PM2.5 and a 6–9% drop in pediatric asthma ER visits.",
  },
  {
    title: "Ocean Acidification Rates Predict Coastal Population Asthma Prevalence",
    question: "Do ocean acidification rates predict coastal asthma prevalence?",
    confidence: "MODERATE",
    datasets: ["Scripps CalCOFI", "EPA AQS"],
    tags: ["Climate", "Health"],
    researcher: { name: "S. Kim", initials: "SK" },
    summary: "Aerosolized marine particulates from acidifying coastal waters correlate with IL13-mediated asthma prevalence within 5km of shore.",
  },
  {
    title: "APOE Gene Variants Show Elevated Expression in High-Particulate Environments",
    question: "Do APOE variants show elevated expression in high-particulate environments?",
    confidence: "HIGH",
    datasets: ["GWAS Catalog", "EPA AQS", "ClinVar"],
    tags: ["Genomics"],
    researcher: { name: "T. Okafor", initials: "TO" },
    summary: "APOE-ε4 carriers in PM2.5 hotspots show 2.1× expression of inflammatory transcripts vs low-exposure controls.",
  },
  {
    title: "ZenPower Solar Permits Cluster in Low-Pollution Zip Codes: A Feedback Loop",
    question: "Do solar permits cluster in already low-pollution zip codes?",
    confidence: "EXPLORATORY",
    datasets: ["ZenPower Solar", "EPA AQS"],
    tags: ["Energy", "Climate"],
    researcher: { name: "L. Torres", initials: "LT" },
    summary: "Spatial clustering analysis suggests adoption follows pre-existing air-quality gradients, raising equity questions for incentive design.",
  },
];

const TOPIC_TEMPLATES: Array<{
  title: (loc: string) => string;
  question: (loc: string) => string;
  datasets: string[];
  tags: CommunityTag[];
  summary: string;
}> = [
  { title: (l) => `Wildfire Smoke Exposure and Pediatric Lung Function Decline in ${l}`, question: (l) => `How does wildfire smoke affect pediatric lung function in ${l}?`, datasets: ["EPA AQS", "NOAA", "Pediatric Spirometry DB"], tags: ["Climate", "Health"], summary: "PM2.5 spikes during wildfire season correlate with measurable FEV1 decline in school-age children." },
  { title: (l) => `BRCA Variant Frequency vs Industrial Solvent Exposure in ${l}`, question: (l) => `Do BRCA variant frequencies track industrial solvent exposure near ${l}?`, datasets: ["GWAS Catalog", "EPA TRI", "ClinVar"], tags: ["Genomics", "Health"], summary: "BRCA1/2 variant clusters appear elevated in zip codes with sustained benzene/toluene release." },
  { title: (l) => `Sea Surface Temperature Anomalies and Coastal Vibrio Outbreaks in ${l}`, question: (l) => `Do SST anomalies predict Vibrio outbreaks along ${l}?`, datasets: ["NOAA", "Scripps CalCOFI", "CDC NORS"], tags: ["Climate", "Health"], summary: "Lagged 2-week warming events correlate with reported gastrointestinal Vibrio cases." },
  { title: (l) => `Diesel Particulate Density Near Schools and ADHD Diagnosis Rates in ${l}`, question: (l) => `Does diesel particulate density near schools correlate with ADHD rates in ${l}?`, datasets: ["EPA AQS", "DOT Truck Routes", "School Health Records"], tags: ["Climate", "Health"], summary: "Schools within 300m of major freight corridors show 1.4× ADHD diagnosis rates." },
  { title: (l) => `Battery Storage Deployment and Grid Emission Intensity in ${l}`, question: (l) => `How does battery storage deployment shift grid emission intensity in ${l}?`, datasets: ["EIA-861", "ZenPower Solar", "CAISO"], tags: ["Energy", "Climate"], summary: "Each 100MWh of storage deployed reduces evening-peak gas-peaker output by ~7%." },
  { title: (l) => `Microplastic Concentrations in Drinking Water and Endocrine Disorders in ${l}`, question: (l) => `Do microplastic concentrations correlate with endocrine disorders in ${l}?`, datasets: ["USGS Water Quality", "NHANES"], tags: ["Health", "Climate"], summary: "Detectable polystyrene fragments in tap water correlate with thyroid panel anomalies." },
  { title: (l) => `Heatwave Frequency and Preterm Birth Rates in ${l}`, question: (l) => `Do heatwaves correlate with preterm birth rates in ${l}?`, datasets: ["NOAA", "CDC WONDER"], tags: ["Climate", "Health"], summary: "Multi-day heat events in third trimester associate with 12% increase in preterm delivery." },
  { title: (l) => `EV Adoption and Roadside NO₂ in ${l}`, question: (l) => `Has EV adoption measurably reduced roadside NO₂ in ${l}?`, datasets: ["DMV Registrations", "EPA AQS", "ZenPower Solar"], tags: ["Energy", "Climate"], summary: "Census tracts with >20% EV share show 11% lower morning-peak NO₂ vs 2018 baseline." },
  { title: (l) => `Drought Severity and Mental Health ER Visits in ${l}`, question: (l) => `Does drought severity correlate with mental health ER visits in ${l}?`, datasets: ["USDM Drought Monitor", "HCUP ER Data"], tags: ["Climate", "Health"], summary: "Sustained D3+ drought conditions track a 9% rise in anxiety-related ER admissions." },
  { title: (l) => `Algal Bloom Toxins and Hepatic Enzyme Markers in ${l}`, question: (l) => `Do harmful algal bloom toxins elevate hepatic enzymes in ${l}?`, datasets: ["NOAA HAB", "Scripps CalCOFI", "NHANES"], tags: ["Climate", "Health"], summary: "Microcystin exposure events correlate with transient ALT elevation in adjacent populations." },
  { title: (l) => `Renewable Job Growth and Local PM2.5 in ${l}`, question: (l) => `Does renewable energy job growth correlate with falling PM2.5 in ${l}?`, datasets: ["BLS QCEW", "EPA AQS", "ZenPower Solar"], tags: ["Energy", "Economics", "Climate"], summary: "Counties with >5% renewables-sector job growth show steady annual PM2.5 declines." },
  { title: (l) => `TP53 Variants and Radon Exposure in ${l}`, question: (l) => `Do TP53 variants stratify radon-related cancer risk in ${l}?`, datasets: ["GWAS Catalog", "EPA Radon Maps", "SEER"], tags: ["Genomics", "Health"], summary: "TP53 variant carriers in high-radon zones show elevated lung adenocarcinoma incidence." },
  { title: (l) => `Carbon Pricing and Small Business Energy Costs in ${l}`, question: (l) => `How has carbon pricing affected small business energy costs in ${l}?`, datasets: ["EIA-861", "BLS CES", "ZenPower Solar"], tags: ["Economics", "Energy"], summary: "Modest cost pass-through (~3%) offset by efficiency upgrades within 18 months." },
  { title: (l) => `Air Pollution and Telomere Length in ${l}`, question: (l) => `Does chronic air pollution shorten telomeres in ${l} cohorts?`, datasets: ["EPA AQS", "UK Biobank", "GWAS Catalog"], tags: ["Genomics", "Climate", "Health"], summary: "Each 5 µg/m³ PM2.5 increment associates with measurable telomere shortening over 10 years." },
  { title: (l) => `Coastal Flooding and Mold-Related Asthma in ${l}`, question: (l) => `Do coastal flood events drive mold-related asthma spikes in ${l}?`, datasets: ["NOAA", "EPA Indoor Air", "HCUP ER Data"], tags: ["Climate", "Health"], summary: "Post-flood Aspergillus indoor counts correlate with 22% asthma ER spike at 2-week lag." },
  { title: (l) => `Solar Permitting Speed and Adoption Equity in ${l}`, question: (l) => `Does solar permitting speed shape adoption equity in ${l}?`, datasets: ["ZenPower Solar", "Census ACS"], tags: ["Energy", "Economics"], summary: "Counties with <14-day permitting see 2.6× faster adoption in lower-income tracts." },
  { title: (l) => `Pesticide Drift and ADHD Prevalence Near Farms in ${l}`, question: (l) => `Does pesticide drift correlate with ADHD prevalence near farms in ${l}?`, datasets: ["USDA PUR", "School Health Records"], tags: ["Health"], summary: "Children within 1.5km of organophosphate application show elevated ADHD diagnosis rates." },
  { title: (l) => `Lithium in Drinking Water and Bipolar Diagnosis Rates in ${l}`, question: (l) => `Does lithium in drinking water correlate with bipolar diagnosis rates in ${l}?`, datasets: ["USGS Water Quality", "CDC WONDER"], tags: ["Health"], summary: "Counties with naturally elevated lithium levels show modestly lower bipolar I incidence." },
  { title: (l) => `Wind Turbine Density and Bat Mortality in ${l}`, question: (l) => `How does wind turbine density affect local bat mortality in ${l}?`, datasets: ["USGS Wildlife", "AWEA Project Database"], tags: ["Energy", "Climate"], summary: "Mortality scales sub-linearly with turbine count above ~50 units per county." },
  { title: (l) => `Light Pollution and Melatonin-Linked Cancer Markers in ${l}`, question: (l) => `Does light pollution correlate with melatonin-linked cancer markers in ${l}?`, datasets: ["VIIRS Nightlights", "GWAS Catalog", "SEER"], tags: ["Genomics", "Health"], summary: "High nighttime radiance tracks elevated breast cancer incidence after BMI adjustment." },
  { title: (l) => `Cooling Center Access and Heat Mortality in ${l}`, question: (l) => `Does cooling center access reduce heat mortality in ${l}?`, datasets: ["NOAA", "Local Health Dept"], tags: ["Climate", "Health"], summary: "Census tracts within 1km of cooling centers show 18% lower heat-related mortality." },
  { title: (l) => `Greenspace Density and Pediatric Cortisol in ${l}`, question: (l) => `Does urban greenspace density lower pediatric cortisol in ${l}?`, datasets: ["NLCD Land Cover", "Pediatric Stress Cohort"], tags: ["Health", "Climate"], summary: "Greater than 30% canopy cover within 500m correlates with measurably lower cortisol." },
  { title: (l) => `Refinery Emissions and Childhood Leukemia Clusters in ${l}`, question: (l) => `Do refinery emissions correlate with childhood leukemia clusters in ${l}?`, datasets: ["EPA TRI", "SEER"], tags: ["Health"], summary: "Benzene-emitting facility proximity (<3km) associates with elevated ALL incidence." },
  { title: (l) => `PFAS Plumes and Thyroid Function in ${l}`, question: (l) => `Do PFAS contamination plumes affect thyroid function in ${l}?`, datasets: ["EPA UCMR", "NHANES"], tags: ["Health"], summary: "Communities on PFOA-contaminated water systems show TSH elevation in adults." },
  { title: (l) => `Solar + Storage Microgrids and Outage-Related Mortality in ${l}`, question: (l) => `Do solar+storage microgrids reduce outage-related mortality in ${l}?`, datasets: ["EIA-861", "ZenPower Solar", "CDC WONDER"], tags: ["Energy", "Health"], summary: "Microgrid-served census tracts show 31% lower mortality during multi-day outages." },
  { title: (l) => `Sleep Quality vs Aircraft Noise Corridors in ${l}`, question: (l) => `Does aircraft noise exposure degrade sleep quality in ${l}?`, datasets: ["FAA Noise Contours", "NHANES Sleep"], tags: ["Health"], summary: "Residents under approach paths show fragmented REM sleep on actigraphy data." },
  { title: (l) => `Wildfire Carbon Release and Regional Asthma Hospitalizations in ${l}`, question: (l) => `Do wildfire carbon releases drive asthma hospitalizations across ${l}?`, datasets: ["NIFC Fire Data", "EPA AQS", "HCUP"], tags: ["Climate", "Health"], summary: "Smoke-impacted weeks track a 2.3× spike in asthma admissions across the air basin." },
  { title: (l) => `Heat-Related Productivity Loss in Outdoor Workers in ${l}`, question: (l) => `How does heat exposure reduce outdoor worker productivity in ${l}?`, datasets: ["NOAA", "BLS CES", "OSHA Heat Reports"], tags: ["Climate", "Economics", "Health"], summary: "Each WBGT degree above 28°C reduces measured task completion by ~6%." },
  { title: (l) => `Genomic Risk Scores for Heat Stroke in ${l}`, question: (l) => `Can genomic risk scores predict heat stroke susceptibility in ${l}?`, datasets: ["GWAS Catalog", "UK Biobank"], tags: ["Genomics", "Health"], summary: "A 14-SNP polygenic score stratifies heat stroke risk independent of BMI and age." },
  { title: (l) => `Subsidy Duration and Solar Adoption Persistence in ${l}`, question: (l) => `How does subsidy duration affect long-term solar adoption in ${l}?`, datasets: ["ZenPower Solar", "DOE State Programs"], tags: ["Energy", "Economics"], summary: "Subsidies extending past year-five show diminishing per-dollar adoption gains." },
  { title: (l) => `Allergenic Pollen Phenology Shifts in ${l}`, question: (l) => `Has climate shifted allergenic pollen phenology in ${l}?`, datasets: ["NAB Pollen Counts", "NOAA"], tags: ["Climate", "Health"], summary: "Birch and ragweed seasons have lengthened by 11 and 18 days respectively since 2000." },
  { title: (l) => `Indoor CO₂ and Cognitive Test Scores in ${l} Schools`, question: (l) => `Does classroom CO₂ reduce cognitive test scores in ${l}?`, datasets: ["School HVAC Audit", "Standardized Tests"], tags: ["Health"], summary: "Sustained CO₂ above 1,200 ppm correlates with measurable performance dips on math sections." },
];

const LOCATIONS = [
  "San Diego County", "the Los Angeles Basin", "Houston, TX", "the Bay Area",
  "Phoenix, AZ", "Miami-Dade", "Seattle, WA", "Chicago, IL", "Denver, CO",
  "the Atlanta Metro", "New Orleans, LA", "Boston, MA", "Portland, OR",
  "Salt Lake City", "the Hudson Valley", "the Texas Gulf Coast",
  "the Central Valley", "Long Island", "the Twin Cities", "the Carolinas",
];

const RESEARCHER_POOL = [
  "R. Aoki", "P. Singh", "C. Mendoza", "Y. Nakamura", "F. Hassan",
  "E. Lindgren", "K. Mwangi", "B. Goldberg", "N. Ferrari", "I. Petrov",
  "Z. Al-Sayed", "G. Lemaire", "H. Choi", "V. Krishnan", "Q. Zheng",
  "Dr. O. Adebayo", "D. Schmidt", "Dr. R. Mehta", "U. Tanaka", "X. Ramos",
  "A. Volkov", "Dr. S. Hartmann", "M. Larsen", "K. Iwasaki", "E. Castaneda",
  "N. Olamide", "C. Whitfield", "P. Aragon", "T. Bezruk", "L. Marchetti",
];

const CONFIDENCE_DIST: Confidence[] = [
  "HIGH", "HIGH", "HIGH",
  "MODERATE", "MODERATE", "MODERATE", "MODERATE",
  "EXPLORATORY", "EXPLORATORY",
];

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function generateExtraStudies(count: number): Omit<CommunityStudy, "id" | "posted_at">[] {
  const rand = seededRandom(20240417);
  const out: Omit<CommunityStudy, "id" | "posted_at">[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = TOPIC_TEMPLATES[Math.floor(rand() * TOPIC_TEMPLATES.length)];
    const loc = LOCATIONS[Math.floor(rand() * LOCATIONS.length)];
    const researcherName = RESEARCHER_POOL[Math.floor(rand() * RESEARCHER_POOL.length)];
    const conf = CONFIDENCE_DIST[Math.floor(rand() * CONFIDENCE_DIST.length)];
    out.push({
      title: tpl.title(loc),
      question: tpl.question(loc),
      confidence: conf,
      datasets: tpl.datasets,
      tags: tpl.tags,
      researcher: { name: researcherName, initials: initials(researcherName) },
      summary: tpl.summary,
    });
  }
  return out;
}

// ---- Public API: studies --------------------------------------------------
export function getStudies(): CommunityStudy[] {
  return read<CommunityStudy[]>(STUDIES_KEY, []);
}

function setStudies(s: CommunityStudy[]) {
  write(STUDIES_KEY, s);
  recomputeStats();
}

export function getStudy(id: string): CommunityStudy | null {
  return getStudies().find((s) => s.id === id) ?? null;
}

export function getStarsMap(): Record<string, number> {
  return read<Record<string, number>>(STARS_KEY, {});
}

export function getForksMap(): Record<string, number> {
  return read<Record<string, number>>(FORKS_KEY, {});
}

export function getStarCount(id: string): number {
  return getStarsMap()[id] ?? 0;
}

export function getForkCount(id: string): number {
  return getForksMap()[id] ?? 0;
}

export function getSavedIds(): string[] {
  return read<string[]>(PROFILE_SAVED_KEY, []);
}

export function isStarred(id: string): boolean {
  return getSavedIds().includes(id);
}

export function toggleStar(id: string): { starred: boolean; count: number } {
  const saved = new Set(getSavedIds());
  const stars = getStarsMap();
  let starred: boolean;
  if (saved.has(id)) {
    saved.delete(id);
    stars[id] = Math.max(0, (stars[id] ?? 0) - 1);
    starred = false;
  } else {
    saved.add(id);
    stars[id] = (stars[id] ?? 0) + 1;
    starred = true;
  }
  write(PROFILE_SAVED_KEY, Array.from(saved));
  write(STARS_KEY, stars);
  const study = getStudy(id);
  if (study) bumpResearcherStars(study.researcher.name, starred ? 1 : -1);
  return { starred, count: stars[id] };
}

export function bumpFork(id: string): number {
  const forks = getForksMap();
  forks[id] = (forks[id] ?? 0) + 1;
  write(FORKS_KEY, forks);
  return forks[id];
}

// ---- Researchers ----------------------------------------------------------
export function getResearchers(): Researcher[] {
  return read<Researcher[]>(RESEARCHERS_KEY, []);
}

function setResearchers(rs: Researcher[]) {
  write(RESEARCHERS_KEY, rs);
}

function ensureResearcher(name: string) {
  const rs = getResearchers();
  if (!rs.find((r) => r.name === name)) {
    rs.push({
      name,
      initials: initials(name),
      joined_at: new Date().toISOString(),
      studies: 0,
      total_stars: 0,
    });
    setResearchers(rs);
  }
}

function bumpResearcherStars(name: string, delta: number) {
  const rs = getResearchers();
  const idx = rs.findIndex((r) => r.name === name);
  if (idx < 0) return;
  rs[idx] = { ...rs[idx], total_stars: Math.max(0, rs[idx].total_stars + delta) };
  setResearchers(rs);
}

function recomputeResearchers() {
  const studies = getStudies();
  const stars = getStarsMap();
  const map = new Map<string, Researcher>();
  for (const r of getResearchers()) map.set(r.name, { ...r, studies: 0, total_stars: 0 });
  for (const s of studies) {
    const existing = map.get(s.researcher.name) ?? {
      name: s.researcher.name,
      initials: s.researcher.initials,
      joined_at: s.posted_at,
      studies: 0,
      total_stars: 0,
    };
    existing.studies += 1;
    existing.total_stars += stars[s.id] ?? 0;
    map.set(s.researcher.name, existing);
  }
  setResearchers(Array.from(map.values()));
}

// ---- Stats ----------------------------------------------------------------
export type CommunityStats = {
  total_studies: number;
  total_researchers: number;
  studies_this_week: number;
};

export function getStats(): CommunityStats {
  return read<CommunityStats>(STATS_KEY, {
    total_studies: 0,
    total_researchers: 0,
    studies_this_week: 0,
  });
}

function recomputeStats() {
  const studies = getStudies();
  const weekAgo = Date.now() - 7 * 86_400_000;
  const stats: CommunityStats = {
    total_studies: studies.length,
    total_researchers: new Set(studies.map((s) => s.researcher.name)).size,
    studies_this_week: studies.filter((s) => new Date(s.posted_at).getTime() >= weekAgo).length,
  };
  write(STATS_KEY, stats);
}

// ---- Publish --------------------------------------------------------------
export type PublishInput = {
  title: string;
  question: string;
  tags: CommunityTag[];
  researcherName: string;
  result: AnalyzeResponse;
  forkedFrom?: { id: string; title: string; researcher: string } | null;
};

export function publishStudy(input: PublishInput): CommunityStudy {
  ensureResearcher(input.researcherName);

  // Use real backend response shape
  const datasets = input.result.datasets_used ?? [];
  const summary  = input.result.summary ?? "";
  const confidence = (input.result.stats?.confidence as Confidence) ?? "EXPLORATORY";

  const study: CommunityStudy = {
    id: uuid(),
    title: input.title,
    question: input.question,
    confidence,
    datasets: datasets.length ? datasets : ["EPA AQS"],
    tags: input.tags.length ? input.tags : ["Health"],
    researcher: { name: input.researcherName, initials: initials(input.researcherName) },
    posted_at: new Date().toISOString(),
    result: input.result,
    summary,
    forked_from: input.forkedFrom ?? null,
  };
  const all = getStudies();
  setStudies([study, ...all]);
  recomputeResearchers();
  return study;
}

// ---- Seeding --------------------------------------------------------------
const TOTAL_SEED = 75;

function buildSeed(): CommunityStudy[] {
  const out: CommunityStudy[] = [];
  NAMED_STUDIES.forEach((s, i) => {
    out.push({ ...s, id: uuid(), posted_at: daysAgo(2 + i * 3) });
  });
  const extras = generateExtraStudies(TOTAL_SEED - NAMED_STUDIES.length);
  const rand = seededRandom(987654321);
  extras.forEach((s) => {
    out.push({ ...s, id: uuid(), posted_at: daysAgo(Math.floor(rand() * 60) + 1) });
  });
  return out;
}

function buildSeedStars(studies: CommunityStudy[]): Record<string, number> {
  const named: Record<string, number> = {};
  const namedCounts = [47, 38, 29, 21, 34, 12];
  studies.slice(0, NAMED_STUDIES.length).forEach((s, i) => {
    named[s.id] = namedCounts[i];
  });
  const rand = seededRandom(424242);
  studies.slice(NAMED_STUDIES.length).forEach((s) => {
    const r = rand();
    named[s.id] = r < 0.7 ? Math.floor(r * 25) : Math.floor(30 + rand() * 30);
  });
  return named;
}

function buildSeedForks(studies: CommunityStudy[]): Record<string, number> {
  const out: Record<string, number> = {};
  const rand = seededRandom(7777);
  studies.forEach((s) => {
    out[s.id] = rand() < 0.3 ? Math.floor(rand() * 6) : 0;
  });
  return out;
}

export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const studies = buildSeed();
  const stars   = buildSeedStars(studies);
  const forks   = buildSeedForks(studies);
  write(STUDIES_KEY, studies);
  write(STARS_KEY, stars);
  write(FORKS_KEY, forks);
  const map = new Map<string, Researcher>();
  studies.forEach((s) => {
    const r = map.get(s.researcher.name) ?? {
      name: s.researcher.name,
      initials: s.researcher.initials,
      joined_at: s.posted_at,
      studies: 0,
      total_stars: 0,
    };
    r.studies += 1;
    r.total_stars += stars[s.id] ?? 0;
    map.set(s.researcher.name, r);
  });
  write(RESEARCHERS_KEY, Array.from(map.values()));
  recomputeStats();
  localStorage.setItem(SEED_FLAG, "1");
}

// ---- Profile --------------------------------------------------------------
export function getProfileName(): string {
  if (typeof window === "undefined") return "You";
  return localStorage.getItem(PROFILE_NAME_KEY) || "You";
}

export function setProfileName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_NAME_KEY, name);
}

export function getPublishedMap(): Record<string, string> {
  return read<Record<string, string>>(PROFILE_PUBLISHED_KEY, {});
}

export function setPublishedMap(m: Record<string, string>) {
  write(PROFILE_PUBLISHED_KEY, m);
}

export function markHistoryPublished(historyId: string, studyId: string) {
  const m = getPublishedMap();
  m[historyId] = studyId;
  setPublishedMap(m);
}

export function unmarkHistoryPublished(historyId: string) {
  const m = getPublishedMap();
  const studyId = m[historyId];
  if (!studyId) return;
  delete m[historyId];
  setPublishedMap(m);
  const remaining = getStudies().filter((s) => s.id !== studyId);
  setStudies(remaining);
  const stars = getStarsMap();
  delete stars[studyId];
  write(STARS_KEY, stars);
  recomputeResearchers();
}

// ---- Hot datasets / similar -----------------------------------------------
export function getHotDatasets(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of getStudies()) {
    for (const d of s.datasets) map.set(d, (map.get(d) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getSimilarStudies(target: CommunityStudy, limit = 3): CommunityStudy[] {
  const targetDatasets = new Set(target.datasets);
  const targetTags     = new Set(target.tags);
  return getStudies()
    .filter((s) => s.id !== target.id)
    .map((s) => {
      const dOverlap = s.datasets.filter((d) => targetDatasets.has(d)).length;
      const tOverlap = s.tags.filter((t) => targetTags.has(t)).length;
      return { s, score: dOverlap * 2 + tOverlap };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}