// src/modules/project/dto/material.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MaterialDto {
  @ApiProperty({
    description: 'The name of the material',
    example: 'Interior Paint',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The unit of measurement for the material',
    example: 'gallon',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    description: 'The price per unit of the material in USD',
    example: 45.0,
  })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({
    description: 'The quantity of material needed per square foot',
    example: 0.1,
  })
  @IsNumber()
  @IsPositive()
  qtyPerSqft: number;
}
