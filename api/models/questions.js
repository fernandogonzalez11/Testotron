const { getDB } = require('../db');

/*
=========================================
CREATE QUESTION
=========================================
*/

function createQuestion({

  owner_id,

  question,

  type,

  metadata = {},

  correct_answer = null,

  difficulty = 'medium',

  category = '',

  is_public = 0

}) {

  const db = getDB();

  const info = db.prepare(`
    INSERT INTO questions (

      owner_id,
      question,
      type,
      metadata,
      correct_answer,
      difficulty,
      category,
      is_public

    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(

    owner_id,

    question,

    type,

    JSON.stringify(metadata),

    JSON.stringify(correct_answer),

    difficulty,

    category,

    is_public

  );

  return info.lastInsertRowid;
}

/*
=========================================
GET QUESTION
=========================================
*/

function getQuestion(id) {

  const row = getDB()
    .prepare(`
      SELECT *
      FROM questions
      WHERE id = ?
    `)
    .get(id);

  if (!row) return null;

  return {

    ...row,

    metadata: row.metadata
      ? JSON.parse(row.metadata)
      : {},

    correct_answer: row.correct_answer
      ? JSON.parse(row.correct_answer)
      : null

  };
}

/*
=========================================
UPDATE QUESTION
=========================================
*/

function updateQuestion(id, {

  question,
  type,
  metadata,
  correct_answer,
  difficulty,
  category,
  is_public

}) {

  return getDB().prepare(`
    UPDATE questions
    SET

      question = COALESCE(?, question),

      type = COALESCE(?, type),

      metadata = COALESCE(?, metadata),

      correct_answer = COALESCE(?, correct_answer),

      difficulty = COALESCE(?, difficulty),

      category = COALESCE(?, category),

      is_public = COALESCE(?, is_public),

      updated_at = datetime('now')

    WHERE id = ?
  `).run(

    question,

    type,

    metadata
      ? JSON.stringify(metadata)
      : null,

    correct_answer !== undefined
      ? JSON.stringify(correct_answer)
      : null,

    difficulty,

    category,

    is_public,

    id

  ).changes;
}

/*
=========================================
DELETE QUESTION
=========================================
*/

function deleteQuestion(id) {

  return getDB()
    .prepare(`
      DELETE FROM questions
      WHERE id = ?
    `)
    .run(id)
    .changes;
}

/*
=========================================
LIST QUESTIONS
=========================================
*/

function listQuestions(owner_id) {

  const rows = owner_id

    ? getDB()
        .prepare(`
          SELECT *
          FROM questions
          WHERE owner_id = ?
          ORDER BY created_at DESC
        `)
        .all(owner_id)

    : getDB()
        .prepare(`
          SELECT *
          FROM questions
          ORDER BY created_at DESC
        `)
        .all();

  return rows.map((row) => ({

    ...row,

    metadata: row.metadata
      ? JSON.parse(row.metadata)
      : {},

    correct_answer: row.correct_answer
      ? JSON.parse(row.correct_answer)
      : null

  }));
}

module.exports = {

  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  listQuestions

};
