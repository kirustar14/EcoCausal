import requests, json, os
from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("EPA_EMAIL")
KEY = os.getenv("EPA_KEY")
NOAA_TOKEN = os.getenv("NOAA_TOKEN")

os.makedirs("backend/data", exist_ok=True)

# ── 1. EPA PM2.5 San Diego ──
print("Fetching EPA PM2.5...")
r = requests.get("https://aqs.epa.gov/data/api/dailyData/byCounty", params={
    "email": EMAIL, "key": KEY,
    "param": "88101",
    "bdate": "20230101", "edate": "20231231",
    "state": "06", "county": "073"
})
data = r.json()
with open("backend/data/epa_pm25.json", "w") as f:
    json.dump(data, f)
print(f"EPA done — {len(data.get('Data', []))} rows")

# ── 2. CDC Disease Prevalence ──
print("Fetching CDC...")
diseases = {
    "asthma": "CASTHMA",
    "cardiovascular": "CVDCRHD4",
    "cognitive": "COGNITION"
}
results = {}
for name, measure in diseases.items():
    r = requests.get(
        "https://chronicdata.cdc.gov/resource/swc5-untb.json",
        params={"stateabbr": "CA", "measureid": measure, "$limit": 500}
    )
    results[name] = r.json()
    print(f"  {name} done — {len(r.json())} rows")
with open("backend/data/cdc_disease.json", "w") as f:
    json.dump(results, f)
print("CDC done")

# ── 3. GWAS ──
print("Fetching GWAS...")
traits = {
    "alzheimer": "Alzheimer's disease",
    "asthma": "asthma",
    "cardiovascular": "coronary artery disease",
    "cognitive": "cognitive decline"
}
gwas_results = {}
for key, trait in traits.items():
    r = requests.get(
        "https://www.ebi.ac.uk/gwas/rest/api/studies/search/findByDiseaseTrait",
        params={"diseaseTrait": trait, "size": 10}
    )
    gwas_results[key] = r.json()
    count = len(gwas_results[key].get("_embedded", {}).get("studies", []))
    print(f"  {trait} — {count} studies")
with open("backend/data/gwas.json", "w") as f:
    json.dump(gwas_results, f)
print("GWAS done")

# ── 4. NOAA Climate San Diego ──
print("Fetching NOAA...")
if NOAA_TOKEN:
    r = requests.get(
        "https://www.ncdc.noaa.gov/cdo-web/api/v2/data",
        headers={"token": NOAA_TOKEN},
        params={
            "datasetid": "GHCND",
            "locationid": "FIPS:06073",
            "startdate": "2023-01-01",
            "enddate": "2023-12-31",
            "datatypeid": "TMAX,TMIN,PRCP",
            "limit": 1000,
            "units": "metric"
        }
    )
    with open("backend/data/noaa_climate.json", "w") as f:
        json.dump(r.json(), f)
    print(f"NOAA done — {len(r.json().get('results', []))} rows")
else:
    print("⚠️  NOAA_TOKEN not set — skipping. Get token at ncdc.noaa.gov/cdo-web/token")

# ── 5. Scripps Heat Map ──
print("Checking Scripps heat map...")
if os.path.exists("backend/data/scripps_heat.csv"):
    print("Scripps CSV found ✓")
else:
    print("⚠️  Scripps CSV missing — download from DataHacks portal → backend/data/scripps_heat.csv")

print("\n✅ All done!")