const { getDB } = require('../db');

function getTestQuestions(test_code) {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM test_questions WHERE test_code = ? ORDER BY position ASC').all(test_code);
  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    correct_answer: row.correct_answer ? JSON.parse(row.correct_answer) : null
  }));
}

function addTestQuestion(test_code, { original_question_id = null, section_title = null, position = 0, question = '', type = 'text', metadata = {}, correct_answer = null, pts = 1 }) {
  const db = getDB();
  const info = db.prepare(`INSERT INTO test_questions (test_code, original_question_id, section_title, position, question, type, metadata, correct_answer, pts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(test_code, original_question_id, section_title, position, question, type, JSON.stringify(metadata || {}), correct_answer ? JSON.stringify(correct_answer) : null, pts);
  return info.lastInsertRowid;
}

function updateTestQuestion(id, data) {
  const db = getDB();
  return db.prepare(`UPDATE test_questions SET section_title = COALESCE(?, section_title), position = COALESCE(?, position), question = COALESCE(?, question), type = COALESCE(?, type), metadata = COALESCE(?, metadata), correct_answer = COALESCE(?, correct_answer), pts = COALESCE(?, pts) WHERE id = ?`).run(
    data.section_title,
    data.position,
    data.question,
    data.type,
    data.metadata ? JSON.stringify(data.metadata) : null,
    data.correct_answer !== undefined ? JSON.stringify(data.correct_answer) : null,
    data.pts,
    Number(id)
  ).changes;
}

function deleteTestQuestion(id) {
  const db = getDB();
  return db.prepare('DELETE FROM test_questions WHERE id = ?').run(Number(id)).changes;
}

module.exports = { getTestQuestions, addTestQuestion, updateTestQuestion, deleteTestQuestion };