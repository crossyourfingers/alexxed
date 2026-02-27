import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection } from './module_bindings';

describe('App Integration Test', () => {
  it('connects to the DB, allows name change and message sending', async () => {
    const connectionBuilder = DbConnection.builder()
      .withUri('ws://localhost:3000')
      .withDatabaseName('quickstart-chat')
      .withToken(
        localStorage.getItem(
          'ws://localhost:3000/quickstart-chat/auth_token'
        ) || ''
      );
    render(
      <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
        <App />
      </SpacetimeDBProvider>
    );

    // Initially, we should see "Connecting..."
    expect(screen.getByText(/Connecting.../i)).toBeInTheDocument();

    // Wait until "Connecting..." is gone (meaning we've connected)
    // This might require the actual DB to accept the connection
    await waitFor(
      () =>
        expect(screen.queryByText(/Connecting.../i)).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    // The profile section should show the default name or truncated identity
    // For example, you can check if the text is rendered.
    // If your default identity is something like 'abcdef12' or 'Unknown'
    // we do a generic check:
    expect(
      screen.getByRole('heading', { name: /profile/i })
    ).toBeInTheDocument();

    // Let's change the user's name
    const editNameButton = screen.getByText(/Edit Name/i);
    await userEvent.click(editNameButton);

    const nameInput = screen.getByRole('textbox', { name: /name input/i });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'TestUser');
    const submitNameButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitNameButton);

    // If your DB or UI updates instantly, we can check that the new name shows up
    await waitFor(
      () => {
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Now let's send a message
    const textarea = screen.getByRole('textbox', { name: /message input/i });
    await userEvent.type(textarea, 'Hello from GH Actions!');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Wait for message to appear in the UI
    await waitFor(
      () => {
        expect(screen.getByText('Hello from GH Actions!')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('allows toggling a like on a message', async () => {
    const connectionBuilder = DbConnection.builder()
      .withUri('ws://localhost:3000')
      .withDatabaseName('quickstart-chat')
      .withToken(
        localStorage.getItem(
          'ws://localhost:3000/quickstart-chat/auth_token'
        ) || ''
      );
    render(
      <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
        <App />
      </SpacetimeDBProvider>
    );

    await waitFor(
      () =>
        expect(screen.queryByText(/Connecting.../i)).not.toBeInTheDocument(),
      { timeout: 10000 }
    );

    // Send a message first
    const textarea = screen.getByRole('textbox', { name: /message input/i });
    await userEvent.type(textarea, 'Like this message!');
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Wait for message and like button
    await waitFor(
      () => {
        expect(screen.getByText('Like this message!')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const likeButton = await screen.findByRole('button', { name: /🤍 0/i });
    expect(likeButton).toBeInTheDocument();

    // Click like
    await userEvent.click(likeButton);

    // Should update to ❤️ 1
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /❤️ 1/i })).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Click again to unlike
    const likedButton = screen.getByRole('button', { name: /❤️ 1/i });
    await userEvent.click(likedButton);

    // Should update back to 🤍 0
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /🤍 0/i })).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
