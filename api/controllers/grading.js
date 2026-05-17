const { getDB } = require('../db');
const { updateAttemptScore } = require('../models/attempt');
const { handleError } = require('./utils');

class GradingController {
  static grade(req, res) {
    try {
      const attemptId = Number(req.params.id);
      const db = getDB();
      const row = db.prepare(`SELECT SUM(aa.pts_obtained) as obtained, SUM(tq.pts) as max_pts FROM attempt_answers aa JOIN test_questions tq ON aa.test_question_id = tq.id WHERE aa.attempt_id = ?`).get(attemptId);
      const obtained = row?.obtained || 0;
      const max = row?.max_pts || 0;
      updateAttemptScore(attemptId, obtained, max);
      res.json({ graded: true, score: obtained, max_score: max });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { GradingController };