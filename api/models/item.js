const { getDB } = require('../controllers/db');

function createItem({ question, answer, type, pts = 1, section_id }) {
  const db = getDB();
  const info = db.prepare('INSERT INTO items (question, answer, type, pts, section_id) VALUES (?, ?, ?, ?, ?)').run(question, answer, type, pts, section_id);
  return { id: info.lastInsertRowid, question, answer, type, pts, section_id };
}

function getItem(id) { return getDB().prepare('SELECT * FROM items WHERE id = ?').get(id); }
function updateItem(id, { question, answer, type, pts }) {
  return getDB().prepare("UPDATE items SET question = COALESCE(?, question), answer = COALESCE(?, answer), type = COALESCE(?, type), pts = COALESCE(?, pts), updated_at = datetime('now') WHERE id = ?").run(question, answer, type, pts, id).changes;
}
function deleteItem(id) { return getDB().prepare('DELETE FROM items WHERE id = ?').run(id).changes; }
function listItems(section_id) { if (section_id) return getDB().prepare('SELECT * FROM items WHERE section_id = ?').all(section_id); return getDB().prepare('SELECT * FROM items').all(); }

module.exports = { createItem, getItem, updateItem, deleteItem, listItems };