export type StockStatus = "nový" | "otevřený";

export type MovementType = "Příjem" | "Výdej" | "Přesun";

export interface StockPack {
  idPack: string;
  idSurovina: string;
  name: string;
  lot: string;
  expiry: string;
  box: string;
  position: string;
  weightG: number;
  status: StockStatus;
}

export interface Movement {
  id: string;
  idPack: string;
  timestamp: string;
  deltaG: number;
  type: MovementType;
  note: string;
  fromPosition?: string;
  toPosition?: string;
}

export interface WarehouseSnapshot {
  packs: StockPack[];
  movements: Movement[];
}