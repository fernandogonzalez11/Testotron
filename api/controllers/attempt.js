const { createAttempt, getAttempt, submitAttempt } = require('../models/attempt');
const { handleError } = require('./utils');

class AttemptController {
  static start(req, res) {
    try {
      const testCode = req.params.code;
      const userId = req.user.id;
      const a = createAttempt(userId, testCode);
      res.status(201).json({ attempt: a });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) {
    try {
      const id = Number(req.params.id);
      const a = getAttempt(id);
      if (!a) return res.status(404).json({ error: 'Not found' });
      res.json({ attempt: a });
    } catch (err) { handleError(err, res); }
  }

  static submit(req, res) {
    try {
      const id = Number(req.params.id);
      const changes = submitAttempt(id);
      res.json({ submitted: !!changes });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { AttemptController };