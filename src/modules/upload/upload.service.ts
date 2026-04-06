// src/modules/upload/upload.service.ts

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { RoomDto } from '../project/dto/room.dto';
import { MaterialDto } from '../project/dto/material.dto';

export interface ParsedProjectData {
  rooms: RoomDto[];
  materials: MaterialDto[];
}

@Injectable()
export class UploadService {
  async parseExcel(buffer: Buffer): Promise<ParsedProjectData> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer.buffer as ArrayBuffer);

    const roomsSheet = workbook.getWorksheet('Rooms');
    const materialsSheet = workbook.getWorksheet('Materials');

    if (!roomsSheet) {
      throw new HttpException(
        'Excel file is missing a sheet named "Rooms". Expected Sheet 1 to be named "Rooms".',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!materialsSheet) {
      throw new HttpException(
        'Excel file is missing a sheet named "Materials". Expected Sheet 2 to be named "Materials".',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rooms = this.parseRoomsSheet(roomsSheet);
    const materials = this.parseMaterialsSheet(materialsSheet);

    return { rooms, materials };
  }

  private getCellString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((r) => r.text).join('');
    }
    if (typeof value === 'object' && 'text' in value) {
      return typeof value.text === 'string' ? value.text : '';
    }
    if (typeof value === 'object' && 'result' in value) {
      return value.result !== undefined ? String(value.result) : '';
    }
    return '';
  }

  private parseRoomsSheet(sheet: ExcelJS.Worksheet): RoomDto[] {
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(this.getCellString(cell.value).trim().toLowerCase());
    });

    const requiredColumns = ['room name', 'width (ft)', 'height (ft)'];
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        throw new HttpException(
          `Rooms sheet is missing required column: "${col}". Expected columns: Room Name | Width (ft) | Height (ft)`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const nameIdx = headers.indexOf('room name');
    const widthIdx = headers.indexOf('width (ft)');
    const heightIdx = headers.indexOf('height (ft)');

    const rooms: RoomDto[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = this.getCellString(row.getCell(nameIdx + 1).value).trim();
      const width = parseFloat(
        this.getCellString(row.getCell(widthIdx + 1).value),
      );
      const height = parseFloat(
        this.getCellString(row.getCell(heightIdx + 1).value),
      );

      if (!name || isNaN(width) || isNaN(height)) return;

      if (width <= 0) {
        throw new HttpException(
          `Room "${name}" has an invalid width: ${width}. Width must be a positive number.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (height <= 0) {
        throw new HttpException(
          `Room "${name}" has an invalid height: ${height}. Height must be a positive number.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      rooms.push({ name, width, height });
    });

    if (rooms.length === 0) {
      throw new HttpException(
        'Rooms sheet contains no valid data rows. Please add at least one room.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return rooms;
  }

  private parseMaterialsSheet(sheet: ExcelJS.Worksheet): MaterialDto[] {
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(this.getCellString(cell.value).trim().toLowerCase());
    });

    const requiredColumns = [
      'material name',
      'unit',
      'unit price',
      'qty per sqft',
    ];
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        throw new HttpException(
          `Materials sheet is missing required column: "${col}". Expected columns: Material Name | Unit | Unit Price | Qty Per SqFt`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const nameIdx = headers.indexOf('material name');
    const unitIdx = headers.indexOf('unit');
    const priceIdx = headers.indexOf('unit price');
    const qtyIdx = headers.indexOf('qty per sqft');

    const materials: MaterialDto[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = this.getCellString(row.getCell(nameIdx + 1).value).trim();
      const unit = this.getCellString(row.getCell(unitIdx + 1).value).trim();
      const unitPrice = parseFloat(
        this.getCellString(row.getCell(priceIdx + 1).value),
      );
      const qtyPerSqft = parseFloat(
        this.getCellString(row.getCell(qtyIdx + 1).value),
      );

      if (!name || !unit || isNaN(unitPrice) || isNaN(qtyPerSqft)) return;

      if (unitPrice <= 0) {
        throw new HttpException(
          `Material "${name}" has an invalid unit price: ${unitPrice}. Unit price must be a positive number.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (qtyPerSqft <= 0) {
        throw new HttpException(
          `Material "${name}" has an invalid qty per sqft: ${qtyPerSqft}. Qty per sqft must be a positive number.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      materials.push({ name, unit, unitPrice, qtyPerSqft });
    });

    if (materials.length === 0) {
      throw new HttpException(
        'Materials sheet contains no valid data rows. Please add at least one material.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return materials;
  }
}
