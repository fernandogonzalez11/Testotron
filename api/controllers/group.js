const { z } = require('zod');
const { createGroup, getGroup, updateGroup, deleteGroup, listGroups, addMember, removeMember, listMembers, groupDetail } = require('../models/group');
const { handleError } = require('./utils');

const schemaCreate = z.object({ name: z.string().min(1), code: z.string().optional() });

class GroupController {
  static create(req, res) {
    try {
      const data = schemaCreate.parse(req.body);
      const g = createGroup(data);
      res.status(201).json({ group: g });
    } catch (err) {
      handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const g = getGroup(req.params.code);
      if (!g) return res.status(404).json({ error: 'Not found' });
      res.json({ group: g });
    } catch (err) {
      handleError(err, res);
    }
  }

  static detail(req, res) {
    try {
      const d = groupDetail(req.params.code);
      if (!d) return res.status(404).json({ error: 'Not found' });
      res.json({ group: d });
    } catch (err) { handleError(err, res); }
  }

  static list(req, res) {
    try {
      const gs = listGroups();
      res.json({ groups: gs });
    } catch (err) {
      handleError(err, res);
    }
  }

  static addMember(req, res) {
    try {
      const code = req.params.code;
      const user_id = Number(req.body.user_id);
      const changes = addMember(code, user_id);
      res.json({ added: changes });
    } catch (err) { handleError(err, res); }
  }

  static removeMember(req, res) {
    try {
      const code = req.params.code;
      const user_id = Number(req.body.user_id);
      const changes = removeMember(code, user_id);
      res.json({ removed: changes });
    } catch (err) { handleError(err, res); }
  }

  static members(req, res) {
    try {
      const m = listMembers(req.params.code);
      res.json({ members: m });
    } catch (err) { handleError(err, res); }
  }

  static update(req, res) {
    try {
      const changes = updateGroup(req.params.code, req.body);
      res.json({ updated: changes });
    } catch (err) {
      handleError(err, res);
    }
  }

  static delete(req, res) {
    try {
      const deleted = deleteGroup(req.params.code);
      res.json({ deleted });
    } catch (err) {
      handleError(err, res);
    }
  }
}

module.exports = { GroupController };