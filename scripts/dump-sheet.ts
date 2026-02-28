import { loadWorkbook, readSheet, getSheetNames } from '../src/sheets/extract.js';

const sheetName = process.argv[2];

const workbook = loadWorkbook();

if (!sheetName) {
  console.log('Available sheets:');
  for (const name of getSheetNames(workbook)) {
    console.log(`  "${name}"`);
  }
  console.log('\nUsage: npx tsx scripts/dump-sheet.ts "sheet name"');
  process.exit(0);
}

const data = readSheet(workbook, sheetName);

const entries = Object.entries(data).sort(([a], [b]) => {
  const aMatch = a.match(/^([A-Z]+)(\d+)$/);
  const bMatch = b.match(/^([A-Z]+)(\d+)$/);
  if (!aMatch || !bMatch) return a.localeCompare(b);
  const rowDiff = parseInt(aMatch[2]) - parseInt(bMatch[2]);
  if (rowDiff !== 0) return rowDiff;
  return aMatch[1].localeCompare(bMatch[1]);
});

for (const [address, info] of entries) {
  const parts = [`${address}: ${JSON.stringify(info.value)}`];
  if (info.formula) parts.push(`  formula: ${info.formula}`);
  console.log(parts.join(''));
}
