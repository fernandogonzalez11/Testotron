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
      const t = createTest(data);
      res.status(201).json({ test: t });
    } catch (err) {
      handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const t = getTest(req.params.code);
      if (!t) return res.status(404).json({ error: 'Not found' });
      res.json({ test: t });
    } catch (err) {
      handleError(err, res);
    }
  }

  static list(req, res) {
    try {
      const q = { name: req.query.name, group_code: req.query.group };
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