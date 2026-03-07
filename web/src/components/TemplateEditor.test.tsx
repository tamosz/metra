import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { TemplateEditor } from './TemplateEditor.js';

vi.mock('../data/bundle.js', () => ({
  getGearBreakdown: (key: string) => {
    if (key === 'hero-high') {
      return {
        weapon: { STR: 18, WATK: 140 },
        helmet: { STR: 22, DEX: 30 },
      };
    }
    return null;
  },
}));

describe('TemplateEditor', () => {
  afterEach(cleanup);

  it('renders slot rows and stat columns from breakdown', () => {
    render(<TemplateEditor className="hero" tier="high" />);
    expect(screen.getByText('weapon')).toBeTruthy();
    expect(screen.getByText('helmet')).toBeTruthy();
    expect(screen.getByText('STR')).toBeTruthy();
    expect(screen.getByText('WATK')).toBeTruthy();
    expect(screen.getByText('DEX')).toBeTruthy();
  });

  it('shows fallback when no breakdown available', () => {
    render(<TemplateEditor className="unknown" tier="low" />);
    expect(screen.getByText('No gear breakdown available for this template.')).toBeTruthy();
  });

  it('highlights edited cell and shows original struck through', () => {
    render(<TemplateEditor className="hero" tier="high" />);
    const inputs = screen.getAllByRole('spinbutton');
    // Find the weapon STR input (value 18)
    const weaponStr = inputs.find((i) => (i as HTMLInputElement).value === '18');
    expect(weaponStr).toBeTruthy();

    act(() => { fireEvent.focus(weaponStr!); });
    act(() => { fireEvent.change(weaponStr!, { target: { value: '25' } }); });
    act(() => { fireEvent.blur(weaponStr!); });

    // Should show original value struck through
    expect(screen.getByText('18')).toBeTruthy();
    // Input should have amber styling
    expect(weaponStr!.className).toContain('amber');
  });

  it('shows Propose Changes section when edits exist', () => {
    render(<TemplateEditor className="hero" tier="high" />);
    const inputs = screen.getAllByRole('spinbutton');
    const weaponStr = inputs.find((i) => (i as HTMLInputElement).value === '18');

    act(() => { fireEvent.focus(weaponStr!); });
    act(() => { fireEvent.change(weaponStr!, { target: { value: '25' } }); });
    act(() => { fireEvent.blur(weaponStr!); });

    expect(screen.getByText('Propose Changes')).toBeTruthy();
    expect(screen.getByText(/1 change/)).toBeTruthy();
  });

  it('shows CGS note when no cape/glove/shoe slots', () => {
    render(<TemplateEditor className="hero" tier="high" />);
    expect(screen.getByText(/Cape, glove, and shoe/)).toBeTruthy();
  });
});
