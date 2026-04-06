// src/modules/project/entities/project.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RoomEntity } from './room.entity';
import { CalculationLogEntity } from './calculation-log.entity';
import { ProjectMaterialEntity } from './project-material.entity';

export enum InputSource {
  EXCEL = 'excel',
  MANUAL = 'manual',
  HYBRID = 'hybrid',
}

export enum ProjectStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
}

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true, default: 'Untitled Project' })
  name: string;

  @Column({ type: 'enum', enum: InputSource })
  inputSource: InputSource;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PENDING })
  status: ProjectStatus;

  @OneToMany(() => RoomEntity, (room) => room.project, { cascade: true })
  rooms: RoomEntity[];

  @OneToMany(() => ProjectMaterialEntity, (pm) => pm.project, { cascade: true })
  projectMaterials: ProjectMaterialEntity[];

  @OneToMany(() => CalculationLogEntity, (log) => log.project, {
    cascade: true,
  })
  calculationLogs: CalculationLogEntity[];
}
