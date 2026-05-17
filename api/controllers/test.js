const { createTest, getTest, listTests, updateTest, deleteTest } = require('../models/test');
const { getTestQuestions } = require('../models/test-question');
const { handleError } = require('./utils');

class TestController {
  static create(req, res) {
    try {
      const owner_id = req.user && req.user.id;
      const t = createTest(Object.assign({}, req.body, { owner_id }));
      res.status(201).json({ test: t });
    } catch (err) { handleError(err, res); }
  }

  static list(req, res) {
    try {
      const q = {
        title: req.query.title,
        group_code: req.query.group_code,
        owner_id: req.query.owner_id ? Number(req.query.owner_id) : (req.user && req.user.role === 'teacher' ? req.user.id : undefined),
        status: req.query.status
      };
      const rows = listTests(q);
      res.json({ tests: rows });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) {
    try {
      const code = req.params.code;
      const t = getTest(code);
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json({ test: t });
    } catch (err) { handleError(err, res); }
  }

  static detail(req, res) {
    try {
      const code = req.params.code;
      const t = getTest(code);
      if (!t) return res.status(404).json({ error: 'Not found' });
      const qs = getTestQuestions(code);
      t.questions = qs;
      res.json({ test: t });
    } catch (err) { handleError(err, res); }
  }

  static update(req, res) {
    try {
      const code = req.params.code;
      const changes = updateTest(code, req.body);
      res.json({ updated: changes });
    } catch (err) { handleError(err, res); }
  }

  static delete(req, res) {
    try {
      const code = req.params.code;
      const changes = deleteTest(code);
      res.json({ deleted: changes });
    } catch (err) { handleError(err, res); }
  }

  static publish(req, res) {
    try {
      const code = req.params.code;
      const changes = updateTest(code, { status: 'published', published_at: new Date().toISOString() });
      res.json({ published: !!changes });
    } catch (err) { handleError(err, res); }
  }

  static close(req, res) {
    try {
      const code = req.params.code;
      const changes = updateTest(code, { status: 'closed' });
      res.json({ closed: !!changes });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { TestController };