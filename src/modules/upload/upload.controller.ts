// src/modules/upload/upload.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService, ParsedProjectData } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only Excel files (.xlsx, .xls) are accepted.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file with "Rooms" and "Materials" sheets',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel (.xlsx) file containing Rooms and Materials sheets',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Parse an Excel file and return structured room/material data',
    description:
      'Accepts a .xlsx file with two sheets: "Rooms" (Room Name, Width (ft), Height (ft)) and "Materials" (Material Name, Unit, Unit Price, Qty Per SqFt). Returns parsed data without saving to the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parsed rooms and materials from the Excel file',
    schema: {
      type: 'object',
      properties: {
        rooms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Living Room' },
              width: { type: 'number', example: 14 },
              height: { type: 'number', example: 12 },
            },
          },
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Interior Paint' },
              unit: { type: 'string', example: 'gallon' },
              unitPrice: { type: 'number', example: 45 },
              qtyPerSqft: { type: 'number', example: 0.1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Excel format or missing required columns/sheets',
  })
  async parseExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ParsedProjectData> {
    return this.uploadService.parseExcel(file.buffer);
  }
}
