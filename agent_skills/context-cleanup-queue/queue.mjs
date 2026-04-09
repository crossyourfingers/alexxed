import path from 'path';
import duckdb from 'duckdb';
const { Database } = duckdb;
import { promisify } from 'util';

const DB_PATH = path.join(process.cwd(), 'agent_skills', 'agents_monitoring.duckdb');

async function run() {
  const db = new Database(DB_PATH);
  const conn = db.connect();
  const query = promisify(conn.all).bind(conn);

  console.log('--- Documentation Violation Queue (AGENTS.md & SKILL.md) ---');

  const results = await query(`
    SELECT 
      path,
      file_type,
      line_count, 
      violation_score,
      priority,
      last_updated
    FROM agents_monitoring 
    ORDER BY 
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
      violation_score DESC, 
      line_count DESC
  `);

  if (results.length === 0) {
    console.log('No documentation files monitored yet. Run the scan first.');
    return;
  }

  console.table(results.map(r => ({
    File: r.path,
    Type: r.file_type || 'Unknown',
    Priority: r.priority?.toUpperCase() || 'MEDIUM',
    Lines: r.line_count,
    'Score (Violation)': r.violation_score,
    Status: r.violation_score > 0 ? (r.priority === 'low' ? '⚠️ IGNORED' : '❌ VIOLATING') : '✅ OK'
  })));

  const totalViolations = results.filter(r => r.violation_score > 0 && r.priority !== 'low').length;
  const totalIgnored = results.filter(r => r.violation_score > 0 && r.priority === 'low').length;
  console.log(`\nSummary: ${results.length} files monitored, ${totalViolations} violations found, ${totalIgnored} ignored (low priority).`);
}

run().catch(err => {
  console.error('Error querying queue:', err);
  process.exit(1);
});
