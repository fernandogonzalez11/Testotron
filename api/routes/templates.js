const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const templateService = require('../services/template-service');
const { handleError } = require('../controllers/utils');

router.use(authMiddleware);

const createSchema = z.object({ title: z.string().min(1), description: z.string().optional(), instructions: z.string().optional(), time_limit_minutes: z.number().optional(), shuffle_questions: z.number().optional(), shuffle_answers: z.number().optional() });

router.post('/', requireRole('teacher','admin'), (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const owner_id = req.user && req.user.id;
    const t = templateService.createTemplate(Object.assign({}, data, { owner_id }));
    res.status(201).json({ template: t });
  } catch (err) { handleError(err, res); }
});

router.get('/', requireRole('teacher','admin'), (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const rows = templateService.listTemplates(req.user.id);
      return res.json({ templates: rows });
    }
    const rows = templateService.listTemplates();
    res.json({ templates: rows });
  } catch (err) { handleError(err, res); }
});

router.get('/:id', requireRole('teacher','admin'), (req, res) => {
  try {
    const t = templateService.getTemplate(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && t.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ template: t });
  } catch (err) { handleError(err, res); }
});

router.put('/:id', requireRole('teacher','admin'), requireOwnership('template'), (req, res) => {
  try {
    const info = templateService.updateTemplate(req.params.id, req.body);
    res.json({ updated: info });
  } catch (err) { handleError(err, res); }
});

router.delete('/:id', requireRole('teacher','admin'), requireOwnership('template'), (req, res) => {
  try {
    const info = templateService.deleteTemplate(req.params.id);
    res.json({ deleted: info });
  } catch (err) { handleError(err, res); }
});

module.exports = router;
