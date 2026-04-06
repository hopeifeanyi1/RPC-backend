// src/modules/project/entities/project-material.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { MaterialEntity } from './material.entity';

@Entity('project_materials')
export class ProjectMaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, (project) => project.projectMaterials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'uuid' })
  materialId: string;

  @ManyToOne(() => MaterialEntity, (material) => material.projectMaterials, {
    eager: true,
  })
  @JoinColumn({ name: 'materialId' })
  material: MaterialEntity;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;
}
