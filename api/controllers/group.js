const { createGroup, getGroup, listGroups, groupDetail, addMember, removeMember, listMembers, updateGroup, deleteGroup, addMemberByEmail } = require('../models/group');
const { handleError } = require('./utils');

class GroupController {
  static create(req, res) {
    try {
      const g = createGroup({
        name: req.body.name,
        owner_id: req.user.id,
        description: req.body.description || ''
      });
      return res.status(201).json({ group: g });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static list(req, res) {
    try {
      const owner = req.query.owner_id ? Number(req.query.owner_id) : undefined;
      const rows = listGroups({ owner_id: owner });
      res.json({ groups: rows });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const code = req.params.code;
      const g = getGroup(code);
      if (!g) return res.status(404).json({ error: 'Not found' });
      res.json({ group: g });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static detail(req, res) {
    try {
      const code = req.params.code;
      const g = groupDetail(code);
      if (!g) return res.status(404).json({ error: 'Not found' });
      res.json({ group: g });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static addMember(req, res) {
    try {
      const code = req.params.code;
      const userId = Number(req.body.user_id || req.body.id);
      const changes = addMember(code, userId);
      res.json({ added: !!changes });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static members(req, res) {
    try {
      const code = req.params.code;
      const members = listMembers(code);
      res.json({ members });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static removeMember(req, res) {
    try {
      const code = req.params.code;
      const userId = Number(req.body.user_id || req.body.id);
      const changes = removeMember(code, userId);
      res.json({ removed: !!changes });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static update(req, res) {
    try {
      const code = req.params.code;
      const changes = updateGroup(code, { name: req.body.name });
      res.json({ updated: changes });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static delete(req, res) {
    try {
      const code = req.params.code;
      const changes = deleteGroup(code);
      res.json({ deleted: changes });
    } catch (err) {
      return handleError(err, res);
    }
  }
}

module.exports = { GroupController };
