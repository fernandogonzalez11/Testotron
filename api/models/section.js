const { getDB } = require('../controllers/db');

function createSection({ name, test_code }) {
  const db = getDB();
  const info = db.prepare('INSERT INTO sections (name, test_code) VALUES (?, ?)').run(name, test_code);
  return { id: info.lastInsertRowid, name, test_code };
}

function getSection(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
}

function updateSection(id, { name }) {
  const db = getDB();
  return db.prepare("UPDATE sections SET name = COALESCE(?, name), updated_at = datetime('now') WHERE id = ?").run(name, id).changes;
}

function deleteSection(id) {
  const db = getDB();
  return db.prepare('DELETE FROM sections WHERE id = ?').run(id).changes;
}

function listSections(test_code) {
  const db = getDB();
  if (test_code) return db.prepare('SELECT * FROM sections WHERE test_code = ?').all(test_code);
  return db.prepare('SELECT * FROM sections').all();
}

module.exports = { createSection, getSection, updateSection, deleteSection, listSections };