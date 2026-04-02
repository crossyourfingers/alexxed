import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock spacetimedb/react to avoid requiring a real SpacetimeDBProvider in unit tests
vi.mock('spacetimedb/react', () => ({
  useTable: () => [[], true],
}));

import { useChatMessages } from './useChatMessages';
import { useChannelByName } from './useChannelByName';

describe('useChatMessages hook', () => {
  it('should return formatted messages', async () => {
    const { result } = renderHook(() => useChatMessages({}));
    
    await waitFor(() => {
      expect(result.current.prettyMessages).toBeDefined();
    });
  });
});
