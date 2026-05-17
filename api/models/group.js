const { getDB } = require('../db');
const { getUserByEmail } = require('./user');

function genCode() {
  return Math.random().toString(36).slice(2,10).toUpperCase();
}

function createGroup({ code, name, owner_id, description }) {
  const db = getDB();
  const c = code || genCode();
  db.prepare('INSERT INTO groups (code, name, owner_id, description) VALUES (?, ?, ?, ?)').run(c, name, owner_id, description);
  return { code: c, name, owner_id, description };
}

function getGroup(code) {
  const db = getDB();
  return db.prepare('SELECT code, name, owner_id, created_at, updated_at FROM groups WHERE code = ?').get(code);
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

function listGroups({ owner_id } = {}) {
  const db = getDB();
  if (owner_id) return db.prepare('SELECT code, name, owner_id, created_at FROM groups WHERE owner_id = ? ORDER BY created_at DESC').all(owner_id);
  return db.prepare('SELECT code, name, owner_id, created_at FROM groups ORDER BY created_at DESC').all();
}

function addMember(group_code, user_id) {
  const db = getDB();

  const exists = db.prepare(`
    SELECT 1
    FROM user_groups
    WHERE user_id = ?
    AND group_code = ?
  `).get(user_id, group_code);

  if (exists) {
    return 0;
  }

  const info = db.prepare(`
    INSERT INTO user_groups (
      user_id,
      group_code
    )
    VALUES (?, ?)
  `).run(user_id, group_code);

  return info.changes;
}

function removeMember(group_code, user_id) {
  const db = getDB();
  return db.prepare('DELETE FROM user_groups WHERE user_id = ? AND group_code = ?').run(user_id, group_code).changes;
}

function listMembers(group_code) {
  const db = getDB();
  return db.prepare('SELECT u.id, u.name, u.email, u.role, u.created_at FROM user_groups ug JOIN users u ON u.id = ug.user_id WHERE ug.group_code = ?').all(group_code);
}

function addMemberByEmail(group_code, email) {

  const db = getDB();

  // verify user exists
  const user = getUserByEmail(email);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // verify already inside group
  const exists = db.prepare(`
    SELECT 1
    FROM user_groups
    WHERE user_id = ?
    AND group_code = ?
  `).get(user.id, group_code);

  if (exists) {
    throw new Error('El usuario ya pertenece al grupo');
  }

  // insert membership
  db.prepare(`
    INSERT INTO user_groups (
      user_id,
      group_code
    )
    VALUES (?, ?)
  `).run(user.id, group_code);

  return user;
}

function groupDetail(code) {

  const db = getDB();

  const g = db.prepare(`
    SELECT *
    FROM groups
    WHERE code = ?
  `).get(code);

  if (!g) return null;

  const members = listMembers(code);

  const quizzes = db.prepare(`
    SELECT *
    FROM tests
    WHERE group_code = ?
    ORDER BY created_at DESC
  `).all(code);

  /*
  =====================================
  GROUP AVERAGE SCORE
  =====================================

  attempts.score already exists.
  Use it directly.
  */

  const avg = db.prepare(`
    SELECT AVG(score) as avg_score
    FROM attempts a
    JOIN tests t
      ON t.code = a.test_code
    WHERE t.group_code = ?
      AND a.status IN ('submitted', 'graded')
  `).get(code);

  g.members = members;
  g.quizzes = quizzes;
  g.avg_score = avg?.avg_score || 0;

  return g;
}

module.exports = { createGroup, getGroup, updateGroup, deleteGroup, listGroups, addMember, removeMember, listMembers, groupDetail, addMemberByEmail};
