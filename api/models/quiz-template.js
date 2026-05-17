const { getDB } = require('../db');

function createTemplate({ owner_id, title, description = '', instructions = '', time_limit_minutes = null, shuffle_questions = 0, shuffle_answers = 0 }) {
  const db = getDB();
  const info = db.prepare(`INSERT INTO quiz_templates (owner_id, title, description, instructions, time_limit_minutes, shuffle_questions, shuffle_answers) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(owner_id, title, description, instructions, time_limit_minutes, shuffle_questions, shuffle_answers);
  return { id: info.lastInsertRowid, owner_id, title, description };
}

function getTemplateById(id) {
  return getDB().prepare('SELECT * FROM quiz_templates WHERE id = ?').get(Number(id));
}

function listTemplates(owner_id) {
  const db = getDB();
  if (owner_id) return db.prepare('SELECT * FROM quiz_templates WHERE owner_id = ? ORDER BY created_at DESC').all(owner_id);
  return db.prepare('SELECT * FROM quiz_templates ORDER BY created_at DESC').all();
}

function updateTemplate(id, data) {
  const db = getDB();
  const info = db.prepare(`UPDATE quiz_templates SET title = COALESCE(?, title), description = COALESCE(?, description), instructions = COALESCE(?, instructions), time_limit_minutes = COALESCE(?, time_limit_minutes), shuffle_questions = COALESCE(?, shuffle_questions), shuffle_answers = COALESCE(?, shuffle_answers), updated_at = datetime('now') WHERE id = ?`).run(
    data.title,
    data.description,
    data.instructions,
    data.time_limit_minutes,
    data.shuffle_questions,
    data.shuffle_answers,
    Number(id)
  );
  return info.changes;
}

function deleteTemplate(id) {
  return getDB().prepare('DELETE FROM quiz_templates WHERE id = ?').run(Number(id)).changes;
}

function getOwnerId(id) {
  const r = getDB().prepare('SELECT owner_id FROM quiz_templates WHERE id = ?').get(Number(id));
  return r ? r.owner_id : null;
}

module.exports = { createTemplate, getTemplateById, listTemplates, updateTemplate, deleteTemplate, getOwnerId };
