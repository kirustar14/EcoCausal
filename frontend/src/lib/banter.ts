// Hardcoded scientist banter for the loading screen.
// Watson = green bubble (left), Crick = blue bubble (right).
// Banter is matched by question topic; falls back to GENERIC.

export type Speaker = "watson" | "crick";
export type BanterLine = { speaker: Speaker; text: string };

const ALZ: BanterLine[] = [
  { speaker: "watson", text: "Right, the agent's pulling EPA PM2.5 data for San Diego. Sit down, this'll take a sec." },
  { speaker: "crick", text: "PM2.5 again? Honestly Watson, my brain feels foggier just talking about it." },
  { speaker: "watson", text: "That might just be your brain, Crick." },
  { speaker: "crick", text: "Rude. — Oh look, APOE-ε4 lit up. Classic Alzheimer's troublemaker." },
  { speaker: "watson", text: "Pulling neuroinflammation pathways now. The agent's wiring up a causal graph." },
  { speaker: "crick", text: "If pollutants → inflammation → neurodegeneration is the answer, I expect a Nobel. Or at least a coffee." },
  { speaker: "watson", text: "We get coffee either way. Findings are landing — packaging the report." },
];

const HEAT: BanterLine[] = [
  { speaker: "watson", text: "Hot one today. Agent's pulling NOAA heat index archives." },
  { speaker: "crick", text: "Heat → cardiovascular risk. My personal hypothesis: I get cranky too." },
  { speaker: "watson", text: "Not a peer-reviewed mechanism, Crick." },
  { speaker: "crick", text: "It will be when I finish the manuscript. — Ooh, RAAS pathway just spiked." },
  { speaker: "watson", text: "ACE variants are mediating the effect. Vasodilation suppressed within 48h of heatwave onset." },
  { speaker: "crick", text: "So basically: don't be an ACE D/D carrier in Phoenix in July. Got it." },
  { speaker: "watson", text: "Agent's done. Building the graph and the report — try to look composed." },
];

const ASTHMA: BanterLine[] = [
  { speaker: "watson", text: "Air quality query. Agent's grabbing ozone + PM2.5 for the San Diego air basin." },
  { speaker: "crick", text: "Bet it's the I-5 corridor again. It always is." },
  { speaker: "watson", text: "Don't predict the result before the analysis runs, Crick." },
  { speaker: "crick", text: "I'm not predicting, I'm... priming the hypothesis." },
  { speaker: "watson", text: "IL13 and ORMDL3 are showing up — Th2 inflammation pathway is hot." },
  { speaker: "crick", text: "Pediatric ER visits track ozone exceedance days. Yep, it's the corridor." },
  { speaker: "watson", text: "Fine, you were right. Wrapping the report — graph incoming." },
];

const GENERIC: BanterLine[] = [
  { speaker: "watson", text: "Okay Crick, the research agent is on it. Parsing the question first." },
  { speaker: "crick", text: "Define 'on it'. Is it actually thinking or just very confidently guessing?" },
  { speaker: "watson", text: "It's pulling real data — EPA, NOAA, GWAS Catalog. Calm down." },
  { speaker: "crick", text: "I'm calm! I'm the picture of calm. — Oh, candidate genes are stacking up." },
  { speaker: "watson", text: "Building the causal chain: exposure → genes → pathway → outcome." },
  { speaker: "crick", text: "If the p-value is greater than 0.05 I'm rerunning the whole thing out of spite." },
  { speaker: "watson", text: "Agent's done. Compiling the report and graph now — eyes on the screen." },
];

export function getBanter(question: string): BanterLine[] {
  const s = question.toLowerCase();
  if (s.includes("alzheimer") || s.includes("pm2.5") || s.includes("brain") || s.includes("cognit")) return ALZ;
  if (s.includes("heat") || s.includes("cardio") || s.includes("heart")) return HEAT;
  if (s.includes("asthma") || s.includes("air quality") || s.includes("ozone")) return ASTHMA;
  return GENERIC;
}
