import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WelcomeBanner } from './WelcomeBanner.js';

const STORAGE_KEY = 'metra-welcome-dismissed';

describe('WelcomeBanner', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renders when not dismissed', () => {
    render(<WelcomeBanner />);
    expect(screen.getByTestId('welcome-banner')).toBeTruthy();
  });

  it('does not render when already dismissed', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    render(<WelcomeBanner />);
    expect(screen.queryByTestId('welcome-banner')).toBeNull();
  });

  it('dismisses on click and persists to localStorage', () => {
    render(<WelcomeBanner />);
    expect(screen.getByTestId('welcome-banner')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(screen.queryByTestId('welcome-banner')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
  });
});
