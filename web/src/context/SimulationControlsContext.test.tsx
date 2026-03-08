import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { SimulationControlsProvider, useSimulationControls } from './SimulationControlsContext.js';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <SimulationControlsProvider>{children}</SimulationControlsProvider>;
}

function renderControls() {
  return renderHook(() => useSimulationControls(), { wrapper });
}

describe('what-if state', () => {
  afterEach(cleanup);

  it('defaults to disabled with empty changes and meta', () => {
    const { result } = renderControls();

    expect(result.current.whatIfEnabled).toBe(false);
    expect(result.current.whatIfChanges).toEqual([]);
    expect(result.current.whatIfMeta).toEqual({ name: '', author: '' });
  });

  it('enables what-if mode', () => {
    const { result } = renderControls();

    act(() => {
      result.current.setWhatIfEnabled(true);
    });

    expect(result.current.whatIfEnabled).toBe(true);
  });

  it('clears changes and meta when disabling what-if mode', () => {
    const { result } = renderControls();

    act(() => {
      result.current.setWhatIfEnabled(true);
      result.current.addWhatIfChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.setWhatIfMeta({ name: 'Test', author: 'User' });
    });

    expect(result.current.whatIfChanges).toHaveLength(1);
    expect(result.current.whatIfMeta.name).toBe('Test');

    act(() => {
      result.current.setWhatIfEnabled(false);
    });

    expect(result.current.whatIfEnabled).toBe(false);
    expect(result.current.whatIfChanges).toEqual([]);
    expect(result.current.whatIfMeta).toEqual({ name: '', author: '' });
  });

  it('adds a change', () => {
    const { result } = renderControls();

    act(() => {
      result.current.addWhatIfChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    expect(result.current.whatIfChanges).toHaveLength(1);
    expect(result.current.whatIfChanges[0].target).toBe('hero.brandish-sword');
    expect(result.current.whatIfChanges[0].to).toBe(280);
  });

  it('removes a change by index', () => {
    const { result } = renderControls();

    act(() => {
      result.current.addWhatIfChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.addWhatIfChange({
        target: 'drk.spear-crusher',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.whatIfChanges).toHaveLength(2);

    act(() => {
      result.current.removeWhatIfChange(0);
    });

    expect(result.current.whatIfChanges).toHaveLength(1);
    expect(result.current.whatIfChanges[0].target).toBe('drk.spear-crusher');
  });

  it('updates a change at a given index', () => {
    const { result } = renderControls();

    act(() => {
      result.current.addWhatIfChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    act(() => {
      result.current.updateWhatIfChange(0, {
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.whatIfChanges[0].to).toBe(300);
  });

  it('clears all changes', () => {
    const { result } = renderControls();

    act(() => {
      result.current.addWhatIfChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.addWhatIfChange({
        target: 'drk.spear-crusher',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.whatIfChanges).toHaveLength(2);

    act(() => {
      result.current.clearWhatIfChanges();
    });

    expect(result.current.whatIfChanges).toEqual([]);
  });

  it('sets what-if meta', () => {
    const { result } = renderControls();

    act(() => {
      result.current.setWhatIfMeta({ name: 'Brandish Buff', author: 'Staff' });
    });

    expect(result.current.whatIfMeta).toEqual({ name: 'Brandish Buff', author: 'Staff' });
  });

  it('setters are stable references across renders', () => {
    const { result, rerender } = renderControls();

    const first = {
      setWhatIfEnabled: result.current.setWhatIfEnabled,
      addWhatIfChange: result.current.addWhatIfChange,
      removeWhatIfChange: result.current.removeWhatIfChange,
      updateWhatIfChange: result.current.updateWhatIfChange,
      clearWhatIfChanges: result.current.clearWhatIfChanges,
      setWhatIfMeta: result.current.setWhatIfMeta,
    };

    rerender();

    expect(result.current.setWhatIfEnabled).toBe(first.setWhatIfEnabled);
    expect(result.current.addWhatIfChange).toBe(first.addWhatIfChange);
    expect(result.current.removeWhatIfChange).toBe(first.removeWhatIfChange);
    expect(result.current.updateWhatIfChange).toBe(first.updateWhatIfChange);
    expect(result.current.clearWhatIfChanges).toBe(first.clearWhatIfChanges);
    expect(result.current.setWhatIfMeta).toBe(first.setWhatIfMeta);
  });
});
