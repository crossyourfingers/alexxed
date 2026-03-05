import { renderHook, waitFor } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';
import { useChannelByName } from './useChannelByName';
 Describe('useChatMessages hook', () =u003e {
   it('should return formatted messages', async () =u003e {
     const { result } = renderHook(() => useChatMessages({}));
     
     await waitFor(() => {
       expect(result.current.prettyMessages).toBeDefined();
     });
   });
 });
