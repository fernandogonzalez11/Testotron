const { getDB } = require('../controllers/db');

function requireOwnership(resource) {
  return function (req, res, next) {
    try {
      const db = getDB();
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      if (user.role === 'admin') return next();

      let ownerId = null;
      if (resource === 'group') {
        const code = req.params.code || req.body.code;
        const r = db.prepare('SELECT owner_id FROM groups WHERE code = ?').get(code);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else if (resource === 'test') {
        const code = req.params.code || req.body.code || req.params.test_code || req.body.test_code;
        const r = db.prepare('SELECT owner_id FROM tests WHERE code = ?').get(code);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else if (resource === 'template') {
        const id = Number(req.params.id || req.body.id);
        const r = db.prepare('SELECT user_id as owner_id FROM templates WHERE id = ?').get(id);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else if (resource === 'section') {
        const id = Number(req.params.id || req.body.id || req.params.section_id || req.body.section_id);        const r = db.prepare('SELECT t.owner_id FROM sections s JOIN tests t ON t.code = s.test_code WHERE s.id = ?').get(id);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else if (resource === 'item') {
        const id = Number(req.params.id || req.body.id || req.params.item_id || req.body.item_id);
        const r = db.prepare('SELECT t.owner_id FROM items i JOIN sections s ON s.id = i.section_id JOIN tests t ON t.code = s.test_code WHERE i.id = ?').get(id);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else if (resource === 'answer') {
        // answers -> verify the test's owner
        const id = Number(req.params.id || req.body.id);
        const r = db.prepare('SELECT t.owner_id FROM answers a JOIN tests t ON t.code = a.test_code WHERE a.id = ?').get(id);
        if (!r) return res.status(404).json({ error: 'Not found' });
        ownerId = r.owner_id;
      } else {
        return res.status(500).json({ error: 'Unknown resource for ownership check' });
      }

      if (ownerId !== user.id) return res.status(403).json({ error: 'Forbidden: not the owner' });
      next();
    } catch (err) {
      console.error('[requireOwnership] error', err);
      res.status(500).json({ error: 'Internal error' });
    }
  };
}

module.exports = { requireOwnership };