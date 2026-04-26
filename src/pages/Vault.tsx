import React from 'react'
import { useVaultData } from '../hooks/useVault'
import { Header } from '../components/Header'

export default function Vault({ username, onLogout }: { username: string, onLogout: () => void }): JSX.Element {
  const { data, isLoading, error } = useVaultData()

  if (isLoading) return <div>Loading vault...</div>
  if (error) return <div>Error loading vault</div>

  return (
    <>
      <Header activePage="vault" username={username} onLogout={onLogout} />
      <main style={{ padding: 24 }}>
        <h1>Vault</h1>
        <section>
          {data?.length ? (
            <ul>
              {data.map((item: any) => (
                <li key={item.id}>{item.title ?? item.name}</li>
              ))}
            </ul>
          ) : (
            <div>No items found in the vault.</div>
          )}
        </section>
      </main>
    </>
  )
}
