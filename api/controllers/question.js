const { createQuestion, listQuestions, getQuestion, updateQuestion, deleteQuestion } = require('../models/questions');
const { handleError } = require('./utils');

class QuestionController {
  static list(req, res) {
    try {
      const owner = req.query.owner_id ? Number(req.query.owner_id) : undefined;
      const rows = listQuestions(owner);
      res.json({ questions: rows });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const id = Number(req.params.id);
      const q = getQuestion(id);
      if (!q) return res.status(404).json({ error: 'Not found' });
      res.json({ question: q });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static create(req, res) {
    try {
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const {
        question,
        type,
        metadata,
        correct_answer,
        difficulty,
        category,
        is_public,
	source_type
      } = req.body;

      if (!question || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const id = createQuestion({
        owner_id: req.user.id,
        question,
        type,
        metadata,
        correct_answer,
        difficulty,
        category,
        is_public,
	source_type: source_type || 'bank'
      });

const createdQuestion =
  getQuestion(id);

return res.status(200).json({
  success: true,
  question: createdQuestion
});

    } catch (err) {
      return handleError(err, res);
    }
  }

static update(req, res) {

  try {

    const id =
      Number(req.params.id);

    updateQuestion(
      id,
      req.body
    );

    const updatedQuestion =
      getQuestion(id);

    return res.json({

      success: true,

      question:
        updatedQuestion
    });

  } catch (err) {

    return handleError(err, res);
  }
}

  static delete(req, res) {
    try {
      const id = Number(req.params.id);
      const changes = deleteQuestion(id);
      res.json({ deleted: changes });
    } catch (err) {
      return handleError(err, res);
    }
  }
}

module.exports = { QuestionController };
