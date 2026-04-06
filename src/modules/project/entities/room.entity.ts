// src/modules/project/entities/room.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, (project) => project.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column({ type: 'int' })
  roomNumber: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  width: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  height: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sqft: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  roomTotal: number;
}
