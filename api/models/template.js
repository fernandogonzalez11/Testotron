const { getDB } = require('../db');

function createTemplate(data) {

  const db = getDB();

  db.prepare(`
    INSERT INTO quiz_templates (
      owner_id,
      title,
      description,
      instructions,
      time_limit_minutes,
      shuffle_questions,
      shuffle_answers
    )
    VALUES (
      @owner_id,
      @title,
      @description,
      @instructions,
      @time_limit_minutes,
      @shuffle_questions,
      @shuffle_answers
    )
  `).run(data);

  return db
    .prepare(`
      SELECT last_insert_rowid() id
    `)
    .get().id;
}

function createTemplateSection(data) {

  const db = getDB();

  const result = db.prepare(`
    INSERT INTO template_sections (
      template_id,
      title,
      description,
      position
    )
    VALUES (
      @template_id,
      @title,
      @description,
      @position
    )
  `).run(data);

  return result.lastInsertRowid;
}

function addTemplateQuestion(data) {

  const db = getDB();

  db.prepare(`
    INSERT INTO template_questions (
      template_section_id,
      question_id,
      position,
      pts,
      required
    )
    VALUES (
      @template_section_id,
      @question_id,
      @position,
      @pts,
      @required
    )
  `).run(data);
}

function getTemplate(id) {

  const db = getDB();

  const template =
    db.prepare(`
      SELECT *
      FROM quiz_templates
      WHERE id = ?
    `).get(id);

  if (!template) {
    return null;
  }

  const questions =
    db.prepare(`
      SELECT
        tq.*,
        q.question,
        q.type
      FROM template_questions tq
      JOIN questions q
        ON q.id = tq.question_id
      JOIN template_sections ts
        ON ts.id = tq.template_section_id
      WHERE ts.template_id = ?
      ORDER BY tq.position ASC
    `).all(id);

  template.questions =
    questions;

  return template;
}

function updateTemplate(id, data) {

  const db = getDB();

  return db.prepare(`
    UPDATE quiz_templates
    SET
      title = @title,
      description = @description,
      instructions = @instructions,
      time_limit_minutes = @time_limit_minutes,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    ...data,
    id
  }).changes;
}

function deleteTemplate(id) {

  const db = getDB();

  return db.prepare(`
    DELETE FROM quiz_templates
    WHERE id = ?
  `).run(id).changes;
}

module.exports = {
  createTemplate,
  createTemplateSection,
  addTemplateQuestion,
getTemplate,
updateTemplate,
deleteTemplate
};
