import { describe, it, expect } from 'vitest';
import { renderAsciiChart } from './ascii-chart.js';

describe('renderAsciiChart', () => {
  it('renders bars sorted by value descending', () => {
    const result = renderAsciiChart([
      { label: 'Hero', value: 200000 },
      { label: 'Dark Knight', value: 300000 },
      { label: 'Paladin', value: 100000 },
    ]);

    const lines = result.trimEnd().split('\n');
    expect(lines).toHaveLength(3);
    // Dark Knight should be first (highest DPS)
    expect(lines[0]).toContain('Dark Knight');
    expect(lines[1]).toContain('Hero');
    expect(lines[2]).toContain('Paladin');
  });

  it('formats values with thousands separators', () => {
    const result = renderAsciiChart([
      { label: 'Test', value: 1234567 },
    ]);
    expect(result).toContain('1,234,567');
  });

  it('uses full-width bar for highest value', () => {
    const result = renderAsciiChart(
      [{ label: 'Max', value: 100 }],
      10
    );
    // Should have exactly 10 block characters
    const blockCount = (result.match(/\u2588/g) || []).length;
    expect(blockCount).toBe(10);
  });

  it('scales bars proportionally', () => {
    const result = renderAsciiChart(
      [
        { label: 'Full', value: 100 },
        { label: 'Half', value: 50 },
      ],
      10
    );

    const lines = result.trimEnd().split('\n');
    const fullBlocks = (lines[0].match(/\u2588/g) || []).length;
    const halfBlocks = (lines[1].match(/\u2588/g) || []).length;
    expect(fullBlocks).toBe(10);
    expect(halfBlocks).toBe(5);
  });

  it('returns empty string for empty input', () => {
    expect(renderAsciiChart([])).toBe('');
  });

  it('pads labels to align bars', () => {
    const result = renderAsciiChart([
      { label: 'Short', value: 100 },
      { label: 'LongerLabel', value: 50 },
    ], 10);

    const lines = result.trimEnd().split('\n');
    // Both lines should have bars starting at the same column
    const bar0Start = lines[0].indexOf('\u2588');
    const bar1Start = lines[1].indexOf('\u2588');
    expect(bar0Start).toBe(bar1Start);
  });
});
