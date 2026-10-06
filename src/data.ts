import type { Movement, StockPack, WarehouseSnapshot } from "./types";

export const seedPacks: StockPack[] = [
  { idPack: "P-26-001", idSurovina: "S-001", name: "MagChel Magnesium bisglycinát", lot: "23", expiry: "01/28", box: "B-23", position: "2RL", weightG: 12500, status: "nový" },
  { idPack: "P-26-002", idSurovina: "S-002", name: "Ashwagandha extrakt", lot: "45", expiry: "06/27", box: "B-23", position: "2RL", weightG: 8400, status: "otevřený" },
  { idPack: "P-26-003", idSurovina: "S-003", name: "Rhodiola extrakt", lot: "75", expiry: "10/27", box: "B-24", position: "1RP", weightG: 6200, status: "nový" },
  { idPack: "P-26-004", idSurovina: "S-004", name: "Lion's Mane extrakt", lot: "42/26", expiry: "01/28", box: "B-24", position: "1RP", weightG: 5300, status: "otevřený" },
  { idPack: "P-26-005", idSurovina: "S-005", name: "Maitake extrakt", lot: "14", expiry: "03/27", box: "B-25", position: "4RL", weightG: 4100, status: "nový" },
  { idPack: "P-26-006", idSurovina: "S-006", name: "Chaga extrakt", lot: "14C", expiry: "12/26", box: "B-25", position: "Pal 4", weightG: 11700, status: "nový" }
];

export const seedMovements: Movement[] = [
  { id: "M-001", idPack: "P-26-001", timestamp: "2026-10-06T08:14:00", deltaG: 12500, type: "Příjem", note: "Naskladnění šarže 23" },
  { id: "M-002", idPack: "P-26-002", timestamp: "2026-10-06T09:05:00", deltaG: -600, type: "Výdej", note: "Výdej do výroby" },
  { id: "M-003", idPack: "P-26-004", timestamp: "2026-10-06T09:42:00", deltaG: 0, type: "Přesun", note: "Přesun v rámci skladu", fromPosition: "Pal 4", toPosition: "1RP" }
];

export const initialSnapshot: WarehouseSnapshot = { packs: seedPacks, movements: seedMovements };
