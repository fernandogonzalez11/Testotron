const { z } = require('zod');
const { createItem, getItem, updateItem, deleteItem, listItems } = require('../models/item');
const { handleError } = require('./utils');

const schema = z.object({ question: z.string().min(1), answer: z.string().optional(), type: z.string().min(1), pts: z.number().int().min(0).optional(), section_id: z.number().int() });

class ItemController {
  static create(req, res) {
    try {
      const data = schema.parse(req.body);
      const it = createItem(data);
      res.status(201).json({ item: it });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) { try { const it = getItem(Number(req.params.id)); if (!it) return res.status(404).json({ error: 'Not found' }); res.json({ item: it }); } catch (err) { handleError(err, res); } }
  static list(req, res) { try { const items = listItems(req.query.section); res.json({ items }); } catch (err) { handleError(err, res); } }
  static update(req, res) { try { const changes = updateItem(Number(req.params.id), req.body); res.json({ updated: changes }); } catch (err) { handleError(err, res); } }
  static delete(req, res) { try { const deleted = deleteItem(Number(req.params.id)); res.json({ deleted }); } catch (err) { handleError(err, res); } }
}

module.exports = { ItemController };