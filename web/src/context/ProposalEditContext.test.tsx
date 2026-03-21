import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { ProposalEditProvider, useProposalEdit } from './ProposalEditContext.js';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <ProposalEditProvider>{children}</ProposalEditProvider>;
}

function renderEdit() {
  return renderHook(() => useProposalEdit(), { wrapper });
}

describe('edit state', () => {
  afterEach(cleanup);

  it('defaults to disabled with empty changes and meta', () => {
    const { result } = renderEdit();

    expect(result.current.editEnabled).toBe(false);
    expect(result.current.editChanges).toEqual([]);
    expect(result.current.editMeta).toEqual({ name: '', author: '' });
  });

  it('enables edit mode', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.setEditEnabled(true);
    });

    expect(result.current.editEnabled).toBe(true);
  });

  it('clears changes and meta when disabling edit mode', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.setEditEnabled(true);
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.setEditMeta({ name: 'Test', author: 'User' });
    });

    expect(result.current.editChanges).toHaveLength(1);
    expect(result.current.editMeta.name).toBe('Test');

    act(() => {
      result.current.setEditEnabled(false);
    });

    expect(result.current.editEnabled).toBe(false);
    expect(result.current.editChanges).toEqual([]);
    expect(result.current.editMeta).toEqual({ name: '', author: '' });
  });

  it('adds a change', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    expect(result.current.editChanges).toHaveLength(1);
    expect(result.current.editChanges[0].target).toBe('hero.brandish-sword');
    expect(result.current.editChanges[0].to).toBe(280);
  });

  it('removes a change by index', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.addEditChange({
        target: 'drk.spear-crusher',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.editChanges).toHaveLength(2);

    act(() => {
      result.current.removeEditChange(0);
    });

    expect(result.current.editChanges).toHaveLength(1);
    expect(result.current.editChanges[0].target).toBe('drk.spear-crusher');
  });

  it('updates a change at a given index', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    act(() => {
      result.current.updateEditChange(0, {
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.editChanges[0].to).toBe(300);
  });

  it('clears all changes', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.addEditChange({
        target: 'drk.spear-crusher',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.editChanges).toHaveLength(2);

    act(() => {
      result.current.clearEditChanges();
    });

    expect(result.current.editChanges).toEqual([]);
  });

  it('sets edit meta', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.setEditMeta({ name: 'Brandish Buff', author: 'Staff' });
    });

    expect(result.current.editMeta).toEqual({ name: 'Brandish Buff', author: 'Staff' });
  });

  it('setters are stable references across renders', () => {
    const { result, rerender } = renderEdit();

    const first = {
      setEditEnabled: result.current.setEditEnabled,
      addEditChange: result.current.addEditChange,
      removeEditChange: result.current.removeEditChange,
      updateEditChange: result.current.updateEditChange,
      clearEditChanges: result.current.clearEditChanges,
      setEditMeta: result.current.setEditMeta,
      loadEditState: result.current.loadEditState,
    };

    rerender();

    expect(result.current.setEditEnabled).toBe(first.setEditEnabled);
    expect(result.current.addEditChange).toBe(first.addEditChange);
    expect(result.current.removeEditChange).toBe(first.removeEditChange);
    expect(result.current.updateEditChange).toBe(first.updateEditChange);
    expect(result.current.clearEditChanges).toBe(first.clearEditChanges);
    expect(result.current.setEditMeta).toBe(first.setEditMeta);
    expect(result.current.loadEditState).toBe(first.loadEditState);
  });

  it('loadEditState atomically sets enabled, changes, and meta', () => {
    const { result } = renderEdit();

    const changes = [
      { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
      { target: 'drk.spear-crusher', field: 'basePower', to: 300 },
    ];

    act(() => {
      result.current.loadEditState(changes, { name: 'Batch Load', author: 'Staff' });
    });

    expect(result.current.editEnabled).toBe(true);
    expect(result.current.editChanges).toEqual(changes);
    expect(result.current.editMeta).toEqual({ name: 'Batch Load', author: 'Staff' });
  });

  it('loadEditState without meta uses empty defaults', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.loadEditState([
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
      ]);
    });

    expect(result.current.editEnabled).toBe(true);
    expect(result.current.editChanges).toHaveLength(1);
    expect(result.current.editMeta).toEqual({ name: '', author: '' });
  });

  it('resetEdit restores edit state to defaults', () => {
    const { result } = renderEdit();

    act(() => {
      result.current.setEditEnabled(true);
      result.current.addEditChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
      result.current.setEditMeta({ name: 'Test', author: 'User' });
    });

    act(() => result.current.resetEdit());

    expect(result.current.editEnabled).toBe(false);
    expect(result.current.editChanges).toEqual([]);
    expect(result.current.editMeta).toEqual({ name: '', author: '' });
  });
});
