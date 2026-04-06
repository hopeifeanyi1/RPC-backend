// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { UploadModule } from './modules/upload/upload.module';
import { ProjectModule } from './modules/project/project.module';
import { CalculationModule } from './modules/calculation/calculation.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    CalculationModule,
    UploadModule,
    ProjectModule,
    ExportModule,
  ],
})
export class AppModule {}
