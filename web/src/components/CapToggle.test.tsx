import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CapToggle } from './CapToggle.js';

describe('CapToggle', () => {
  afterEach(cleanup);

  it('calls onToggle with false when clicking while enabled', () => {
    const onToggle = vi.fn();
    render(<CapToggle enabled={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Cap'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('calls onToggle with true when clicking while disabled', () => {
    const onToggle = vi.fn();
    render(<CapToggle enabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Cap'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
