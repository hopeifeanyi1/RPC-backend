// src/modules/calculation/types/calculation.types.ts

export interface FormulaStep {
  label: string;
  expression: string;
  result: number;
  unit: string;
}

export interface RoomResult {
  name: string;
  width: number;
  height: number;
  sqft: number;
  roomTotal: number;
}

export interface MaterialResult {
  name: string;
  unit: string;
  unitPrice: number;
  qtyPerSqft: number;
  totalQuantity: number;
  totalCost: number;
}

export interface CalculationResult {
  rooms: RoomResult[];
  materials: MaterialResult[];
  formulaSteps: FormulaStep[];
  totalPrice: number;
}

export interface RoomInput {
  name: string;
  width: number;
  height: number;
}

export interface MaterialInput {
  name: string;
  unit: string;
  unitPrice: number;
  qtyPerSqft: number;
}
