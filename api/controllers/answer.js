const { upsertAttemptAnswer, getAttemptAnswers, listAttemptAnswers, listTeacherResults } = require('../models/attempt-answer');
const { handleError } = require('./utils');

class AnswerController {
  // Submit answers for an attempt (array of answers)
  static submit(req, res) {
    try {
      const { attempt_id, answers } = req.body;
      if (!attempt_id || !Array.isArray(answers)) return res.status(400).json({ error: 'Missing attempt_id or answers' });
      for (const a of answers) {
        const test_question_id = Number(a.test_question_id || a.question_id);
        const response = a.response !== undefined ? a.response : null;
        const pts_obtained = a.pts_obtained !== undefined ? Number(a.pts_obtained) : 0;
        const feedback = a.feedback || null;
        upsertAttemptAnswer({ attempt_id: Number(attempt_id), test_question_id, response, pts_obtained, feedback, graded_by: req.user && req.user.id });
      }
      res.json({ success: true });
    } catch (err) { handleError(err, res); }
  }

  static list(req, res) {
    try {
      const filters = {};
      if (req.query.test_code) filters.test_code = req.query.test_code;
      if (req.query.attempt_id) filters.attempt_id = Number(req.query.attempt_id);
      if (req.query.user_id) filters.user_id = Number(req.query.user_id);
      const rows = listAttemptAnswers(filters);
      res.json({ answers: rows });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) {
    try {
      const id = Number(req.params.id);
      const rows = getAttemptAnswers(id);
      if (!rows) return res.status(404).json({ error: 'Not found' });
      res.json({ answers: rows });
    } catch (err) { handleError(err, res); }
  }

  static results(req, res) {
    try {
      const filters = {};
      if (req.query.owner_id) filters.owner_id = Number(req.query.owner_id);
      if (req.query.group_code) filters.group_code = req.query.group_code;
      if (req.query.test_code) filters.test_code = req.query.test_code;
      const rows = listTeacherResults(filters);
      res.json({ results: rows });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { AnswerController };