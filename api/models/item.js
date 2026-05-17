const { getDB } = require('../controllers/db');

function createItem({
  question,
  type,
  pts = 1,
  section_id,
  created_by,
  metadata = {},
  correct_answer = null,
  difficulty = 'medium',
  category = ''
}) {

  const db = getDB();

  const info = db.prepare(`
    INSERT INTO items (
      question,
      type,
      pts,
      section_id,
      created_by,
      metadata,
      correct_answer,
      difficulty,
      category
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    question,
    type,
    pts,
    section_id,
    created_by,
    JSON.stringify(metadata),
    JSON.stringify(correct_answer),
    difficulty,
    category
  );

  return info.lastInsertRowid;
}

function getItem(id) { return getDB().prepare('SELECT * FROM items WHERE id = ?').get(id); }
function updateItem(id, { question, answer, type, pts }) {
  return getDB().prepare("UPDATE items SET question = COALESCE(?, question), answer = COALESCE(?, answer), type = COALESCE(?, type), pts = COALESCE(?, pts), updated_at = datetime('now') WHERE id = ?").run(question, answer, type, pts, id).changes;
}
function deleteItem(id) { return getDB().prepare('DELETE FROM items WHERE id = ?').run(id).changes; }
function listItems(section_id) { if (section_id) return getDB().prepare('SELECT * FROM items WHERE section_id = ?').all(section_id); return getDB().prepare('SELECT * FROM items').all(); }

module.exports = { createItem, getItem, updateItem, deleteItem, listItems };
