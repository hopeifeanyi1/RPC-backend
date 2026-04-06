// src/modules/project/entities/calculation-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { FormulaStep } from '../../calculation/types/calculation.types';

@Entity('calculation_logs')
export class CalculationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, (project) => project.calculationLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb' })
  formulaTrace: FormulaStep[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
