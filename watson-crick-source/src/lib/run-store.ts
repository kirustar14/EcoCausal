// Tiny session-scoped store to pass question + analyze result between routes
// without needing global state libraries. Cleared per browser tab.

import type { AnalyzeResponse } from "@/lib/mock-analyze";

const QUESTION_KEY = "wc:question";
const RESULT_KEY = "wc:result";

export function setQuestion(q: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(QUESTION_KEY, q);
}

export function getQuestion(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(QUESTION_KEY);
}

export function setResult(r: AnalyzeResponse) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(r));
}

export function getResult(): AnalyzeResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AnalyzeResponse; } catch { return null; }
}

export function clearRun() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(QUESTION_KEY);
  sessionStorage.removeItem(RESULT_KEY);
}
