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

async function getRecommendationGames() {
    const db = new duckdb.Database(DB_FILE);
    const conn = db.connect();

    return new Promise((resolve, reject) => {
        conn.all("SELECT * FROM games WHERE Name IS NOT NULL AND Name != ''", (err, res) => {
            if (err) {
                conn.close();
                db.close();
                return reject(err);
            }
            const games = res.map(row => ({
                id: stableHash(row.Name).toString(), // convert to string for JSON
                title: row.Name,
                genre: row.Genre || null,
                purchase_link: row['Store Link'] || null,
                played: row.Owned ? row.Owned.toLowerCase() === 'yes' : false,
                subtitle: null,
                cover_url: null
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

    console.info(`Syncing ${games.length} recommendations to SpacetimeDB (${database})...`);

    // SpacetimeDB Optional fields (Option<T>) require a sum type in JSON: { "some": value } or null
    const OPTIONAL_FIELDS = ['cover_url', 'purchase_link', 'played', 'subtitle', 'genre'];

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
            const args = ['call', database, 'import_recommendations_batch', payload, '--server', 'maincloud'];
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
        const games = await getRecommendationGames();
        await syncToSpacetimeDB(games);
        console.info('Recommendation sync completed.');
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
}

main();
