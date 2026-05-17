// models/test.js

const { getDB } = require('../db');

function genCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function createTest({
  code,
  title,
  owner_id,
  group_code = null,
  template_id = null,
  description = '',
  instructions = '',
  status = 'draft',
  time_limit_minutes = null,
  published_at = null,
  due_at = null
}) {

  const db = getDB();

  const c = code || genCode();

  db.prepare(`
    INSERT INTO tests (
      code,
      template_id,
      owner_id,
      group_code,
      title,
      description,
      instructions,
      status,
      time_limit_minutes,
      published_at,
      due_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    c,
    template_id,
    owner_id,
    group_code,
    title,
    description,
    instructions,
    status,
    time_limit_minutes,
    published_at,
    due_at
  );

  return getTest(c);
}

function getTest(code) {

  const db = getDB();

  return db.prepare(`
    SELECT
      t.code,
      t.template_id,
      t.owner_id,
      t.group_code,
      t.title,
      t.description,
      t.instructions,
      t.status,
      t.time_limit_minutes,
      t.published_at,
      t.due_at,
      t.created_at,
      t.updated_at,
      g.name AS group_name
    FROM tests t
    LEFT JOIN groups g
      ON g.code = t.group_code
    WHERE t.code = ?
  `).get(code);
}

function updateTest(code, data) {

  const db = getDB();

  return db.prepare(`
    UPDATE tests
    SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      instructions = COALESCE(?, instructions),
      group_code = COALESCE(?, group_code),
      template_id = COALESCE(?, template_id),
      status = COALESCE(?, status),
      time_limit_minutes = COALESCE(?, time_limit_minutes),
      published_at = COALESCE(?, published_at),
      due_at = COALESCE(?, due_at),
      updated_at = datetime('now')
    WHERE code = ?
  `).run(
    data.title,
    data.description,
    data.instructions,
    data.group_code,
    data.template_id,
    data.status,
    data.time_limit_minutes,
    data.published_at,
    data.due_at,
    code
  ).changes;
}

function deleteTest(code) {

  const db = getDB();

  return db.prepare(`
    DELETE FROM tests
    WHERE code = ?
  `).run(code).changes;
}

function listTests({
  title,
  group_code,
  owner_id,
  status
} = {}) {

  const db = getDB();

  let q = `
    SELECT
      t.code,
      t.template_id,
      t.owner_id,
      t.group_code,
      t.title,
      t.description,
      t.instructions,
      t.status,
      t.time_limit_minutes,
      t.published_at,
      t.due_at,
      t.created_at,
      t.updated_at,
      g.name AS group_name
    FROM tests t
    LEFT JOIN groups g
      ON g.code = t.group_code
    WHERE 1=1
  `;

  const params = [];

  if (title) {
    q += ' AND t.title LIKE ?';
    params.push(`%${title}%`);
  }

  if (group_code) {
    q += ' AND t.group_code = ?';
    params.push(group_code);
  }

  if (owner_id) {
    q += ' AND t.owner_id = ?';
    params.push(owner_id);
  }

  if (status) {
    q += ' AND t.status = ?';
    params.push(status);
  }

  q += ' ORDER BY t.created_at DESC';

  return db.prepare(q).all(...params);
}

module.exports = {
  createTest,
  getTest,
  updateTest,
  deleteTest,
  listTests
};
