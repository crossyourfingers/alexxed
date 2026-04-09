import fs from 'fs';
import path from 'path';
import duckdb from 'duckdb';
const { Database } = duckdb;
import { promisify } from 'util';

const DB_PATH = path.join(process.cwd(), 'agent_skills', 'agents_monitoring.duckdb');
const THRESHOLD = 100;

async function run() {
  const db = new Database(DB_PATH);
  const conn = db.connect();
  const query = promisify(conn.all).bind(conn);
  const exec = promisify(conn.exec).bind(conn);

  console.log('--- Documentation Scanner (AGENTS.md & SKILL.md) ---');

  // Initialize database with file_type and priority columns
  await exec(`
    CREATE TABLE IF NOT EXISTS agents_monitoring (
      path TEXT PRIMARY KEY,
      file_type TEXT,
      line_count INTEGER,
      violation_score INTEGER,
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for older databases
  try {
    await exec(`ALTER TABLE agents_monitoring ADD COLUMN file_type TEXT`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE agents_monitoring ADD COLUMN priority TEXT DEFAULT 'medium'`);
  } catch (e) {}

  // Handle command-line arguments for priority setting: node scan.mjs set <path_pattern> <level>
  if (process.argv[2] === 'set' && process.argv[3] && process.argv[4]) {
    const pattern = process.argv[3];
    const level = process.argv[4].toLowerCase();
    const validLevels = ['high', 'medium', 'low'];
    
    if (validLevels.includes(level)) {
      await exec(`UPDATE agents_monitoring SET priority = '${level}' WHERE path LIKE '%${pattern}%'`);
      console.log(`Set priority to '${level}' for files matching: ${pattern}`);
      // Exit early after setting priority
      process.exit(0);
    } else {
      console.error(`Invalid priority level: ${level}. Use: high, medium, or low.`);
      process.exit(1);
    }
  }

  const targetFiles = findTargetFiles(process.cwd());
  console.log(`Found ${targetFiles.length} target files.`);

  for (const filePath of targetFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineCount = lines.length;
    const violationScore = Math.max(0, lineCount - THRESHOLD);

    console.log(`Scanning: ${relativePath} (${lineCount} lines, score: ${violationScore})`);

    // UPSERT: Insert or update, but preserve priority status
    await exec(`
      INSERT INTO agents_monitoring (path, file_type, line_count, violation_score, last_updated)
      VALUES ('${relativePath}', '${fileName}', ${lineCount}, ${violationScore}, CURRENT_TIMESTAMP)
      ON CONFLICT(path) DO UPDATE SET
        file_type = excluded.file_type,
        line_count = excluded.line_count,
        violation_score = excluded.violation_score,
        last_updated = excluded.last_updated
    `);
  }

  console.log('Scan complete. Data stored in DuckDB.');
}

function findTargetFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'agent_workspace') continue;
    
    if (fs.statSync(filePath).isDirectory()) {
      findTargetFiles(filePath, fileList);
    } else if (file === 'AGENTS.md' || file === 'SKILL.md') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

run().catch(err => {
  console.error('Error during scan:', err);
  process.exit(1);
});
