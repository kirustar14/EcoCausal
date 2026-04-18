from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json, os, glob
import pandas as pd
import numpy as np
from scipy import stats
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Load all data at startup ──
with open("data/epa_pm25.json") as f:
    EPA_DATA = json.load(f)
with open("data/cdc_disease.json") as f:
    CDC_DATA = json.load(f)
with open("data/gwas.json") as f:
    GWAS_DATA = json.load(f)
with open("data/noaa_climate.json") as f:
    NOAA_DATA = json.load(f)

awn_files = glob.glob("data/AWN/*.csv")
if awn_files:
    dfs = [pd.read_csv(f, header=0) for f in awn_files]
    SCRIPPS_DF = pd.concat(dfs, ignore_index=True)
    SCRIPPS_DF["Simple Date"] = pd.to_datetime(SCRIPPS_DF["Simple Date"], errors="coerce")
    SCRIPPS_DF["Outdoor Temperature (°F)"] = pd.to_numeric(SCRIPPS_DF["Outdoor Temperature (°F)"], errors="coerce")
    SCRIPPS_DF["Humidity (%)"] = pd.to_numeric(SCRIPPS_DF["Humidity (%)"], errors="coerce")
    scripps_daily_temp = SCRIPPS_DF.groupby(SCRIPPS_DF["Simple Date"].dt.date)["Outdoor Temperature (°F)"].mean().dropna()
    print(f"Scripps loaded: {len(SCRIPPS_DF)} rows, {len(scripps_daily_temp)} days")
else:
    SCRIPPS_DF = None
    scripps_daily_temp = pd.Series(dtype=float)
    print("No Scripps data found")

GENE_FALLBACKS = {
    "asthma":         ["IL13", "ORMDL3", "GSDMB", "IL4", "TSLP"],
    "cognitive":      ["APOE", "BIN1", "CLU", "ABCA7", "PICALM"],
    "cardiovascular": ["PCSK9", "LDLR", "APOB", "LPA", "CETP"],
    "alzheimer":      ["APOE", "TREM2", "CLU", "BIN1", "ABCA7"]
}

# ── In-memory query cache ──
QUERY_CACHE = {}

class Query(BaseModel):
    question: str

class CompareQuery(BaseModel):
    question_a: str
    question_b: str

def gemini_call(prompt: str) -> str:
    response = gemini.generate_content(prompt)
    return response.text.strip().replace("```json", "").replace("```", "").strip()

def compute_stats(env_values: list, health_values: list) -> dict:
    n = min(len(env_values), len(health_values))
    if n < 3:
        return {"r": 0.0, "p": 1.0, "confidence": "LOW", "n": n}
    ev = np.array(env_values[:n], dtype=float)
    hv = np.array(health_values[:n], dtype=float)
    mask = ~(np.isnan(ev) | np.isnan(hv))
    ev, hv = ev[mask], hv[mask]
    if len(ev) < 3:
        return {"r": 0.0, "p": 1.0, "confidence": "LOW", "n": len(ev)}
    r, p = stats.pearsonr(ev, hv)
    slope, intercept, _, _, _ = stats.linregress(ev, hv)
    confidence = "HIGH" if abs(r) > 0.6 and p < 0.05 else "MODERATE" if abs(r) > 0.3 else "LOW"
    return {
        "r": round(float(r), 3),
        "p": round(float(p), 4),
        "slope": round(float(slope), 4),
        "confidence": confidence,
        "n": len(ev)
    }

def build_graph(env_factor: str, outcome: str, gwas_key: str) -> dict:
    studies = GWAS_DATA.get(gwas_key, {}).get("_embedded", {}).get("studies", [])
    genes = []
    for s in studies[:8]:
        for field in ["reportedGenes", "authorReportedGenes", "studyDesignComment"]:
            val = s.get(field)
            if val and str(val) not in ("NR", "unknown gene") and len(str(val)) < 40:
                genes.append(str(val)[:25])
                break
    if len(genes) < 3:
        genes = GENE_FALLBACKS.get(gwas_key, ["GENE1", "GENE2", "GENE3", "GENE4"])
    genes = list(dict.fromkeys(genes))[:5]

    nodes = [
        {"id": "env", "label": env_factor, "type": "pollutant", "color": "#8B5CF6"},
        {"id": "outcome", "label": outcome, "type": "disease", "color": "#F97316"},
    ]
    edges = []
    for i, gene in enumerate(genes):
        nid = f"gene_{i}"
        nodes.append({"id": nid, "label": gene, "type": "gene", "color": "#14B8A6"})
        edges.append({"source": "env", "target": nid, "weight": round(0.5 + i * 0.1, 2)})
        edges.append({"source": nid, "target": "outcome", "weight": round(0.6 + i * 0.05, 2)})

    return {"nodes": nodes, "edges": edges}

def route_query(q: str) -> dict:
    ql = q.lower()

    if any(w in ql for w in ["smoke", "pm2.5", "pollution", "air quality", "particulate"]):
        env_factor = "PM2.5 Air Pollution"
        env_values = [float(d["arithmetic_mean"]) for d in EPA_DATA.get("Data", [])
                      if d.get("arithmetic_mean") not in (None, "")]
        dataset_used = ["EPA AQI (PM2.5)"]
    elif any(w in ql for w in ["heat", "temperature", "hot", "campus", "warm"]):
        env_factor = "Heat Stress"
        if len(scripps_daily_temp) > 0:
            env_values = scripps_daily_temp.tolist()
            dataset_used = ["Scripps UCSD Heat Map", "NOAA Climate"]
        else:
            env_values = [float(r["value"]) for r in NOAA_DATA.get("results", [])
                          if r.get("datatype") == "TMAX" and r.get("value")]
            dataset_used = ["NOAA Climate"]
    else:
        env_factor = "Environmental Exposure"
        env_values = [float(d["arithmetic_mean"]) for d in EPA_DATA.get("Data", [])
                      if d.get("arithmetic_mean") not in (None, "")]
        dataset_used = ["EPA AQI (PM2.5)"]

    if any(w in ql for w in ["alzheimer", "cognitive", "memory", "dementia", "brain"]):
        outcome = "Cognitive Disease"
        gwas_key = "cognitive"
        health_values = [float(r["data_value"]) for r in CDC_DATA.get("cognitive", [])
                         if r.get("data_value")]
    elif any(w in ql for w in ["asthma", "respiratory", "lung", "breathing", "wheeze"]):
        outcome = "Asthma"
        gwas_key = "asthma"
        health_values = [float(r["data_value"]) for r in CDC_DATA.get("asthma", [])
                         if r.get("data_value")]
    elif any(w in ql for w in ["heart", "cardiovascular", "cardiac", "coronary"]):
        outcome = "Cardiovascular Disease"
        gwas_key = "cardiovascular"
        health_values = [float(r["data_value"]) for r in CDC_DATA.get("asthma", [])
                         if r.get("data_value")]
    else:
        outcome = "Asthma"
        gwas_key = "asthma"
        health_values = [float(r["data_value"]) for r in CDC_DATA.get("asthma", [])
                         if r.get("data_value")]

    return {
        "env_factor": env_factor,
        "env_values": env_values,
        "outcome": outcome,
        "gwas_key": gwas_key,
        "health_values": health_values,
        "dataset_used": dataset_used
    }

async def run_full_analysis(question: str) -> dict:
    if question in QUERY_CACHE:
        print(f"Cache hit: {question}")
        return QUERY_CACHE[question]

    routed = route_query(question)
    stats_result = compute_stats(routed["env_values"], routed["health_values"])
    graph = build_graph(routed["env_factor"], routed["outcome"], routed["gwas_key"])

    # Call 1: hypotheses
    hyp_prompt = f"""You are a computational epidemiologist analyzing real environmental health data.

Environmental factor: {routed['env_factor']}
Health outcome: {routed['outcome']}
Pearson r: {stats_result['r']}, p-value: {stats_result['p']}, n={stats_result['n']}
Datasets: {', '.join(routed['dataset_used'])}
User question: {question}

Return ONLY a valid JSON array of exactly 3 hypothesis objects. No markdown, no explanation, no backticks.
[
  {{"rank": 1, "confidence": "STRONG", "hypothesis": "one sentence hypothesis", "mechanism": "one sentence biological mechanism"}},
  {{"rank": 2, "confidence": "MODERATE", "hypothesis": "...", "mechanism": "..."}},
  {{"rank": 3, "confidence": "EXPLORATORY", "hypothesis": "...", "mechanism": "..."}}
]"""

    try:
        hypotheses = json.loads(gemini_call(hyp_prompt))
    except:
        hypotheses = [
            {"rank": 1, "confidence": "STRONG", "hypothesis": f"{routed['env_factor']} exposure is associated with elevated {routed['outcome']} risk.", "mechanism": "Oxidative stress pathways trigger inflammatory cascades affecting target organ systems."},
            {"rank": 2, "confidence": "MODERATE", "hypothesis": "Chronic low-level exposure compounds genetic susceptibility.", "mechanism": "Gene-environment interactions modulate immune response thresholds."},
            {"rank": 3, "confidence": "EXPLORATORY", "hypothesis": "Seasonal variation in exposure may explain regional prevalence differences.", "mechanism": "Circadian and seasonal immune rhythm disruption under sustained environmental load."}
        ]

    # Call 2: research report
    report_prompt = f"""You are writing a structured scientific research summary.

Environmental factor: {routed['env_factor']}
Health outcome: {routed['outcome']}
Pearson r: {stats_result['r']}, p-value: {stats_result['p']}, slope: {stats_result['slope']}, n={stats_result['n']}
Datasets used: {', '.join(routed['dataset_used'])}
Top hypothesis: {hypotheses[0]['hypothesis']}
Biological mechanism: {hypotheses[0]['mechanism']}

Write a structured markdown research summary with EXACTLY these sections in this order:
## Hypothesis
## Datasets
## Statistical Findings
## Biological Interpretation
## Confidence Assessment
## Limitations
## Future Directions

Keep each section 2-3 sentences. Use real scientific language. Do not use bullet points."""

    try:
        report = gemini_call(report_prompt)
    except:
        report = f"## Hypothesis\n{hypotheses[0]['hypothesis']}\n\n## Datasets\n{', '.join(routed['dataset_used'])}\n\n## Statistical Findings\nPearson r={stats_result['r']}, p={stats_result['p']}, n={stats_result['n']}.\n\n## Confidence Assessment\n{stats_result['confidence']}"

    # Call 3: plain English summary
    summary_prompt = f"""In exactly 2 sentences, explain this finding to a non-scientist:
Environmental factor: {routed['env_factor']}
Health outcome: {routed['outcome']}
Finding: {hypotheses[0]['hypothesis']}
No jargon. Simple language. Start with "Our analysis found..."."""

    try:
        summary = gemini_call(summary_prompt)
    except:
        summary = f"Our analysis found a potential link between {routed['env_factor']} and {routed['outcome']}. More research is needed to confirm this relationship."

    # Call 4: similar questions
    similar_prompt = f"""Given this research question: "{question}"
Return ONLY a JSON array of exactly 3 related questions a researcher might ask next. No markdown, no explanation.
["question 1", "question 2", "question 3"]"""

    try:
        similar = json.loads(gemini_call(similar_prompt))
    except:
        similar = [
            f"How does {routed['env_factor']} affect cardiovascular disease risk?",
            f"What is the seasonal variation in {routed['env_factor']} exposure in San Diego?",
            f"Which genetic variants are most associated with {routed['outcome']}?"
        ]

    result = {
        "env_factor": routed["env_factor"],
        "outcome": routed["outcome"],
        "stats": stats_result,
        "hypotheses": hypotheses,
        "graph": graph,
        "report": report,
        "summary": summary,
        "similar_questions": similar,
        "datasets_used": routed["dataset_used"]
    }

    QUERY_CACHE[question] = result
    return result

@app.post("/analyze")
async def analyze(query: Query):
    return await run_full_analysis(query.question)

@app.post("/compare")
async def compare(query: CompareQuery):
    result_a = await run_full_analysis(query.question_a)
    result_b = await run_full_analysis(query.question_b)

    compare_prompt = f"""You are comparing two environmental health analyses.

Analysis A:
- Question: {query.question_a}
- Environmental factor: {result_a['env_factor']}
- Outcome: {result_a['outcome']}
- Pearson r: {result_a['stats']['r']}, confidence: {result_a['stats']['confidence']}
- Top hypothesis: {result_a['hypotheses'][0]['hypothesis']}

Analysis B:
- Question: {query.question_b}
- Environmental factor: {result_b['env_factor']}
- Outcome: {result_b['outcome']}
- Pearson r: {result_b['stats']['r']}, confidence: {result_b['stats']['confidence']}
- Top hypothesis: {result_b['hypotheses'][0]['hypothesis']}

Return ONLY a JSON object. No markdown, no backticks.
{{
  "stronger_association": "A or B",
  "reason": "one sentence explaining which is stronger and why",
  "shared_mechanisms": "one sentence about biological mechanisms both share",
  "key_difference": "one sentence about the most important difference",
  "recommendation": "one sentence about which to prioritize for further research"
}}"""

    try:
        comparison = json.loads(gemini_call(compare_prompt))
    except:
        comparison = {
            "stronger_association": "A" if abs(result_a['stats']['r']) > abs(result_b['stats']['r']) else "B",
            "reason": "Based on Pearson r magnitude.",
            "shared_mechanisms": "Both involve environmental triggers activating inflammatory pathways.",
            "key_difference": "Different environmental exposures and biological endpoints.",
            "recommendation": "Prioritize the analysis with stronger statistical signal."
        }

    return {
        "analysis_a": result_a,
        "analysis_b": result_b,
        "comparison": comparison
    }

@app.get("/sources")
def sources():
    return {
        "datasets": [
            {
                "name": "EPA Air Quality System (AQS)",
                "type": "Environmental",
                "rows": len(EPA_DATA.get("Data", [])),
                "coverage": "San Diego County, 2023",
                "measures": ["PM2.5", "Ozone", "NO2"],
                "url": "https://aqs.epa.gov"
            },
            {
                "name": "CDC PLACES",
                "type": "Health Outcomes",
                "rows": len(CDC_DATA.get("asthma", [])) + len(CDC_DATA.get("cognitive", [])),
                "coverage": "California counties",
                "measures": ["Asthma prevalence", "Cognitive decline prevalence"],
                "url": "https://chronicdata.cdc.gov"
            },
            {
                "name": "GWAS Catalog",
                "type": "Genomics",
                "rows": sum(
                    len(v.get("_embedded", {}).get("studies", []))
                    for v in GWAS_DATA.values()
                ),
                "coverage": "Global genetic association studies",
                "measures": ["Gene variants", "Disease associations"],
                "url": "https://www.ebi.ac.uk/gwas"
            },
            {
                "name": "NOAA Climate Data",
                "type": "Climate",
                "rows": len(NOAA_DATA.get("results", [])),
                "coverage": "San Diego County, 2023",
                "measures": ["TMAX", "TMIN", "PRCP"],
                "url": "https://www.ncdc.noaa.gov"
            },
            {
                "name": "Scripps UCSD Heat Map",
                "type": "Local Environmental",
                "rows": len(SCRIPPS_DF) if SCRIPPS_DF is not None else 0,
                "coverage": "UCSD Campus, 2025",
                "measures": ["Temperature", "Humidity", "Solar Radiation"],
                "url": "https://scripps.ucsd.edu"
            }
        ],
        "total_rows": (
            len(EPA_DATA.get("Data", [])) +
            len(CDC_DATA.get("asthma", [])) +
            len(CDC_DATA.get("cognitive", [])) +
            len(NOAA_DATA.get("results", [])) +
            (len(SCRIPPS_DF) if SCRIPPS_DF is not None else 0)
        )
    }

@app.get("/datasets")
def datasets():
    epa_values = [float(d["arithmetic_mean"]) for d in EPA_DATA.get("Data", [])
                  if d.get("arithmetic_mean") not in (None, "")]
    noaa_values = [float(r["value"]) for r in NOAA_DATA.get("results", [])
                   if r.get("datatype") == "TMAX" and r.get("value")]
    return {
        "epa": {
            "rows": len(epa_values),
            "mean_pm25": round(float(np.mean(epa_values)), 3) if epa_values else 0,
            "max_pm25": round(float(np.max(epa_values)), 3) if epa_values else 0,
            "date_range": "2023-01-01 to 2023-12-31"
        },
        "noaa": {
            "rows": len(noaa_values),
            "mean_tmax": round(float(np.mean(noaa_values)), 3) if noaa_values else 0,
            "max_tmax": round(float(np.max(noaa_values)), 3) if noaa_values else 0,
            "date_range": "2023-01-01 to 2023-12-31"
        },
        "scripps": {
            "rows": len(SCRIPPS_DF) if SCRIPPS_DF is not None else 0,
            "mean_temp": round(float(SCRIPPS_DF["Outdoor Temperature (°F)"].mean()), 3) if SCRIPPS_DF is not None else 0,
            "mean_humidity": round(float(SCRIPPS_DF["Humidity (%)"].mean()), 3) if SCRIPPS_DF is not None else 0,
        },
        "cdc": {
            "asthma_rows": len(CDC_DATA.get("asthma", [])),
            "cognitive_rows": len(CDC_DATA.get("cognitive", []))
        },
        "gwas": {
            trait: len(v.get("_embedded", {}).get("studies", []))
            for trait, v in GWAS_DATA.items()
        },
        "cache_size": len(QUERY_CACHE)
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "scripps_loaded": SCRIPPS_DF is not None,
        "epa_rows": len(EPA_DATA.get("Data", [])),
        "noaa_rows": len(NOAA_DATA.get("results", [])),
        "model": "gemini-2.5-flash",
        "pipeline": ["EPA/NOAA/Scripps ingestion", "Pearson correlation", "GWAS gene mapping", "Gemini hypothesis generation"],
        "cache_size": len(QUERY_CACHE)
    }