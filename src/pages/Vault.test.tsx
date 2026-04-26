import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Vault from './Vault'
import { describe, it, expect } from 'vitest'

// Mock the hook
import * as hooks from '../hooks/useVault'
import { vi } from 'vitest'

vi.spyOn(hooks, 'useVaultData').mockReturnValue({
  data: [{ id: '1', title: 'Test Item' }],
  isLoading: false,
  error: null,
} as any)

test('Vault component renders data', () => {
  render(
    <MemoryRouter>
      <Vault username="testuser" onLogout={vi.fn()} />
    </MemoryRouter>
  )
  expect(screen.getByText(/Vault/i)).toBeInTheDocument()
  expect(screen.getByText(/Test Item/i)).toBeInTheDocument()
})
