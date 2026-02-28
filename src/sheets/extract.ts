import XLSX from 'xlsx';
import { resolve } from 'path';

const DEFAULT_PATH = resolve(import.meta.dirname, '../../data/source-sheet.xlsx');

export interface CellInfo {
  value: string | number | boolean | null;
  formula: string | null;
  type: string;
}

export function loadWorkbook(path: string = DEFAULT_PATH): XLSX.WorkBook {
  return XLSX.readFile(path);
}

export function getCellValue(
  workbook: XLSX.WorkBook,
  sheetName: string,
  cellAddress: string
): string | number | boolean | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
  const cell = sheet[cellAddress];
  return cell ? cell.v : null;
}

export function getCellFormula(
  workbook: XLSX.WorkBook,
  sheetName: string,
  cellAddress: string
): string | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
  const cell = sheet[cellAddress];
  return cell?.f ?? null;
}

export function getCellInfo(
  workbook: XLSX.WorkBook,
  sheetName: string,
  cellAddress: string
): CellInfo {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
  const cell = sheet[cellAddress];
  return {
    value: cell?.v ?? null,
    formula: cell?.f ?? null,
    type: cell?.t ?? 'z',
  };
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}

export function readSheet(
  workbook: XLSX.WorkBook,
  sheetName: string
): Record<string, CellInfo> {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const result: Record<string, CellInfo> = {};
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const cell = sheet[key];
    result[key] = {
      value: cell?.v ?? null,
      formula: cell?.f ?? null,
      type: cell?.t ?? 'z',
    };
  }
  return result;
}
