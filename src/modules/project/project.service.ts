// src/modules/project/project.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectEntity,
  InputSource,
  ProjectStatus,
} from './entities/project.entity';
import { RoomEntity } from './entities/room.entity';
import { MaterialEntity } from './entities/material.entity';
import { ProjectMaterialEntity } from './entities/project-material.entity';
import { CalculationLogEntity } from './entities/calculation-log.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { CalculationService } from '../calculation/calculation.service';
import { CalculationResult } from '../calculation/types/calculation.types';

export interface CalculateProjectResponse {
  projectId: string;
  result: CalculationResult;
}

export interface ProjectDetailResponse {
  projectId: string;
  name: string;
  inputSource: InputSource;
  status: ProjectStatus;
  createdAt: Date;
  result: CalculationResult;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,

    @InjectRepository(MaterialEntity)
    private readonly materialRepo: Repository<MaterialEntity>,

    @InjectRepository(ProjectMaterialEntity)
    private readonly projectMaterialRepo: Repository<ProjectMaterialEntity>,

    @InjectRepository(CalculationLogEntity)
    private readonly calcLogRepo: Repository<CalculationLogEntity>,

    private readonly calculationService: CalculationService,
  ) {}

  async calculate(dto: CreateProjectDto): Promise<CalculateProjectResponse> {
    // 1. Save Project entity (status: 'pending')
    const project = this.projectRepo.create({
      name: dto.name ?? 'Untitled Project',
      inputSource: dto.inputSource,
      status: ProjectStatus.PENDING,
      totalPrice: 0,
    });
    await this.projectRepo.save(project);

    // 2. Save Room entities
    const savedRooms = await Promise.all(
      dto.rooms.map((roomDto, index) => {
        const room = this.roomRepo.create({
          projectId: project.id,
          roomNumber: index + 1,
          name: roomDto.name,
          width: roomDto.width,
          height: roomDto.height,
          sqft: 0,
          roomTotal: 0,
        });
        return this.roomRepo.save(room);
      }),
    );

    // 3. Upsert Material entities and save ProjectMaterials
    const savedProjectMaterials = await Promise.all(
      dto.materials.map(async (matDto) => {
        // Upsert material by name
        let material = await this.materialRepo.findOne({
          where: { name: matDto.name },
        });

        if (!material) {
          material = this.materialRepo.create({
            name: matDto.name,
            unit: matDto.unit,
            unitPrice: matDto.unitPrice,
            qtyPerSqft: matDto.qtyPerSqft,
          });
          await this.materialRepo.save(material);
        } else {
          // Update with latest values
          material.unit = matDto.unit;
          material.unitPrice = matDto.unitPrice;
          material.qtyPerSqft = matDto.qtyPerSqft;
          await this.materialRepo.save(material);
        }

        const projectMaterial = this.projectMaterialRepo.create({
          projectId: project.id,
          materialId: material.id,
          totalQuantity: 0,
          totalCost: 0,
        });
        await this.projectMaterialRepo.save(projectMaterial);

        return { projectMaterial, material };
      }),
    );

    // 4. Run calculation engine
    const result = this.calculationService.calculate(dto.rooms, dto.materials);

    // 5. Update Room entities with sqft + roomTotal
    await Promise.all(
      savedRooms.map((room, index) => {
        const roomResult = result.rooms[index];
        room.sqft = roomResult.sqft;
        room.roomTotal = roomResult.roomTotal;
        return this.roomRepo.save(room);
      }),
    );

    // 6. Update ProjectMaterial entities with totalQuantity + totalCost
    await Promise.all(
      savedProjectMaterials.map(({ projectMaterial }, index) => {
        const matResult = result.materials[index];
        projectMaterial.totalQuantity = matResult.totalQuantity;
        projectMaterial.totalCost = matResult.totalCost;
        return this.projectMaterialRepo.save(projectMaterial);
      }),
    );

    // 7. Update Project entity
    project.totalPrice = result.totalPrice;
    project.status = ProjectStatus.CALCULATED;
    await this.projectRepo.save(project);

    // 8. Determine version number (count existing logs + 1)
    const logCount = await this.calcLogRepo.count({
      where: { projectId: project.id },
    });

    // 9. Save CalculationLog
    const log = this.calcLogRepo.create({
      projectId: project.id,
      version: logCount + 1,
      formulaTrace: result.formulaSteps,
      totalPrice: result.totalPrice,
    });
    await this.calcLogRepo.save(log);

    return { projectId: project.id, result };
  }

  async getById(projectId: string): Promise<ProjectDetailResponse> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['rooms'],
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found.`);
    }

    // Fetch latest calculation log
    const latestLog = await this.calcLogRepo.findOne({
      where: { projectId },
      order: { version: 'DESC' },
    });

    // Fetch project materials with material relation
    const projectMaterials = await this.projectMaterialRepo.find({
      where: { projectId },
      relations: ['material'],
    });

    const rooms = project.rooms.map((room) => ({
      name: room.name,
      width: Number(room.width),
      height: Number(room.height),
      sqft: Number(room.sqft),
      roomTotal: Number(room.roomTotal),
    }));

    const materials = projectMaterials.map((pm) => ({
      name: pm.material.name,
      unit: pm.material.unit,
      unitPrice: Number(pm.material.unitPrice),
      qtyPerSqft: Number(pm.material.qtyPerSqft),
      totalQuantity: Number(pm.totalQuantity),
      totalCost: Number(pm.totalCost),
    }));

    const result: CalculationResult = {
      rooms,
      materials,
      formulaSteps: latestLog ? latestLog.formulaTrace : [],
      totalPrice: Number(project.totalPrice),
    };

    return {
      projectId: project.id,
      name: project.name,
      inputSource: project.inputSource,
      status: project.status,
      createdAt: project.createdAt,
      result,
    };
  }
}
