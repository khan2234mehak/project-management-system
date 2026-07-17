/**
 * Loads demo data (users, teams, projects, tasks, etc.)
 * Usage: npm run demo
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', '..', 'database', 'pms.sqlite');

async function runDemoSeed() {
  const seedPath = path.join(__dirname, '..', '..', 'database', 'demo_seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database file not found. Run "npm run migrate" and "npm run seed" first.');
    process.exitCode = 1;
    return;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run('PRAGMA foreign_keys = ON;');

  try {
    console.log('🎭 Loading demo data...');
    db.exec(sql);
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    console.log('✅ Demo data loaded!');
    console.log('');
    console.log('   Login accounts (password for all: Admin@123)');
    console.log('   ─────────────────────────────────────────────');
    console.log('   admin@pms.local   → System Admin (Admin)');
    console.log('   priya@pms.local   → Priya Sharma (Project Manager)');
    console.log('   ravi@pms.local    → Ravi Kumar (Team Member)');
    console.log('   sneha@pms.local   → Sneha Patel (Team Member)');
    console.log('   amit@pms.local    → Amit Singh (Team Member)');
    console.log('   neha@pms.local    → Neha Gupta (Team Member)');
  } catch (err) {
    console.error('❌ Demo seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

runDemoSeed();
