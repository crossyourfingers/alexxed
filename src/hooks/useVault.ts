import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { VaultItem } from '../contracts/vault';

let db: duckdb.AsyncDuckDB | null = null;
let dbConnection: duckdb.AsyncDuckDBConnection | null = null;

async function getDB() {
  if (db) return db;
  const logger = new duckdb.ConsoleLogger();
  const worker = await duckdb.createWorker(duckdb.getJsDelivrBundles().mvp.mainWorker);
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(duckdb.getJsDelivrBundles().mvp.mainModule);
  await db.open({ query: { castBigIntToDouble: true } });
  return db;
}

export function useVaultData() {
  const [data, setData] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;
    
    async function loadData() {
      try {
        const duck = await getDB();
        
        // Check if we already have a connection and it's still valid
        if (!dbConnection) {
          dbConnection = await duck.connect();
        }
        
        // Load the database from the public URL
        await duck.registerFileURL('vault.duckdb', 'library.duckdb', duckdb.DuckDBDataProtocol.HTTP, false);
        await dbConnection.query(`ATTACH 'vault.duckdb' AS vault;`);
        
        const result = await dbConnection.query(`
          SELECT id, name AS title, name FROM vault.games
          UNION ALL
          SELECT id, title, name FROM vault.owned_games
        `);
        
        // Only update state if component is still mounted
        if (!isCancelled) {
          setData(result.toArray() as unknown as VaultItem[]);
        }
      } catch (err) {
        console.error('Failed to query DuckDB:', err);
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    // Cleanup function for component unmount
    return () => {
      isCancelled = true;
      // Note: DuckDB doesn't provide a direct close method for connections
      // In a real implementation, we might want to implement better connection management
    };
  }, []);

  return { data, isLoading, error };
}
