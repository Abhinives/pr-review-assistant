import { ReviewResult } from "./api";

// Simple in-memory store for demo purposes
let lastResult: ReviewResult | null = null;

export function setLastResult(r: ReviewResult) {
  lastResult = r;
}

export function getLastResult(): ReviewResult | null {
  return lastResult;
}
