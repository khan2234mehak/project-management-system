/**
 * Runs database/schema.sql against the local SQLite database file.
 * Usage: npm run migrate
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', '..', 'database', 'pms.sqlite');

async function runMigration() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  try {
    console.log('🔧 Running schema migration...');
    db.exec(sql);
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    console.log(`✅ Schema created successfully at ${DB_PATH}`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

runMigration();
