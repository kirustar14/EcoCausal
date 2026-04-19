// Persistent research history stored in localStorage.
// Each entry is a completed run (question + AnalyzeResponse + timestamp).

import type { AnalyzeResponse } from "@/lib/mock-analyze";

const KEY = "wc:history:v1";
const MAX_ENTRIES = 50;

export type HistoryEntry = {
  id: string;
  question: string;
  saved_at: string; // ISO
  result: AnalyzeResponse;
};

function safeParse(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return getHistory().find((e) => e.id === id) ?? null;
}

function makeId() {
  // Cheap unique-ish id, no extra deps
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addHistoryEntry(question: string, result: AnalyzeResponse): HistoryEntry {
  const entry: HistoryEntry = {
    id: makeId(),
    question,
    saved_at: new Date().toISOString(),
    result,
  };
  if (typeof window === "undefined") return entry;

  const existing = getHistory();
  // De-dupe: if the most recent entry is the same question, replace instead of stacking.
  const filtered =
    existing.length > 0 && existing[0].question.trim() === question.trim()
      ? existing.slice(1)
      : existing;

  const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
  localStorage.setItem(KEY, JSON.stringify(next));
  return entry;
}

export function deleteHistoryEntry(id: string) {
  if (typeof window === "undefined") return;
  const next = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
