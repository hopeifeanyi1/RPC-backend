// src/modules/project/project.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectEntity } from './entities/project.entity';
import { RoomEntity } from './entities/room.entity';
import { MaterialEntity } from './entities/material.entity';
import { ProjectMaterialEntity } from './entities/project-material.entity';
import { CalculationLogEntity } from './entities/calculation-log.entity';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      RoomEntity,
      MaterialEntity,
      ProjectMaterialEntity,
      CalculationLogEntity,
    ]),
    CalculationModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [TypeOrmModule],
})
export class ProjectModule {}
