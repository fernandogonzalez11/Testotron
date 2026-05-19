// models/test.js

const { getDB } = require('../db');

function genCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function createTest(data) {

const db = getDB();

  const stmt = db.prepare(`
    INSERT INTO tests (
      code,
      template_id,
      owner_id,
      group_code,
      title,
      description,
      instructions,
      status,
      category,
      time_limit_minutes,
      min_score,
      show_answers,
      allow_retries,
      settings,
      shuffle_questions,
      shuffle_answers
    )
    VALUES (
      @code,
      @template_id,
      @owner_id,
      @group_code,
      @title,
      @description,
      @instructions,
      @status,
      @category,
      @time_limit_minutes,
      @min_score,
      @show_answers,
      @allow_retries,
      @settings,
      @shuffle_questions,
      @shuffle_answers
    )
  `);

  stmt.run(data);

  return data;
}

function addTestQuestion(data) {

const db = getDB();

  const stmt = db.prepare(`
    INSERT INTO test_questions (
      test_code,
      original_question_id,
      section_title,
      position,
      question,
      type,
      metadata,
      correct_answer,
      pts
    )
    VALUES (
      @test_code,
      @original_question_id,
      @section_title,
      @position,
      @question,
      @type,
      @metadata,
      @correct_answer,
      @pts
    )
  `);

  stmt.run(data);
}

function getTest(code) {

const db = getDB();

  const test =
    db.prepare(`
      SELECT *
      FROM tests
      WHERE code = ?
    `)
    .get(code);

  if (!test) {
    return null;
  }

  const questions =
    db.prepare(`
      SELECT *
      FROM test_questions
      WHERE test_code = ?
      ORDER BY position ASC
    `)
    .all(code);

  return {
    ...test,
    questions: questions.map(q => ({
      ...q,
      metadata: safeJson(q.metadata),
      correct_answer: safeJson(q.correct_answer)
    }))
  };
}


function updateTest(code, data) {

const db = getDB();

  db.prepare(`
    UPDATE tests
    SET
      group_code = @group_code,
      title = @title,
      description = @description,
      instructions = @instructions,
      status = @status,
      category = @category,
      time_limit_minutes = @time_limit_minutes,
      min_score = @min_score,
      show_answers = @show_answers,
      allow_retries = @allow_retries,
      settings = @settings,
      shuffle_questions = @shuffle_questions,
      shuffle_answers = @shuffle_answers,
      updated_at = datetime('now')
    WHERE code = @code
  `).run({
    ...data,
    code
  });
}

function clearTestQuestions(code) {

const db = getDB();

  db.prepare(`
    DELETE FROM test_questions
    WHERE test_code = ?
  `).run(code);
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
      g.name AS group_name,
      t.shuffle_questions,
      t.shuffle_answers
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

function safeJson(value) {

const db = getDB();

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

module.exports = {
  createTest,
  getTest,
  updateTest,
  deleteTest,
  listTests,
  addTestQuestion,
  clearTestQuestions
};
