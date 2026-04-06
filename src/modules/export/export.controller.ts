// src/modules/export/export.controller.ts

import {
  Controller,
  Param,
  Post,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExportService } from './export.service';
import type { Response } from 'express';

@ApiTags('export')
@Controller('project')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post(':id/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate and download a PDF report for a project',
    description:
      'Generates a full renovation pricing PDF report using Puppeteer. The PDF includes room dimensions, material costs, a formula step trace, and a grand total. Returned as a binary file download.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID of the project to generate the PDF for',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file stream. Content-Type: application/pdf',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async generatePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.exportService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="renovation-report-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
