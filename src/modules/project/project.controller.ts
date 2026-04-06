// src/modules/project/project.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  ProjectService,
  CalculateProjectResponse,
  ProjectDetailResponse,
} from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('project')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit rooms and materials to calculate renovation cost',
    description:
      'Creates a new project, runs the formula engine across all rooms and materials, persists the results, and returns the full calculation breakdown including per-room totals, per-material totals, and a step-by-step formula trace.',
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description:
      'Calculation completed successfully. Returns project ID and full result.',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
        result: {
          type: 'object',
          properties: {
            rooms: {
              type: 'array',
              description: 'Rooms with sqft and roomTotal computed',
            },
            materials: {
              type: 'array',
              description: 'Materials with totalQuantity and totalCost',
            },
            formulaSteps: {
              type: 'array',
              description: 'Step-by-step formula trace',
            },
            totalPrice: { type: 'number', example: 2340.5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — check rooms/materials arrays',
  })
  async calculate(
    @Body() dto: CreateProjectDto,
  ): Promise<CalculateProjectResponse> {
    return this.projectService.calculate(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a saved project with its full calculation result',
    description:
      'Fetches the project, its rooms, materials, and the latest calculation log. Reconstructs and returns the full CalculationResult shape, including formula steps from the stored JSONB trace.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project found and result returned',
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Master Bathroom Remodel' },
        inputSource: { type: 'string', enum: ['excel', 'manual', 'hybrid'] },
        status: { type: 'string', enum: ['pending', 'calculated'] },
        createdAt: { type: 'string', format: 'date-time' },
        result: { type: 'object', description: 'Full CalculationResult' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getById(@Param('id') id: string): Promise<ProjectDetailResponse> {
    return this.projectService.getById(id);
  }
}
