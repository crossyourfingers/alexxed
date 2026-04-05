import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SwipeVote from './SwipeVote';
import * as spacetimedbReact from 'spacetimedb/react';
import { makePosterDataUri } from '../data/posterData';

// Mock spacetimedb/react
vi.mock('spacetimedb/react', () => ({
  useTable: vi.fn(),
  useReducer: vi.fn(),
}));

// Mock module_bindings
vi.mock('../module_bindings', () => ({
  tables: {
    game: { name: 'game' },
    game_vote_counts: { name: 'game_vote_counts' },
  },
  reducers: {
    castVote: { name: 'castVote' },
  },
}));

// Mock posterData
vi.mock('../data/posterData', () => ({
  makePosterDataUri: vi.fn(() => 'mock-data-uri'),
}));

describe('SwipeVote', () => {
  const mockGames = [
    { id: 1n, title: 'Game 1', subtitle: 'Sub 1', coverUrl: 'url1', genre: 'Action' },
    { id: 2n, title: 'Game 2', subtitle: 'Sub 2', coverUrl: 'url2', genre: 'RPG' },
    { id: 3n, title: 'Game 3', subtitle: 'Sub 3', coverUrl: 'url3', genre: 'Indie' },
  ];

  const mockCounts = [
    { gameId: 1n, up: 10n, down: 2n },
    { gameId: 2n, up: 5n, down: 0n },
  ];

  const mockCastVote = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
    (spacetimedbReact.useTable as any).mockImplementation((table: any) => {
      if (table.name === 'game') return [mockGames, false];
      if (table.name === 'game_vote_counts') return [mockCounts, false];
      return [[], false];
    });
    (spacetimedbReact.useReducer as any).mockReturnValue(mockCastVote);
    localStorage.clear();
  });

  it('renders loading state', () => {
    (spacetimedbReact.useTable as any).mockImplementation((table: any) => {
      if (table.name === 'game') return [[], true];
      return [[], true];
    });
    render(<SwipeVote />);
    expect(screen.getByText(/Loading games.../i)).toBeInTheDocument();
  });

  it('renders games when loaded', () => {
    render(<SwipeVote />);
    expect(screen.getByText('Game 1')).toBeInTheDocument();
    expect(screen.getByText('Score: 8')).toBeInTheDocument();
  });

  it('prevents multiple votes on rapid clicks using isAnimating guard', async () => {
    vi.useFakeTimers();
    render(<SwipeVote />);
    
    const upButton = screen.getByRole('button', { name: /👍/i });
    
    // Rapidly click the up button 5 times
    await act(async () => {
      fireEvent.click(upButton);
      fireEvent.click(upButton);
      fireEvent.click(upButton);
      fireEvent.click(upButton);
      fireEvent.click(upButton);
    });

    // Should only call castVote once because of isAnimating.current
    expect(mockCastVote).toHaveBeenCalledTimes(1);
    
    // Wait for animation to finish (350ms)
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // Now it should show Game 2
    expect(screen.getByText('Game 2')).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('reproduction: verify if buttons become disabled permanently or incorrectly', async () => {
    vi.useFakeTimers();
    render(<SwipeVote />);
    
    const upButton = screen.getByRole('button', { name: /👍/i });
    
    // First vote
    await act(async () => {
      fireEvent.click(upButton);
    });
    
    expect(upButton).toBeDisabled();
    
    // Complete animation
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // After animation, Game 1 is gone, Game 2 is top.
    // Game 2 should NOT be disabled.
    const game2Title = screen.queryByText('Game 1');
    expect(game2Title).not.toBeInTheDocument();
    expect(screen.getByText('Game 2')).toBeInTheDocument();
    
    const newUpButton = screen.getByRole('button', { name: /👍/i });
    // If the bug exists, this might still be disabled or the state might be wrong
    expect(newUpButton).not.toBeDisabled();
    
    vi.useRealTimers();
  });

  it('allows button clicks on non-touch devices (desktop behavior)', async () => {
    // Simulate non-touch environment
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });

    render(<SwipeVote />);

    const upButton = screen.getByRole('button', { name: /👍/i });
    expect(upButton).not.toBeDisabled();

    // Click should still trigger vote
    await act(async () => {
      fireEvent.click(upButton);
    });

    expect(mockCastVote).toHaveBeenCalled();
  });
});
