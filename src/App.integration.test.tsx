import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection } from './module_bindings';
import CommunityPage from './pages/CommunityPage';

describe('Community Integration Test', () => {
  const renderWithProviders = () => {
    const connectionBuilder = DbConnection.builder()
      .withUri('ws://localhost:3000')
      .withDatabaseName('quickstart-chat')
      .withToken(
        localStorage.getItem(
          'ws://localhost:3000/quickstart-chat/auth_token'
        ) || ''
      );
    return render(
      <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
        <MemoryRouter initialEntries={['/community/general']}>
          <Routes>
            <Route path="/community/:channelName" element={<CommunityPage username="TestUser" onLogout={() => {}} />} />
          </Routes>
        </MemoryRouter>
      </SpacetimeDBProvider>
    );
  };

  it('connects to the DB and shows the community page', async () => {
    renderWithProviders();

    // Initially, we should see "Connecting..."
    expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();

    // Wait until "Connecting..." is gone (meaning we've connected)
    await waitFor(
      () =>
        expect(screen.queryByText(/Connecting.../i)).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    // Should see the general channel selected
    await waitFor(
      () => {
        expect(screen.getByText(/general/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('allows sending a message', async () => {
    renderWithProviders();

    await waitFor(
      () =>
        expect(screen.queryByText(/Connecting.../i)).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    // Find and use the message input
    const textarea = screen.getByPlaceholderText(/message/i);
    await userEvent.type(textarea, 'Hello from integration test!');

    // Send the message (press Enter)
    await userEvent.keyboard('{Enter}');

    // Wait for message to appear in the UI
    await waitFor(
      () => {
        expect(screen.getByText('Hello from integration test!')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('allows toggling a like on a message', async () => {
    renderWithProviders();

    await waitFor(
      () =>
        expect(screen.queryByText(/Connecting.../i)).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    // Send a message first
    const textarea = screen.getByPlaceholderText(/message/i);
    await userEvent.type(textarea, 'Like this message!');
    await userEvent.keyboard('{Enter}');

    // Wait for message and like button
    await waitFor(
      () => {
        expect(screen.getByText('Like this message!')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Find a like button (heart icon)
    const likeButton = await screen.findByRole('button', { name: /🤍/i });
    expect(likeButton).toBeInTheDocument();

    // Click like
    await userEvent.click(likeButton);

    // Should update to ❤️
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /❤️/i })).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
