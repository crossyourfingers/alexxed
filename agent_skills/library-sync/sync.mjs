import duckdb from 'duckdb';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const DB_FILE = path.resolve('agent_skills', 'library.duckdb');
const BATCH_SIZE = 50;

/**
 * Stable u64 hash from a string, matching SpacetimeDB backend logic.
 */
function stableHash(input) {
    let hash = 0n;
    for (let i = 0; i < input.length; i++) {
        const char = BigInt(input.charCodeAt(i));
        hash = (hash << 5n) - hash + char;
        hash = hash & 0xffffffffffffffffn; // Keep it within u64 range
    }
    return hash;
}

async function getLibraryGames() {
    const db = new duckdb.Database(DB_FILE);
    const conn = db.connect();

    return new Promise((resolve, reject) => {
        conn.all("SELECT * FROM owned_games WHERE Title IS NOT NULL AND Title != ''", (err, res) => {
            if (err) {
                conn.close();
                db.close();
                return reject(err);
            }
            const games = res.map(row => ({
                id: stableHash(row.Title).toString(), // convert to string for JSON
                title: row.Title,
                genre: row.Genre || null,
                platform: row.Source || null,
                cover_url: null,
                wikipedia_url: null
            }));
            conn.close();
            db.close();
            resolve(games);
        });
    });
}

async function syncToSpacetimeDB(games) {
    // Get database name from spacetime.local.json
    const localJson = JSON.parse(fs.readFileSync('spacetime.local.json', 'utf8'));
    const database = localJson.database;

    console.info(`Syncing ${games.length} library games to SpacetimeDB (${database})...`);

    // SpacetimeDB Optional fields (Option<T>) require a sum type in JSON: { "some": value } or null
    const OPTIONAL_FIELDS = ['cover_url', 'genre', 'platform', 'wikipedia_url'];

    const transformRow = (row) => {
        const result = { id: row.id, title: row.title };
        for (const field of OPTIONAL_FIELDS) {
            const value = row[field];
            if (value !== null && value !== undefined) {
                result[field] = { some: value };
            } else {
                result[field] = null;
            }
        }
        return result;
    };

    for (let i = 0; i < games.length; i += BATCH_SIZE) {
        const batch = games.slice(i, i + BATCH_SIZE).map(transformRow);
        let payload = JSON.stringify(batch);
        // SpacetimeDB CLI expects u64 as unquoted numbers in JSON
        payload = payload.replace(/"id":"(\d+)"/g, '"id":$1');
        
        try {
            console.info(`Pushing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
            const args = ['call', database, 'import_library_batch', payload, '--server', 'maincloud'];
            const result = spawnSync('spacetime', args, { stdio: 'inherit', encoding: 'utf8' });
            
            if (result.status !== 0) {
                console.error(`Error pushing batch at index ${i}: Status ${result.status}`);
            }
        } catch (err) {
            console.error(`Error pushing batch at index ${i}:`, err.message);
        }
    }
}

async function main() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            console.error('Error: Database file not found. Run library-seed first.');
            process.exit(1);
        }
        const games = await getLibraryGames();
        await syncToSpacetimeDB(games);
        console.info('Library sync completed.');
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
}

main();
