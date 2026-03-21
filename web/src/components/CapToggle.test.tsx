import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { CapToggle } from './CapToggle.js';
import { SimulationFiltersProvider } from '../context/SimulationFiltersContext.js';

function renderWithContext() {
  return render(
    <SimulationFiltersProvider>
      <CapToggle />
    </SimulationFiltersProvider>
  );
}

describe('CapToggle', () => {
  afterEach(cleanup);

  it('toggles cap off on click (starts enabled)', () => {
    renderWithContext();
    const capButton = screen.getByRole('button', { name: 'Cap' });
    // Initially ON (emerald style)
    expect(capButton.className).toContain('emerald');
    act(() => { fireEvent.click(capButton); });
    // Now OFF
    expect(capButton.className).not.toContain('emerald');
  });

  it('toggles cap back on when clicked again', () => {
    renderWithContext();
    const capButton = screen.getByRole('button', { name: 'Cap' });
    act(() => { fireEvent.click(capButton); });
    expect(capButton.className).not.toContain('emerald');
    act(() => { fireEvent.click(capButton); });
    expect(capButton.className).toContain('emerald');
  });
});
