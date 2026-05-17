const { createQuestion, listQuestions, getQuestion, updateQuestion, deleteQuestion } = require('../models/questions');
const { handleError } = require('./utils');

class QuestionController {
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
        is_public
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
        is_public
      });

      return res.status(201).json({ success: true, id });
    } catch (err) {
      return handleError(err, res);
    }
  }

  // Additional thin handlers can be added here if needed (list/get/update/delete)
}

module.exports = { QuestionController };
