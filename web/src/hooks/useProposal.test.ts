import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProposal } from './useProposal.js';

describe('useProposal', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useProposal());

    expect(result.current.proposal.name).toBe('');
    expect(result.current.proposal.changes).toEqual([]);
    expect(result.current.result).toBeNull();
    expect(result.current.simulating).toBe(false);
  });

  it('setName updates the proposal name', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.setName('Test');
    });

    expect(result.current.proposal.name).toBe('Test');
  });

  it('setAuthor updates the proposal author', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.setAuthor('Staff');
    });

    expect(result.current.proposal.author).toBe('Staff');
  });

  it('addChange appends a change to the proposal', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.addChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    expect(result.current.proposal.changes).toHaveLength(1);
    expect(result.current.proposal.changes[0].target).toBe('hero.brandish-sword');
    expect(result.current.proposal.changes[0].to).toBe(280);
  });

  it('removeChange removes the correct change by index', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.addChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });
    act(() => {
      result.current.addChange({
        target: 'drk.crusher',
        field: 'basePower',
        to: 300,
      });
    });
    expect(result.current.proposal.changes).toHaveLength(2);

    act(() => {
      result.current.removeChange(0);
    });

    expect(result.current.proposal.changes).toHaveLength(1);
    expect(result.current.proposal.changes[0].target).toBe('drk.crusher');
  });

  it('updateChange replaces a change at the given index', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.addChange({
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 280,
      });
    });

    act(() => {
      result.current.updateChange(0, {
        target: 'hero.brandish-sword',
        field: 'basePower',
        to: 300,
      });
    });

    expect(result.current.proposal.changes[0].to).toBe(300);
  });

  it('simulate with empty changes does not set result or simulating', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.simulate();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.simulating).toBe(false);
  });

  it('loadProposal sets the full proposal state', () => {
    const { result } = renderHook(() => useProposal());

    act(() => {
      result.current.loadProposal({
        name: 'Loaded',
        author: 'User',
        changes: [
          { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
        ],
      });
    });

    expect(result.current.proposal.name).toBe('Loaded');
    expect(result.current.proposal.author).toBe('User');
    expect(result.current.proposal.changes).toHaveLength(1);
    expect(result.current.result).toBeNull();
  });
});
