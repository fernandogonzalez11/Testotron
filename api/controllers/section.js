const { z } = require('zod');
const { createSection, getSection, updateSection, deleteSection, listSections } = require('../models/section');
const { handleError } = require('./utils');

const schema = z.object({ name: z.string().min(1), test_code: z.string().min(1) });

class SectionController {
  static create(req, res) {
    try {
      const data = schema.parse(req.body);
      const s = createSection(data);
      res.status(201).json({ section: s });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) {
    try {
      const s = getSection(Number(req.params.id));
      if (!s) return res.status(404).json({ error: 'Not found' });
      res.json({ section: s });
    } catch (err) { handleError(err, res); }
  }

  static list(req, res) {
    try {
      const s = listSections(req.query.test);
      res.json({ sections: s });
    } catch (err) { handleError(err, res); }
  }

  static update(req, res) {
    try {
      const changes = updateSection(Number(req.params.id), req.body);
      res.json({ updated: changes });
    } catch (err) { handleError(err, res); }
  }

  static delete(req, res) {
    try {
      const deleted = deleteSection(Number(req.params.id));
      res.json({ deleted });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { SectionController };