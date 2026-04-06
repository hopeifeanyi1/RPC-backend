// src/modules/export/export.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ProjectEntity } from '../project/entities/project.entity';
import { RoomEntity } from '../project/entities/room.entity';
import { ProjectMaterialEntity } from '../project/entities/project-material.entity';
import { CalculationLogEntity } from '../project/entities/calculation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      RoomEntity,
      ProjectMaterialEntity,
      CalculationLogEntity,
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
