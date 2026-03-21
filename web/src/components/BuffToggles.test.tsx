import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { BuffToggles } from './BuffToggles.js';
import { SimulationFiltersProvider } from '../context/SimulationFiltersContext.js';

function renderWithContext() {
  return render(
    <SimulationFiltersProvider>
      <BuffToggles />
    </SimulationFiltersProvider>
  );
}

describe('BuffToggles', () => {
  afterEach(cleanup);

  it('renders all five buff buttons', () => {
    renderWithContext();
    expect(screen.getByText('SE')).toBeTruthy();
    expect(screen.getByText('Echo')).toBeTruthy();
    expect(screen.getByText('SI')).toBeTruthy();
    expect(screen.getByText('MW')).toBeTruthy();
    expect(screen.getByText('Pot')).toBeTruthy();
  });

  it('toggles buff off on click', () => {
    renderWithContext();
    const seButton = screen.getByText('SE');
    // Initially ON (green style)
    expect(seButton.className).toContain('emerald');
    act(() => { fireEvent.click(seButton); });
    // Now OFF (red style)
    expect(seButton.className).toContain('red');
  });

  it('toggles buff back on when clicked again', () => {
    renderWithContext();
    const seButton = screen.getByText('SE');
    act(() => { fireEvent.click(seButton); });
    expect(seButton.className).toContain('red');
    act(() => { fireEvent.click(seButton); });
    expect(seButton.className).toContain('emerald');
  });
});
