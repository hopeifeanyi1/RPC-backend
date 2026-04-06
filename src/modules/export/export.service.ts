// src/modules/export/export.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Browser } from 'puppeteer-core';
import { ProjectEntity } from '../project/entities/project.entity';
import { RoomEntity } from '../project/entities/room.entity';
import { ProjectMaterialEntity } from '../project/entities/project-material.entity';
import { CalculationLogEntity } from '../project/entities/calculation-log.entity';
import { FormulaStep } from '../calculation/types/calculation.types';
import type puppeteerType from 'puppeteer';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(RoomEntity)
    private readonly roomRepo: Repository<RoomEntity>,

    @InjectRepository(ProjectMaterialEntity)
    private readonly projectMaterialRepo: Repository<ProjectMaterialEntity>,

    @InjectRepository(CalculationLogEntity)
    private readonly calcLogRepo: Repository<CalculationLogEntity>,
  ) {}

  async generatePdf(projectId: string): Promise<Buffer> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found.`);
    }

    const rooms = await this.roomRepo.find({ where: { projectId } });
    const projectMaterials = await this.projectMaterialRepo.find({
      where: { projectId },
      relations: ['material'],
    });
    const latestLog = await this.calcLogRepo.findOne({
      where: { projectId },
      order: { version: 'DESC' },
    });

    const formulaSteps: FormulaStep[] = latestLog?.formulaTrace ?? [];
    const html = this.buildHtml(project, rooms, projectMaterials, formulaSteps);

    return this.renderPdf(html);
  }

  private async renderPdf(html: string): Promise<Buffer> {
    this.logger.log('Launching Puppeteer browser...');

    const isProduction = process.env.NODE_ENV === 'production';
    let browser: Browser | null = null;

    try {
      if (isProduction) {
        const chromium = await import('@sparticuz/chromium');
        const puppeteerCore = await import('puppeteer-core');

        this.logger.log('Using @sparticuz/chromium for production environment');

        const executablePath = await chromium.executablePath();
        this.logger.log(`Executable path: ${executablePath}`);

        browser = await puppeteerCore.default.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process',
            '--disable-dev-tools',
          ],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath: executablePath,
          headless: chromium.headless,
        });
      } else {
        const puppeteer = (await import('puppeteer')) as unknown as {
          default: typeof puppeteerType;
        };
        this.logger.log('Using puppeteer for development environment');

        browser = (await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })) as unknown as Browser;
      }

      if (!browser) {
        throw new Error('Failed to launch browser');
      }

      const page = await browser.newPage();

      this.logger.log('Setting HTML content...');
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      this.logger.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
      });

      this.logger.log('PDF generated successfully');
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('PDF generation error:');
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
      throw new Error('PDF generation failed: Unknown error');
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.logger.log('Browser closed');
        } catch (closeError) {
          this.logger.error('Error closing browser:', closeError);
        }
      }
    }
  }

  private buildHtml(
    project: ProjectEntity,
    rooms: RoomEntity[],
    projectMaterials: ProjectMaterialEntity[],
    formulaSteps: FormulaStep[],
  ): string {
    const formattedDate = new Date(project.createdAt).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' },
    );

    const roomRows = rooms
      .map(
        (room) => `
        <tr>
          <td>${this.esc(room.name)}</td>
          <td>${Number(room.width).toFixed(2)} ft</td>
          <td>${Number(room.height).toFixed(2)} ft</td>
          <td>${Number(room.sqft).toFixed(2)} sqft</td>
          <td>$${Number(room.roomTotal).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const materialRows = projectMaterials
      .map(
        (pm) => `
        <tr>
          <td>${this.esc(pm.material.name)}</td>
          <td>${this.esc(pm.material.unit)}</td>
          <td>$${Number(pm.material.unitPrice).toFixed(2)}</td>
          <td>${Number(pm.material.qtyPerSqft).toFixed(4)}</td>
          <td>$${Number(pm.totalCost).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const formulaRows = formulaSteps
      .map(
        (step) => `
        <tr>
          <td>${this.esc(step.label)}</td>
          <td>${this.esc(step.expression)}</td>
          <td>${step.result} ${this.esc(step.unit)}</td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 0; }
    h1 { font-size: 28px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 28px; }
    h2 { font-size: 16px; font-weight: 600; color: #1e3a5f; margin: 24px 0 8px; border-bottom: 2px solid #e0e7ef; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
    th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e8edf3; }
    tr:nth-child(even) td { background: #f5f8fc; }
    .grand-total { margin-top: 32px; background: #1e3a5f; color: #fff; padding: 20px 28px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .grand-total .label { font-size: 18px; font-weight: 600; }
    .grand-total .value { font-size: 36px; font-weight: 800; }
    .header-bar { background: #1e3a5f; color: white; padding: 28px; margin-bottom: 28px; }
    .header-bar h1 { color: white; }
    .header-bar .meta { color: #a8c4e0; }
    .content { padding: 0 28px 28px; }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>Renovation Pricing Report</h1>
    <div class="meta">
      Project ID: ${this.esc(project.id)}&nbsp;&nbsp;|&nbsp;&nbsp;
      Generated: ${formattedDate}&nbsp;&nbsp;|&nbsp;&nbsp;
      Source: ${this.esc(project.inputSource)}
    </div>
  </div>
  <div class="content">
    <h2>Rooms</h2>
    <table>
      <thead><tr><th>Room Name</th><th>Width</th><th>Height</th><th>Sq Ft</th><th>Room Total</th></tr></thead>
      <tbody>${roomRows}</tbody>
    </table>

    <h2>Materials</h2>
    <table>
      <thead><tr><th>Material</th><th>Unit</th><th>Unit Price</th><th>Qty/SqFt</th><th>Total Cost</th></tr></thead>
      <tbody>${materialRows}</tbody>
    </table>

    <h2>Formula Breakdown</h2>
    <table>
      <thead><tr><th>Step</th><th>Expression</th><th>Result</th></tr></thead>
      <tbody>${formulaRows}</tbody>
    </table>

    <div class="grand-total">
      <span class="label">Grand Total</span>
      <span class="value">$${Number(project.totalPrice).toFixed(2)}</span>
    </div>
  </div>
</body>
</html>`;
  }

  private esc(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
