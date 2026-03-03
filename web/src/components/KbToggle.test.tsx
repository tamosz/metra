import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KbToggle } from './KbToggle.js';

describe('KbToggle', () => {
  afterEach(cleanup);

  it('toggles KB on click', () => {
    const onToggle = vi.fn();
    render(
      <KbToggle enabled={false} onToggle={onToggle}
        bossAttackInterval={1.5} onIntervalChange={() => {}}
        bossAccuracy={250} onAccuracyChange={() => {}} />
    );
    fireEvent.click(screen.getByText('KB'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows interval and accuracy inputs when enabled', () => {
    render(
      <KbToggle enabled={true} onToggle={() => {}}
        bossAttackInterval={1.5} onIntervalChange={() => {}}
        bossAccuracy={250} onAccuracyChange={() => {}} />
    );
    expect(screen.getByDisplayValue('1.5')).toBeTruthy();
    expect(screen.getByDisplayValue('250')).toBeTruthy();
  });

  it('hides interval and accuracy inputs when disabled', () => {
    render(
      <KbToggle enabled={false} onToggle={() => {}}
        bossAttackInterval={1.5} onIntervalChange={() => {}}
        bossAccuracy={250} onAccuracyChange={() => {}} />
    );
    expect(screen.queryByDisplayValue('1.5')).toBeNull();
    expect(screen.queryByDisplayValue('250')).toBeNull();
  });
});
