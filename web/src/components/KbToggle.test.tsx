import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { KbToggle } from './KbToggle.js';
import { SimulationFiltersProvider } from '../context/SimulationFiltersContext.js';

function renderWithContext() {
  return render(
    <SimulationFiltersProvider>
      <KbToggle />
    </SimulationFiltersProvider>
  );
}

describe('KbToggle', () => {
  afterEach(cleanup);

  it('toggles KB on click', () => {
    renderWithContext();
    const kbButton = screen.getByText('KB');
    act(() => { fireEvent.click(kbButton); });
    // After clicking, should show interval/accuracy inputs
    expect(screen.getByDisplayValue('1.5')).toBeTruthy();
    expect(screen.getByDisplayValue('250')).toBeTruthy();
  });

  it('shows interval and accuracy inputs when enabled', () => {
    renderWithContext();
    act(() => { fireEvent.click(screen.getByText('KB')); });
    expect(screen.getByDisplayValue('1.5')).toBeTruthy();
    expect(screen.getByDisplayValue('250')).toBeTruthy();
  });

  it('hides interval and accuracy inputs when disabled', () => {
    renderWithContext();
    // KB starts disabled
    expect(screen.queryByDisplayValue('1.5')).toBeNull();
    expect(screen.queryByDisplayValue('250')).toBeNull();
  });
});
