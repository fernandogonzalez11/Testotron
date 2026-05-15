const Database = require('better-sqlite3');

let db;

function initDB(path = './data.sqlite') {
  if (db) return db;
  db = new Database(path);
  // enforce foreign keys
  db.pragma('foreign_keys = ON');
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

function createSchema() {
  const d = getDB();

  d.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')) DEFAULT 'student',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tests (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id INTEGER,
      group_code TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(group_code) REFERENCES groups(code) ON DELETE SET NULL,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      test_code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(test_code) REFERENCES tests(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT,
      type TEXT NOT NULL,
      pts INTEGER DEFAULT 1,
      section_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      test_code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(test_code) REFERENCES tests(code) ON DELETE CASCADE
    );

    -- Indexes to speed ownership queries
    CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tests_owner ON tests(owner_id);
    CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_answers_user ON answers(user_id);

    CREATE TABLE IF NOT EXISTS answerxitem (
      answer_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      pts_obtained INTEGER DEFAULT 0,
      feedback TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(answer_id, item_id),
      FOREIGN KEY(answer_id) REFERENCES answers(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    -- association: users in groups (many-to-many)
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL,
      group_code TEXT NOT NULL,
      role_in_group TEXT DEFAULT 'member',
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(user_id, group_code),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(group_code) REFERENCES groups(code) ON DELETE CASCADE
    );
  `);

  // Migration: add owner_id to existing tables if missing (preserve data)
  try {
    const adminRow = d.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
    let adminId = adminRow ? adminRow.id : null;
    if (!adminId) {
      // create a fallback admin
      const bcrypt = require('bcrypt');
      const pw = bcrypt.hashSync('admin', 10);
      const info = d.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run('admin@local', pw, 'admin');
      adminId = info.lastInsertRowid;
    }

    // groups.owner_id
    const groupInfo = d.prepare("PRAGMA table_info('groups')").all();
    if (!groupInfo.find(c => c.name === 'owner_id')) {
      d.prepare('ALTER TABLE groups ADD COLUMN owner_id INTEGER').run();
      d.prepare('UPDATE groups SET owner_id = ? WHERE owner_id IS NULL').run(adminId);
    }

    // tests.owner_id
    const testInfo = d.prepare("PRAGMA table_info('tests')").all();
    if (!testInfo.find(c => c.name === 'owner_id')) {
      d.prepare('ALTER TABLE tests ADD COLUMN owner_id INTEGER').run();
      d.prepare('UPDATE tests SET owner_id = ? WHERE owner_id IS NULL').run(adminId);
    }

    // ensure indexes exist (already created above via CREATE INDEX IF NOT EXISTS)
  } catch (err) {
    console.error('Migration warning: could not ensure ownership columns/indexes', err);
  }

  return d;
}

module.exports = { initDB, getDB, createSchema };

module.exports = { initDB, getDB, createSchema };