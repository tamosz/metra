import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SimulationFiltersProvider, useSimulationFilters } from '../context/SimulationFiltersContext.js';
import { useFilterPresets } from './useFilterPresets.js';
import { BUILTIN_PRESETS } from '../utils/filter-presets.js';

const USER_KEY = 'royals-sim:filter-presets';
const DISMISSED_KEY = 'royals-sim:filter-presets:dismissed';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SimulationFiltersProvider, null, children);
}

function renderPresets() {
  return renderHook(
    () => ({
      presets: useFilterPresets(),
      controls: useSimulationFilters(),
    }),
    { wrapper },
  );
}

describe('useFilterPresets', () => {
  beforeEach(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  });

  afterEach(cleanup);

  it('starts with 3 built-in presets and no active', () => {
    const { result } = renderPresets();
    expect(result.current.presets.presets).toHaveLength(BUILTIN_PRESETS.length);
    expect(result.current.presets.presets.every((p) => p.builtIn)).toBe(true);
    expect(result.current.presets.activePresetId).toBeNull();
  });

  it('apply sets active preset, not dirty', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.activePresetId).toBe('builtin-bossing');
    expect(result.current.presets.isDirty).toBe(false);
  });

  it('apply training sets targetCount to 15', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-training');
    });
    expect(result.current.controls.targetCount).toBe(15);
  });

  it('becomes dirty when controls change after apply', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.isDirty).toBe(false);
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    expect(result.current.presets.isDirty).toBe(true);
  });

  it('revert clears dirty state', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    expect(result.current.presets.isDirty).toBe(true);
    act(() => {
      result.current.presets.revert();
    });
    expect(result.current.presets.isDirty).toBe(false);
    expect(result.current.controls.targetCount).toBe(1);
  });

  it('save creates user preset and sets active', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    act(() => {
      result.current.presets.save('My Preset');
    });
    expect(result.current.presets.presets).toHaveLength(BUILTIN_PRESETS.length + 1);
    const userPreset = result.current.presets.presets[BUILTIN_PRESETS.length];
    expect(userPreset.name).toBe('My Preset');
    expect(userPreset.builtIn).toBe(false);
    expect(result.current.presets.activePresetId).toBe(userPreset.id);
    expect(result.current.presets.isDirty).toBe(false);
  });

  it('save persists to localStorage', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.save('Persisted');
    });
    const stored = JSON.parse(localStorage.getItem(USER_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persisted');
  });

  it('remove deletes user preset', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.save('Temp');
    });
    const id = result.current.presets.presets[BUILTIN_PRESETS.length].id;
    act(() => {
      result.current.presets.remove(id);
    });
    expect(result.current.presets.presets).toHaveLength(BUILTIN_PRESETS.length);
  });

  it('remove dismisses built-in preset', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.remove('builtin-bossing');
    });
    expect(result.current.presets.presets).toHaveLength(BUILTIN_PRESETS.length - 1);
    expect(result.current.presets.presets.find((p) => p.id === 'builtin-bossing')).toBeUndefined();
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY)!);
    expect(dismissed).toContain('builtin-bossing');
  });

  it('remove clears activePresetId if removing active', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.activePresetId).toBe('builtin-bossing');
    act(() => {
      result.current.presets.remove('builtin-bossing');
    });
    expect(result.current.presets.activePresetId).toBeNull();
  });

  it('CGS changes do not affect dirty state', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.isDirty).toBe(false);
    act(() => {
      result.current.controls.setCgsValues({ cape: 99, glove: 99, shoe: 99 });
    });
    expect(result.current.presets.isDirty).toBe(false);
  });

  it('deselect clears active preset', () => {
    const { result } = renderPresets();
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.activePresetId).toBe('builtin-bossing');
    act(() => {
      result.current.presets.deselect();
    });
    expect(result.current.presets.activePresetId).toBeNull();
  });
});
