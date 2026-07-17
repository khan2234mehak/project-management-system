const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
require('dotenv').config();

// ---------------------------------------------------------------------
// sql.js adapter — drop-in replacement for better-sqlite3.
// sql.js is pure JavaScript (no native build tools needed), so it works
// on any platform including Windows without Visual Studio.
//
// The public API of this module is identical to the better-sqlite3
// version: pool.query(), pool.getConnection(), testConnection(), rawDb.
// All controllers stay untouched.
// ---------------------------------------------------------------------

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', '..', 'database', 'pms.sqlite');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db = null;   // sql.js Database instance (synchronous API)

// sql.js must be initialised asynchronously once, then used synchronously.
let dbReady = null;  // Promise that resolves when db is open

function getDb() {
  if (!dbReady) {
    dbReady = initSqlJs().then((SQL) => {
      if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }
      // Enable WAL-equivalent and foreign keys
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA foreign_keys = ON;');
      return db;
    });
  }
  return dbReady;
}

// Persist the in-memory sql.js database back to disk after every write.
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function isSelectStatement(sql) {
  return /^\s*(SELECT|PRAGMA)/i.test(sql);
}

// Expand mysql2-style bulk-insert placeholder: VALUES ?  →  VALUES (?,?),(?,?)
function expandBulkValues(sql, params) {
  const rows = params[0];
  if (!Array.isArray(rows) || !rows.length) return { sql, params: [] };
  const placeholderRow = `(${rows[0].map(() => '?').join(', ')})`;
  const expandedSql = sql.replace(/VALUES\s*\?\s*$/i, `VALUES ${rows.map(() => placeholderRow).join(', ')}`);
  return { sql: expandedSql, params: rows.flat() };
}

async function query(sql, params = []) {
  await getDb();

  let finalSql = sql;
  let finalParams = params;

  if (/VALUES\s*\?\s*$/i.test(sql.trim())) {
    ({ sql: finalSql, params: finalParams } = expandBulkValues(sql, params));
    if (!finalParams.length) return [[]];
  }

  if (isSelectStatement(finalSql)) {
    const result = db.exec(finalSql, finalParams);
    if (!result.length) return [[]];
    const { columns, values } = result[0];
    const rows = values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    return [rows];
  }

  // Write statement
  db.run(finalSql, finalParams);
  persist();

  // sql.js doesn't expose lastInsertRowid directly after run(); query it.
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] ?? 0;
  const changes = db.exec('SELECT changes() as c')[0]?.values[0]?.[0] ?? 0;
  return [{ insertId: lastId, affectedRows: changes, changedRows: changes }];
}

function getConnection() {
  return Promise.resolve({
    query,
    beginTransaction: async () => { await getDb(); db.run('BEGIN'); },
    commit: async () => { db.run('COMMIT'); persist(); },
    rollback: async () => { try { db.run('ROLLBACK'); } catch { /* no-op */ } },
    release: () => {},
    ping: () => Promise.resolve(),
  });
}

const pool = { query, getConnection };

async function testConnection() {
  try {
    await getDb();
    db.exec('SELECT 1');
    console.log(`✅ SQLite database ready at ${DB_PATH}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to open SQLite database:', err.message);
    return false;
  }
}

// rawDb is used by migration / seed utilities — return a promise-wrapped
// facade so those scripts can await it the same way.
const rawDb = {
  pragma: async (p) => { await getDb(); db.run(`PRAGMA ${p};`); },
  exec:   async (sql) => { await getDb(); db.exec(sql); persist(); },
  close:  () => { if (db) { persist(); db.close(); } },
  _getDb: getDb,
};

module.exports = { pool, testConnection, rawDb };
