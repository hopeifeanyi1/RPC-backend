// src/modules/calculation/calculation.service.ts

import { Injectable } from '@nestjs/common';
import {
  CalculationResult,
  FormulaStep,
  MaterialInput,
  MaterialResult,
  RoomInput,
  RoomResult,
} from './types/calculation.types';

@Injectable()
export class CalculationService {
  calculate(rooms: RoomInput[], materials: MaterialInput[]): CalculationResult {
    const formulaSteps: FormulaStep[] = [];

    // Step 1: Calculate sqft for each room
    const roomResults: RoomResult[] = rooms.map((room) => {
      const sqft = parseFloat((room.width * room.height).toFixed(4));
      formulaSteps.push({
        label: `${room.name} sqft`,
        expression: `${room.width} × ${room.height}`,
        result: sqft,
        unit: 'sqft',
      });
      return {
        name: room.name,
        width: room.width,
        height: room.height,
        sqft,
        roomTotal: 0, // will be computed below
      };
    });

    // Step 2 & 3: For each material, compute per-room contributions and totals
    const materialResults: MaterialResult[] = materials.map((material) => {
      let materialTotalQuantity = 0;
      let materialTotalCost = 0;

      roomResults.forEach((room) => {
        const qty = parseFloat((room.sqft * material.qtyPerSqft).toFixed(4));
        formulaSteps.push({
          label: `${material.name} quantity (${room.name})`,
          expression: `${room.sqft} sqft × ${material.qtyPerSqft} ${material.unit}/sqft`,
          result: qty,
          unit: material.unit,
        });

        const cost = parseFloat((qty * material.unitPrice).toFixed(2));
        formulaSteps.push({
          label: `${material.name} cost (${room.name})`,
          expression: `${qty} ${material.unit} × $${material.unitPrice}/${material.unit}`,
          result: cost,
          unit: '$',
        });

        materialTotalQuantity = parseFloat(
          (materialTotalQuantity + qty).toFixed(4),
        );
        materialTotalCost = parseFloat((materialTotalCost + cost).toFixed(2));

        // Accumulate into roomTotal
        room.roomTotal = parseFloat((room.roomTotal + cost).toFixed(2));
      });

      formulaSteps.push({
        label: `${material.name} total cost (all rooms)`,
        expression: `$${materialTotalCost} (all rooms combined)`,
        result: materialTotalCost,
        unit: '$',
      });

      return {
        name: material.name,
        unit: material.unit,
        unitPrice: material.unitPrice,
        qtyPerSqft: material.qtyPerSqft,
        totalQuantity: materialTotalQuantity,
        totalCost: materialTotalCost,
      };
    });

    // Step 4: Grand total
    const totalPrice = parseFloat(
      materialResults.reduce((acc, m) => acc + m.totalCost, 0).toFixed(2),
    );

    formulaSteps.push({
      label: 'Grand total',
      expression: `$${totalPrice}`,
      result: totalPrice,
      unit: '$',
    });

    return {
      rooms: roomResults,
      materials: materialResults,
      formulaSteps,
      totalPrice,
    };
  }
}
