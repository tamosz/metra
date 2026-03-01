import { describe, it, expect, beforeAll } from 'vitest';
import XLSX from 'xlsx';
import {
  loadWorkbook,
  getCellValue,
  getCellFormula,
  getSheetNames,
  readSheet,
} from './extract.js';

let workbook: XLSX.WorkBook;

beforeAll(() => {
  workbook = loadWorkbook();
});

describe('loadWorkbook', () => {
  it('loads the source spreadsheet', () => {
    expect(workbook).toBeDefined();
    expect(workbook.SheetNames.length).toBeGreaterThan(0);
  });
});

describe('getSheetNames', () => {
  it('returns all 9 sheet names', () => {
    const names = getSheetNames(workbook);
    expect(names).toHaveLength(9);
    expect(names).toContain('range calculator');
    expect(names).toContain('dmg');
    expect(names).toContain('maple warrior');
    expect(names).toContain('Weapons');
    expect(names).toContain('Attack Speed');
  });
});

describe('getCellValue', () => {
  it('reads maple warrior B2 = 1 (MW level 0 multiplier)', () => {
    expect(getCellValue(workbook, 'maple warrior', 'B2')).toBe(1);
  });

  it('reads maple warrior B22 = 1.10 (MW level 20 multiplier)', () => {
    expect(getCellValue(workbook, 'maple warrior', 'B22')).toBe(1.1);
  });


  it('reads Weapons E12 = 4.0 (1H Sword slash multiplier)', () => {
    expect(getCellValue(workbook, 'Weapons', 'E12')).toBe(4);
  });

  it('reads Weapons E13 = 4.6 (2H Sword slash multiplier)', () => {
    expect(getCellValue(workbook, 'Weapons', 'E13')).toBe(4.6);
  });

  it('reads Attack Speed E3 = 0.63 (Brandish at speed 2)', () => {
    expect(getCellValue(workbook, 'Attack Speed', 'E3')).toBe(0.63);
  });

  it('reads damage cap B1 = 199999', () => {
    expect(getCellValue(workbook, 'dmg', 'B1')).toBe(199999);
  });

  it('throws on missing sheet', () => {
    expect(() => getCellValue(workbook, 'nonexistent', 'A1')).toThrow(
      'Sheet "nonexistent" not found'
    );
  });

  it('returns null for empty cell', () => {
    expect(getCellValue(workbook, 'maple warrior', 'Z99')).toBeNull();
  });
});

describe('getCellFormula', () => {
  it('reads the mastery formula from range calculator D7', () => {
    const formula = getCellFormula(workbook, 'range calculator', 'D7');
    expect(formula).toContain('SWITCH');
    expect(formula).toContain('DrK');
  });

  it('returns null for cells without formulas', () => {
    expect(getCellFormula(workbook, 'maple warrior', 'B2')).toBeNull();
  });
});

describe('readSheet', () => {
  it('reads the maple warrior sheet', () => {
    const data = readSheet(workbook, 'maple warrior');
    expect(data['A1'].value).toBe('Lv');
    expect(data['B1'].value).toBe('Multiplier');
    expect(data['B22'].value).toBe(1.1);
  });
});
