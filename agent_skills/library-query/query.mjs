import fs from 'node:fs';
import path from 'node:path';
import duckdb from 'duckdb';

const WORKSPACE_DIR = path.resolve('agent_workspace');
const DB_FILE = path.join(WORKSPACE_DIR, 'library.duckdb');

async function runQuery(sql) {
    if (!fs.existsSync(DB_FILE)) {
        console.error('Error: Database file not found. Run library-seed first.');
        process.exit(1);
    }

    const db = new duckdb.Database(DB_FILE);
    const conn = db.connect();

    try {
        const rows = await new Promise((resolve, reject) => {
            conn.all(sql, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });

        if (rows.length === 0) {
            console.info('No results.');
        } else {
            console.table(rows);
        }
    } catch (err) {
        console.error('Query failed:', err.message);
    } finally {
        await new Promise((resolve) => {
            conn.close(() => {
                db.close(() => {
                    resolve();
                });
            });
        });
    }
}

async function listTables() {
    await runQuery('SHOW TABLES;');
}

async function searchGames(term) {
    console.info(`Searching for "${term}" across all tables...`);
    // Note: We use double single-quotes for SQL escaping in PowerShell if needed, 
    // but here we are in Node.js, so we just use standard single quotes in the SQL string.
    const sql = `
        SELECT Name as Title, Genre, Platforms, 'Games Sheet' as Source
        FROM games 
        WHERE Name ILIKE '%${term}%'
        UNION ALL
        SELECT Title, Genre, Platforms, 'Owned Games Sheet' as Source
        FROM owned_games 
        WHERE Title ILIKE '%${term}%'
    `;
    await runQuery(sql);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--list')) {
        await listTables();
        return;
    }

    if (args.includes('--search')) {
        const termIndex = args.indexOf('--search');
        const term = args.slice(termIndex + 1).join(' ');
        if (!term) {
            console.error('Error: Please provide a search term after --search');
            process.exit(1);
        }
        await searchGames(term);
        return;
    }

    if (args.includes('--sql')) {
        const sqlIndex = args.indexOf('--sql');
        const sql = args.slice(sqlIndex + 1).join(' ');
        if (!sql) {
            console.error('Error: Please provide a SQL query after --sql');
            process.exit(1);
        }
        await runQuery(sql);
        return;
    }

    console.info('Usage:');
    console.info('  node query.mjs --list                # List all tables');
    console.info('  node query.mjs --search <term>       # Search across all game tables');
    console.info('  node query.mjs --sql "<query>"       # Run custom SQL');
}

main();
