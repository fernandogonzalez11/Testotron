const { getTestQuestions, addTestQuestion, updateTestQuestion, deleteTestQuestion } = require('../models/test-question');
const { handleError } = require('./utils');

class TestQuestionController {
  static list(req, res) {
    try {
      const testCode = req.params.code;
      const rows = getTestQuestions(testCode);
      res.json({ questions: rows });
    } catch (err) { handleError(err, res); }
  }

  static add(req, res) {
    try {
      const testCode = req.params.code;
      const id = addTestQuestion(testCode, req.body);
      res.status(201).json({ id });
    } catch (err) { handleError(err, res); }
  }

  static update(req, res) {
    try {
      const id = req.params.id;
      const changes = updateTestQuestion(id, req.body);
      res.json({ updated: changes });
    } catch (err) { handleError(err, res); }
  }

  static delete(req, res) {
    try {
      const id = req.params.id;
      const changes = deleteTestQuestion(id);
      res.json({ deleted: changes });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { TestQuestionController };