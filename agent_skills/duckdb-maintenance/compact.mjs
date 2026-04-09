import duckdb from 'duckdb';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const databasesToCompact = [
  'agent_skills/agents_monitoring.duckdb',
  'agent_skills/library.duckdb'
];

async function compact(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.warn(`Database not found: ${dbPath}`);
    return;
  }

  const tempDbPath = `${dbPath}.compacting`;
  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }

  console.log(`Compacting ${dbPath}...`);
  const initialSize = fs.statSync(dbPath).size;

  const db = new duckdb.Database(':memory:');
  const conn = db.connect();

  const query = (sql) => new Promise((resolve, reject) => {
    conn.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    // We attach both databases to an in-memory session for a neutral context
    await query(`ATTACH '${dbPath}' AS old_db (READ_ONLY);`);
    await query(`ATTACH '${tempDbPath}' AS new_db;`);
    await query(`COPY FROM DATABASE old_db TO new_db;`);
    await query(`DETACH old_db;`);
    await query(`DETACH new_db;`);
    
    // Explicitly close the connection and database before swapping files
    conn.close();
    db.close();

    // Give it a tiny moment to ensure file handles are released
    await new Promise(resolve => setTimeout(resolve, 500));

    // Swap files
    fs.unlinkSync(dbPath);
    fs.renameSync(tempDbPath, dbPath);

    const finalSize = fs.statSync(dbPath).size;
    const savings = ((initialSize - finalSize) / 1024).toFixed(2);
    const percent = (((initialSize - finalSize) / initialSize) * 100).toFixed(2);

    console.log(`Successfully compacted ${dbPath}:`);
    console.log(`  Initial size: ${(initialSize / 1024).toFixed(2)} KB`);
    console.log(`  Final size:   ${(finalSize / 1024).toFixed(2)} KB`);
    console.log(`  Reduced by:   ${savings} KB (${percent}%)`);
  } catch (err) {
    console.error(`Error compacting ${dbPath}:`, err);
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  } finally {
    // Ensure cleanup even on error
    try { conn.close(); } catch (e) {}
    try { db.close(); } catch (e) {}
  }
}

async function run() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : databasesToCompact;

  for (const target of targets) {
    await compact(target);
  }
}

run().catch(err => {
  console.error('Maintenance failed:', err);
  process.exit(1);
});
