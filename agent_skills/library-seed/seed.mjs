import fs from 'node:fs';
import path from 'node:path';
import duckdb from 'duckdb';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1VayJrz5E92IJ1LY3srwHXOrZ850mvphheqsZCeqrR-w';
const WORKSPACE_DIR = path.resolve('agent_workspace');
const DB_FILE = path.join(WORKSPACE_DIR, 'library.duckdb');
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

async function fetchSheetMetadata() {
    if (!API_KEY) {
        console.warn('Warning: GOOGLE_SHEETS_API_KEY environment variable is not set.');
        console.info('Using hardcoded fallback for known sheets (Games, Owned Games)...');
        return [
            { gid: '0', name: 'Games' },
            { gid: '1855145844', name: 'Owned Games' }
        ];
    }

    console.info(`Fetching workbook metadata using Google Sheets API for ID: ${SPREADSHEET_ID}...`);
    const sheetsClient = google.sheets({ version: 'v4', auth: API_KEY });
    
    try {
        const response = await sheetsClient.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const sheets = response.data.sheets.map(s => ({
            gid: s.properties.sheetId.toString(),
            name: s.properties.title
        }));

        console.info(`Discovered ${sheets.length} sheets:`, sheets.map(s => s.name).join(', '));
        return sheets;
    } catch (err) {
        if (err.response && err.response.status === 403) {
            throw new Error('API Key invalid or Sheets API not enabled in Google Cloud Console.');
        }
        throw err;
    }
}

async function downloadCsv(gid, filename) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
    console.info(`Downloading CSV for GID ${gid} to ${filename}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download CSV for GID ${gid}: ${response.statusText}`);
    const csv = await response.text();
    fs.writeFileSync(filename, csv);
}

async function seedDuckDB(sheets) {
    if (!fs.existsSync(WORKSPACE_DIR)) {
        fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    const db = new duckdb.Database(DB_FILE);
    const conn = db.connect();

    console.info(`Seeding DuckDB database at ${DB_FILE}...`);

    for (const sheet of sheets) {
        const tableName = sheet.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const csvFile = path.join(WORKSPACE_DIR, `${tableName}.csv`);

        try {
            await downloadCsv(sheet.gid, csvFile);
            
            console.info(`Importing ${csvFile} into table "${tableName}"...`);
            
            await new Promise((resolve, reject) => {
                conn.exec(`DROP TABLE IF EXISTS ${tableName};`, (err) => {
                    if (err) return reject(err);
                    conn.exec(`CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${csvFile}');`, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });

            fs.unlinkSync(csvFile);
            console.info(`Successfully imported "${sheet.name}" into "${tableName}".`);
        } catch (err) {
            console.error(`Error importing sheet "${sheet.name}":`, err.message);
        }
    }

    await new Promise((resolve) => {
        conn.close(() => {
            db.close(() => {
                resolve();
            });
        });
    });
    console.info('DuckDB seeding completed.');
}

async function verifyDuckDB() {
    if (!fs.existsSync(DB_FILE)) {
        console.error('Error: Database file not found.');
        return;
    }

    const db = new duckdb.Database(DB_FILE);
    const conn = db.connect();

    console.info('\n--- Library Database Summary ---');
    try {
        const tables = await new Promise((resolve, reject) => {
            conn.all('SHOW TABLES;', (err, res) => {
                if (err) return reject(err);
                resolve(res.map(r => r.name));
            });
        });

        for (const table of tables) {
            const count = await new Promise((resolve, reject) => {
                conn.all(`SELECT count(*) as count FROM ${table};`, (err, res) => {
                    if (err) return reject(err);
                    resolve(res[0].count);
                });
            });
            console.info(`Table "${table}": ${count} rows`);
        }
    } catch (err) {
        console.error('Verification failed:', err.message);
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

async function main() {
    try {
        const sheets = await fetchSheetMetadata();
        if (sheets.length === 0) {
            console.warn('No sheets discovered! Check if the spreadsheet is public.');
            return;
        }
        await seedDuckDB(sheets);
        await verifyDuckDB();
    } catch (err) {
        console.error('Action failed:', err.message);
        process.exit(1);
    }
}

main();
