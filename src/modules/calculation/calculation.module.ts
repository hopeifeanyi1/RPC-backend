// src/modules/calculation/calculation.module.ts

import { Module } from '@nestjs/common';
import { CalculationService } from './calculation.service';

@Module({
  providers: [CalculationService],
  exports: [CalculationService],
})
export class CalculationModule {}
