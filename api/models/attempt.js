const { getDB } = require('../db');

function createAttempt(user_id, test_code) {
  const db = getDB();
  const info = db.prepare('INSERT INTO attempts (user_id, test_code) VALUES (?, ?)').run(user_id, test_code);
  return { id: info.lastInsertRowid, user_id, test_code };
}

function getAttempt(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM attempts WHERE id = ?').get(Number(id));
}

function submitAttempt(id) {
  const db = getDB();
  return db.prepare("UPDATE attempts SET status = 'submitted', submitted_at = datetime('now') WHERE id = ?").run(Number(id)).changes;
}

function updateAttemptScore(id, score, max_score) {
  const db = getDB();
  return db.prepare('UPDATE attempts SET score = ?, max_score = ?, status = ?, graded_at = datetime(\'now\') WHERE id = ?').run(score, max_score, 'graded', Number(id)).changes;
}

module.exports = { createAttempt, getAttempt, submitAttempt, updateAttemptScore };