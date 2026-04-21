# Watson & Crick 🧬

> **Science was always a conversation. But now you're in it.**

🏆 **1st Place — ML & AI Tooling Challenge, DataHacks 2026** (Best Use of Marimo/Sphinx)
Built in 36 hours at UC San Diego by Kiruthika Marikumaran & Mallika Dasgupta.

---

## What is Watson & Crick?

Watson & Crick is an AI-powered environmental health research engine. You ask a plain-English question — *Does PM2.5 pollution affect Alzheimer's risk? What does wildfire smoke do to my lungs?* — and two AI scientists argue about your data in real time, run real statistics, and hand you a peer-review-grade research report in about 30 seconds.

**Watson** runs the analysis optimistically. **Crick** questions every assumption. Together they produce:

- A **causal graph** showing the pathway from environmental exposure → candidate genes → health outcome (built in D3.js with force-directed layout, edge weights derived from real correlation strength)
- **Three ranked hypotheses** with biological mechanisms
- A **structured 8-section research report**
- A **confidence score** with a full breakdown of every factor and weight
- Audio playback, PDF export, and a **community feed** where anyone can publish and fork research

---

## Features

- 🔬 **Research Engine** — Pearson correlations, Random Forest models, Isolation Forest anomaly detection, real p-values
- 🌡️ **Live UCSD Campus Safety Dashboard** — fuses real Scripps AWN sensor data with EPA PM2.5 and NWS heat index; SAFE/CAUTION/ALERT system with K-Means zone clustering and Random Forest temperature forecasting
- 📓 **Marimo Interactive Notebook** — exposes the exact statistical engine with live reactive sliders so anyone can reproduce or challenge a result in real time
- 🗺️ **San Diego Health Map** — solar permit density vs. respiratory health outcomes across neighborhoods
- 💬 **Ask the Scientists** — follow-up chatbot powered by Gemini 2.5 Flash

---

## Datasets

| Dataset | Source |
|---|---|
| Air quality sensors | EPA AQS |
| Climate records | NOAA |
| Disease prevalence | CDC PLACES |
| Genetic variants | EMBL-EBI GWAS Catalog |
| Live campus sensors | Scripps Institution AWN @ UCSD |

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, TanStack Router, D3.js, jsPDF

**Backend:** Python, FastAPI

**ML:** scikit-learn (Random Forest, Ridge Regression, Isolation Forest, K-Means), SciPy

**AI:** Gemini 2.5 Flash API, Claude

**Notebook:** Marimo

**Infra:** Vercel, Lovable

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/kirustar14/EcoCausal.git
cd EcoCausal

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

You'll need a Gemini API key set as `GEMINI_API_KEY` in your environment.

---

## Built at DataHacks 2026

DataHacks is the annual 36-hour MLH-certified hackathon hosted by the Data Science Student Society (DS3) at UC San Diego.
