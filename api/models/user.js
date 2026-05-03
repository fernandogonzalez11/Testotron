const { getDB } = require('../controllers/db');

function createUser({ email, password, role = 'student' }) {
  const db = getDB();
  const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
  const info = stmt.run(email, password, role);
  return { id: info.lastInsertRowid, email, role };
}

function getUserById(id) {
  const db = getDB();
  return db.prepare('SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?').get(id);
}

function getUserByEmail(email) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function updateUser(id, { email, password, role }) {
  const db = getDB();
  const stmt = db.prepare('UPDATE users SET email = COALESCE(?, email), password = COALESCE(?, password), role = COALESCE(?, role), updated_at = datetime(\'now\') WHERE id = ?');
  const info = stmt.run(email, password, role, id);
  return info.changes;
}

function deleteUser(id) {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(id).changes;
}

function listUsers() {
  const db = getDB();
  return db.prepare('SELECT id, email, role, created_at FROM users ORDER BY id DESC').all();
}

module.exports = { createUser, getUserById, getUserByEmail, updateUser, deleteUser, listUsers };