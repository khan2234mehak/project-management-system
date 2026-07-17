/**
 * Runs database/seed.sql against the local SQLite database file.
 * Usage: npm run seed   (after npm run migrate)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', '..', 'database', 'pms.sqlite');

async function runSeed() {
  const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database file not found. Run "npm run migrate" first.');
    process.exitCode = 1;
    return;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run('PRAGMA foreign_keys = ON;');

  try {
    console.log('🌱 Seeding database...');
    db.exec(sql);
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    console.log('✅ Seed complete. Default admin login: admin@pms.local / Admin@123');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

runSeed();
