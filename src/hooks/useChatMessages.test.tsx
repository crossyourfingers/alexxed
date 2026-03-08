import { renderHook, waitFor } from '@testing-library/react';
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
