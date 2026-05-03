const { getDB } = require('../controllers/db');

function createAnswer({ user_id, test_code }) {
  const db = getDB();
  const info = db.prepare('INSERT INTO answers (user_id, test_code) VALUES (?, ?)').run(user_id, test_code);
  return { id: info.lastInsertRowid, user_id, test_code };
}

function addAnswerItem({ answer_id, item_id, pts_obtained = 0, feedback = null }) {
  const db = getDB();
  db.prepare('INSERT INTO answerxitem (answer_id, item_id, pts_obtained, feedback) VALUES (?, ?, ?, ?)').run(answer_id, item_id, pts_obtained, feedback);
  return { answer_id, item_id, pts_obtained, feedback };
}

function getAnswer(id) {
  const db = getDB();
  const ans = db.prepare('SELECT a.*, u.email as student_email, t.name as test_name, t.group_code FROM answers a JOIN users u ON u.id = a.user_id JOIN tests t ON t.code = a.test_code WHERE a.id = ?').get(id);
  if (!ans) return null;
  const items = db.prepare('SELECT ax.item_id, ax.pts_obtained, ax.feedback, i.question, i.answer as correct_answer, i.pts as max_pts FROM answerxitem ax JOIN items i ON i.id = ax.item_id WHERE ax.answer_id = ?').all(id);
  ans.items = items;
  return ans;
}

function listAnswers(filters = {}) {
  const db = getDB();
  let q = 'SELECT a.id, a.user_id, u.email as student_email, a.test_code, t.name as test_name, a.created_at FROM answers a JOIN users u ON u.id = a.user_id JOIN tests t ON t.code = a.test_code WHERE 1=1';
  const params = [];
  if (filters.user_id) { q += ' AND a.user_id = ?'; params.push(filters.user_id); }
  if (filters.test_code) { q += ' AND a.test_code = ?'; params.push(filters.test_code); }
  if (filters.group_code) { q += ' AND t.group_code = ?'; params.push(filters.group_code); }
  return db.prepare(q).all(...params);
}

function listResults(filters = {}) {
  const db = getDB();
  // filters: student_email (partial), group_code, test_code
  let q = `SELECT a.id as answer_id, u.id as student_id, u.email as student_email, t.code as test_code, t.name as test_name, t.group_code, a.created_at
    FROM answers a
    JOIN users u ON u.id = a.user_id
    JOIN tests t ON t.code = a.test_code
    WHERE 1=1`;
  const params = [];
  if (filters.student_email) { q += ' AND u.email LIKE ?'; params.push('%' + filters.student_email + '%'); }
  if (filters.group_code) { q += ' AND t.group_code = ?'; params.push(filters.group_code); }
  if (filters.test_code) { q += ' AND t.code = ?'; params.push(filters.test_code); }
  const rows = db.prepare(q).all(...params);

  // compute score for each answer
  const out = rows.map(r => {
    const items = db.prepare('SELECT ax.pts_obtained, i.pts as max_pts FROM answerxitem ax JOIN items i ON i.id = ax.item_id WHERE ax.answer_id = ?').all(r.answer_id);
    let obtained = 0, max = 0;
    for (const it of items) { obtained += it.pts_obtained; max += it.max_pts; }
    const pct = max ? Math.round((obtained / max) * 100) : 0;
    return { answer_id: r.answer_id, student_id: r.student_id, student_email: r.student_email, test_code: r.test_code, test_name: r.test_name, group_code: r.group_code, date: r.created_at, score_pct: pct };
  });

  return out;
}

module.exports = { createAnswer, addAnswerItem, getAnswer, listAnswers, listResults };