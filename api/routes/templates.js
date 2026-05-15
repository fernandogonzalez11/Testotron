const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { z } = require('zod');
const { getDB } = require('../controllers/db');
const { handleError } = require('../controllers/utils');

router.use(authMiddleware);

// minimal template CRUD using DB directly
router.post('/', requireRole('teacher','admin'), (req, res) => {
  try {
    const schema = z.object({ name: z.string().min(1) });
    const data = schema.parse(req.body);
    const db = getDB();
    const user_id = req.user.id;
    const info = db.prepare('INSERT INTO templates (name, user_id) VALUES (?, ?)').run(data.name, user_id);
    res.status(201).json({ id: info.lastInsertRowid, name: data.name, user_id });
  } catch (err) { handleError(err, res); }
});

router.get('/', requireRole('teacher','admin'), (req, res) => {
  try {
    const db = getDB();
    if (req.user.role !== 'admin') {
      const rows = db.prepare('SELECT * FROM templates WHERE user_id = ?').all(req.user.id);
      return res.json({ templates: rows });
    }
    const rows = db.prepare('SELECT * FROM templates').all();
    res.json({ templates: rows });
  } catch (err) { handleError(err, res); }
});

router.get('/:id', requireRole('teacher','admin'), (req, res) => {
  try {
    const db = getDB();
    const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && t.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ template: t });
  } catch (err) { handleError(err, res); }
});

router.put('/:id', requireRole('teacher','admin'), (req, res) => {
  try {
    const db = getDB();
    const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && t.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const info = db.prepare("UPDATE templates SET name = COALESCE(?, name), updated_at = datetime('now') WHERE id = ?").run(req.body.name, Number(req.params.id));
    res.json({ updated: info.changes });
  } catch (err) { handleError(err, res); }
});

router.delete('/:id', requireRole('teacher','admin'), (req, res) => {
  try {
    const db = getDB();
    const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && t.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const info = db.prepare('DELETE FROM templates WHERE id = ?').run(Number(req.params.id));
    res.json({ deleted: info.changes });
  } catch (err) { handleError(err, res); }
});

module.exports = router;