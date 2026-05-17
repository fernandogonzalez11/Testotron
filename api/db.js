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
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')) DEFAULT 'student',
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id INTEGER,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

CREATE TABLE IF NOT EXISTS tests (

  code TEXT PRIMARY KEY,

  template_id INTEGER,

  owner_id INTEGER,

  group_code TEXT,

  title TEXT NOT NULL,

  description TEXT DEFAULT '',

  instructions TEXT DEFAULT '',

  status TEXT
    CHECK(status IN ('draft','published','closed'))
    DEFAULT 'draft',

  time_limit_minutes INTEGER,

  published_at TEXT,

  due_at TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY(template_id)
    REFERENCES quiz_templates(id)
    ON DELETE SET NULL,

  FOREIGN KEY(owner_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  FOREIGN KEY(group_code)
    REFERENCES groups(code)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS test_questions (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  test_code TEXT NOT NULL,

  original_question_id INTEGER,

  section_title TEXT,

  position INTEGER DEFAULT 0,

  question TEXT NOT NULL,

  type TEXT NOT NULL,

  metadata TEXT,

  correct_answer TEXT,

  pts INTEGER DEFAULT 1,

  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY(test_code)
    REFERENCES tests(code)
    ON DELETE CASCADE,

  FOREIGN KEY(original_question_id)
    REFERENCES questions(id)
    ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS quiz_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  time_limit_minutes INTEGER,
  shuffle_questions INTEGER DEFAULT 0,
  shuffle_answers INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(template_id)
    REFERENCES quiz_templates(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata TEXT,
  correct_answer TEXT,
  difficulty TEXT DEFAULT 'medium',
  category TEXT DEFAULT '',
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_questions (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  template_section_id INTEGER NOT NULL,

  question_id INTEGER NOT NULL,

  position INTEGER DEFAULT 0,

  pts INTEGER DEFAULT 1,

  required INTEGER DEFAULT 1,

  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY(template_section_id)
    REFERENCES template_sections(id)
    ON DELETE CASCADE,

  FOREIGN KEY(question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attempts (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  user_id INTEGER NOT NULL,

  test_code TEXT NOT NULL,

  status TEXT
    CHECK(status IN ('in_progress','submitted','graded'))
    DEFAULT 'in_progress',

  started_at TEXT DEFAULT (datetime('now')),

  submitted_at TEXT,

  graded_at TEXT,

  score REAL DEFAULT 0,

  max_score REAL DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY(test_code)
    REFERENCES tests(code)
    ON DELETE CASCADE
);
    -- Indexes to speed ownership queries
    CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tests_owner ON tests(owner_id);
    CREATE INDEX IF NOT EXISTS idx_templates_owner ON quiz_templates(owner_id);

CREATE TABLE IF NOT EXISTS attempt_answers (

  attempt_id INTEGER NOT NULL,

  test_question_id INTEGER NOT NULL,

  response TEXT,

  pts_obtained REAL DEFAULT 0,

  feedback TEXT,

  graded_by INTEGER,

  graded_at TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  PRIMARY KEY(attempt_id, test_question_id),

  FOREIGN KEY(attempt_id)
    REFERENCES attempts(id)
    ON DELETE CASCADE,

  FOREIGN KEY(test_question_id)
    REFERENCES test_questions(id)
    ON DELETE CASCADE,

  FOREIGN KEY(graded_by)
    REFERENCES users(id)
    ON DELETE SET NULL
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
      const info = d.prepare('INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)').run('admin@local.com', 'admin', '123456', 'admin');
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

    // sections.created_by
    const sectionInfo = d.prepare("PRAGMA table_info('sections')").all();
    if (!sectionInfo.find(c => c.name === 'created_by')) {
      try {
        d.prepare('ALTER TABLE sections ADD COLUMN created_by INTEGER').run();
        d.prepare('UPDATE sections SET created_by = ? WHERE created_by IS NULL').run(adminId);
      } catch (e) { /* ignore */ }
    }

    // items.created_by
    const itemInfo = d.prepare("PRAGMA table_info('items')").all();
    if (!itemInfo.find(c => c.name === 'created_by')) {
      try {
        d.prepare('ALTER TABLE items ADD COLUMN created_by INTEGER').run();
        d.prepare('UPDATE items SET created_by = ? WHERE created_by IS NULL').run(adminId);
      } catch (e) { /* ignore */ }
    }

    // ensure indexes exist (already created above via CREATE INDEX IF NOT EXISTS)
  } catch (err) {
    console.error('Migration warning: could not ensure ownership columns/indexes', err);
  }

  return d;
}

module.exports = { initDB, getDB, createSchema };
