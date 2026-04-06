// src/modules/project/dto/create-project.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomDto } from './room.dto';
import { MaterialDto } from './material.dto';
import { InputSource } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiPropertyOptional({
    description: 'Optional name for the project',
    example: 'Master Bathroom Remodel',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Source of the input data',
    enum: InputSource,
    example: InputSource.MANUAL,
  })
  @IsEnum(InputSource)
  @IsNotEmpty()
  inputSource: InputSource;

  @ApiProperty({
    description: 'Array of rooms with their dimensions',
    type: [RoomDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoomDto)
  rooms: RoomDto[];

  @ApiProperty({
    description: 'Array of materials used in the renovation',
    type: [MaterialDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials: MaterialDto[];
}
