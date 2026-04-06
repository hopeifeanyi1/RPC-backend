// src/modules/project/entities/material.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProjectMaterialEntity } from './project-material.entity';

@Entity('materials')
export class MaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  qtyPerSqft: number;

  @OneToMany(() => ProjectMaterialEntity, (pm) => pm.material)
  projectMaterials: ProjectMaterialEntity[];
}
