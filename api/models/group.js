const { getDB } = require('../controllers/db');

function genCode() {
  return Math.random().toString(36).slice(2,10).toUpperCase();
}

function createGroup({ code, name }) {
  const db = getDB();
  const c = code || genCode();
  db.prepare('INSERT INTO groups (code, name) VALUES (?, ?)').run(c, name);
  return { code: c, name };
}

function getGroup(code) {
  const db = getDB();
  return db.prepare('SELECT code, name, created_at, updated_at FROM groups WHERE code = ?').get(code);
}

function updateGroup(code, { name }) {
  const db = getDB();
  const info = db.prepare('UPDATE groups SET name = COALESCE(?, name), updated_at = datetime(\'now\') WHERE code = ?').run(name, code);
  return info.changes;
}

function deleteGroup(code) {
  const db = getDB();
  return db.prepare('DELETE FROM groups WHERE code = ?').run(code).changes;
}

function listGroups() {
  const db = getDB();
  return db.prepare('SELECT code, name, created_at FROM groups ORDER BY created_at DESC').all();
}

function addMember(group_code, user_id) {
  const db = getDB();
  return db.prepare('INSERT OR REPLACE INTO user_groups (user_id, group_code) VALUES (?, ?)').run(user_id, group_code).changes;
}

function removeMember(group_code, user_id) {
  const db = getDB();
  return db.prepare('DELETE FROM user_groups WHERE user_id = ? AND group_code = ?').run(user_id, group_code).changes;
}

function listMembers(group_code) {
  const db = getDB();
  return db.prepare('SELECT u.id, u.email, u.role, u.created_at FROM user_groups ug JOIN users u ON u.id = ug.user_id WHERE ug.group_code = ?').all(group_code);
}

function groupDetail(code) {
  const db = getDB();
  const g = db.prepare('SELECT code, name, created_at, updated_at FROM groups WHERE code = ?').get(code);
  if (!g) return null;
  const members = listMembers(code);
  const quizzes = db.prepare('SELECT code, name FROM tests WHERE group_code = ?').all(code);
  // average performance per group: compute average score of answers linked to tests of this group
  const avg = db.prepare(`SELECT AVG(score_pct) as avg_score FROM (
    SELECT a.id, SUM(ax.pts_obtained) as obtained, SUM(i.pts) as max_pts, (CASE WHEN SUM(i.pts)=0 THEN 0 ELSE ROUND( (SUM(ax.pts_obtained)*100.0)/SUM(i.pts),2) END) as score_pct
    FROM answers a
    JOIN answerxitem ax ON ax.answer_id = a.id
    JOIN items i ON i.id = ax.item_id
    JOIN tests t ON t.code = a.test_code
    WHERE t.group_code = ?
    GROUP BY a.id
  )`).get(code);

  g.members = members;
  g.quizzes = quizzes;
  g.avg_score = avg ? avg.avg_score : null;
  return g;
}

module.exports = { createGroup, getGroup, updateGroup, deleteGroup, listGroups, addMember, removeMember, listMembers, groupDetail };