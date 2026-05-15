const { z } = require('zod');
const { createTest, getTest, updateTest, deleteTest, listTests } = require('../models/test');
const { listSections } = require('../models/section');
const { listItems } = require('../models/item');
const { handleError } = require('./utils');

const schemaCreate = z.object({ name: z.string().min(1), code: z.string().optional(), group_code: z.string().optional() });

class TestController {
  static create(req, res) {
    try {
      const data = schemaCreate.parse(req.body);
      const owner_id = req.user && req.user.id;
      const t = createTest(Object.assign({}, data, { owner_id }));
      res.status(201).json({ test: t });
    } catch (err) {
      handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const t = getTest(req.params.code);
      if (!t) return res.status(404).json({ error: 'Not found' });
      // authorization: teacher may only view own tests
      if (req.user.role === 'teacher' && t.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      if (req.user.role === 'student') {
        // verify the student belongs to a group that gives access or test group is null (public)
        const db = require('./db').getDB();
        const g = db.prepare('SELECT 1 FROM user_groups ug WHERE ug.user_id = ? AND ug.group_code = ?').get(req.user.id, t.group_code);
        if (!g) return res.status(403).json({ error: 'Forbidden' });
      }
      res.json({ test: t });
    } catch (err) {
      handleError(err, res);
    }
  }

  static list(req, res) {
    try {
      const q = { name: req.query.name, group_code: req.query.group };
      if (req.user.role === 'teacher') {
        q.owner_id = req.user.id;
      }
      if (req.user.role === 'student') {
        // return tests assigned to student's groups
        const db = require('./db').getDB();
        const rows = db.prepare('SELECT t.code, t.name, t.group_code FROM tests t JOIN user_groups ug ON ug.group_code = t.group_code WHERE ug.user_id = ?').all(req.user.id);
        return res.json({ tests: rows });
      }
      const ts = listTests(q);
      res.json({ tests: ts });
    } catch (err) {
      handleError(err, res);
    }
  }
  static update(req, res) {
    try {
      const changes = updateTest(req.params.code, req.body);
      res.json({ updated: changes });
    } catch (err) {
      handleError(err, res);
    }
  }

  static delete(req, res) {
    try {
      const deleted = deleteTest(req.params.code);
      res.json({ deleted });
    } catch (err) {
      handleError(err, res);
    }
  }

  // aggregated detail: test + sections + items
  static detail(req, res) {
    try {
      const code = req.params.code;
      const t = getTest(code);
      if (!t) return res.status(404).json({ error: 'Not found' });
      const sections = listSections(code);
      const sectionsWithItems = sections.map(s => {
        const items = listItems(s.id);
        return Object.assign({}, s, { items });
      });
      res.json({ test: t, sections: sectionsWithItems });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { TestController };
module.exports = { TestController };