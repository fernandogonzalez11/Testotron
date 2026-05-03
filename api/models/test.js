const { getDB } = require('../controllers/db');

function genCode() { return Math.random().toString(36).slice(2,10).toUpperCase(); }

function createTest({ code, name, group_code }) {
  const db = getDB();
  const c = code || genCode();
  db.prepare('INSERT INTO tests (code, name, group_code) VALUES (?, ?, ?)').run(c, name, group_code);
  return { code: c, name, group_code };
}

function getTest(code) {
  const db = getDB();
  return db.prepare('SELECT t.code, t.name, t.group_code, t.created_at, t.updated_at, g.name as group_name FROM tests t LEFT JOIN groups g ON g.code = t.group_code WHERE t.code = ?').get(code);
}

function updateTest(code, { name, group_code }) {
  const db = getDB();
  return db.prepare("UPDATE tests SET name = COALESCE(?, name), group_code = COALESCE(?, group_code), updated_at = datetime('now') WHERE code = ?").run(name, group_code, code).changes;
}

function deleteTest(code) {
  const db = getDB();
  return db.prepare('DELETE FROM tests WHERE code = ?').run(code).changes;
}

function listTests({ name, group_code } = {}) {
  const db = getDB();
  let q = 'SELECT code, name, group_code FROM tests WHERE 1=1';
  const params = [];
  if (name) { q += ' AND name LIKE ?'; params.push('%' + name + '%'); }
  if (group_code) { q += ' AND group_code = ?'; params.push(group_code); }
  return db.prepare(q).all(...params);
}

module.exports = { createTest, getTest, updateTest, deleteTest, listTests };