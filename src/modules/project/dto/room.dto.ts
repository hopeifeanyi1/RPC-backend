// src/modules/project/dto/room.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Living Room',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The width of the room in feet',
    example: 14,
  })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({
    description: 'The height (length) of the room in feet',
    example: 12,
  })
  @IsNumber()
  @IsPositive()
  height: number;
}
