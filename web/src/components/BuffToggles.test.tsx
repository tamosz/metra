import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BuffToggles } from './BuffToggles.js';

describe('BuffToggles', () => {
  afterEach(cleanup);

  it('renders all five buff buttons', () => {
    render(<BuffToggles overrides={{}} onChange={() => {}} />);
    expect(screen.getByText('SE')).toBeTruthy();
    expect(screen.getByText('Echo')).toBeTruthy();
    expect(screen.getByText('SI')).toBeTruthy();
    expect(screen.getByText('MW')).toBeTruthy();
    expect(screen.getByText('Pot')).toBeTruthy();
  });

  it('calls onChange with off-value when disabling a buff', () => {
    const onChange = vi.fn();
    render(<BuffToggles overrides={{}} onChange={onChange} />);
    fireEvent.click(screen.getByText('SE'));
    expect(onChange).toHaveBeenCalledWith({ sharpEyes: false });
  });

  it('calls onChange removing override when re-enabling a buff', () => {
    const onChange = vi.fn();
    render(<BuffToggles overrides={{ sharpEyes: false }} onChange={onChange} />);
    fireEvent.click(screen.getByText('SE'));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('calls onChange with 0 when disabling MW', () => {
    const onChange = vi.fn();
    render(<BuffToggles overrides={{}} onChange={onChange} />);
    fireEvent.click(screen.getByText('MW'));
    expect(onChange).toHaveBeenCalledWith({ mwLevel: 0 });
  });

  it('calls onChange with 0 when disabling Pot', () => {
    const onChange = vi.fn();
    render(<BuffToggles overrides={{}} onChange={onChange} />);
    fireEvent.click(screen.getByText('Pot'));
    expect(onChange).toHaveBeenCalledWith({ attackPotion: 0 });
  });
});
