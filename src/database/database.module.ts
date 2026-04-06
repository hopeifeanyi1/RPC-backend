// src/database/database.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectEntity } from '../modules/project/entities/project.entity';
import { RoomEntity } from '../modules/project/entities/room.entity';
import { MaterialEntity } from '../modules/project/entities/material.entity';
import { ProjectMaterialEntity } from '../modules/project/entities/project-material.entity';
import { CalculationLogEntity } from '../modules/project/entities/calculation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            extra: {
              max: 10,
            },
            entities: [
              ProjectEntity,
              RoomEntity,
              MaterialEntity,
              ProjectMaterialEntity,
              CalculationLogEntity,
            ],
            synchronize: true,
            logging: false,
          };
        }
        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
          ssl: { rejectUnauthorized: false },
          extra: {
            max: 10,
          },
          entities: [
            ProjectEntity,
            RoomEntity,
            MaterialEntity,
            ProjectMaterialEntity,
            CalculationLogEntity,
          ],
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
