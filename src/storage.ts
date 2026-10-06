import type { WarehouseSnapshot } from "./types";
import { initialSnapshot } from "./data";

const STORAGE_KEY = "urban-stock:wms:v1";

export function loadSnapshot(): WarehouseSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialSnapshot);
    return JSON.parse(raw) as WarehouseSnapshot;
  } catch {
    return structuredClone(initialSnapshot);
  }
}

export function saveSnapshot(snapshot: WarehouseSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function resetSnapshot() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(initialSnapshot);
}
