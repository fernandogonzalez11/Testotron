const groupModel = require('../models/group');

// Thin service wrapper around models/group
// Keeps a single API surface for higher-level code (controllers/middleware)

function listGroups(options = {}) {
  const owner_id = options.owner_id;
  if (owner_id) return groupModel.listGroups(owner_id);
  return groupModel.listGroups();
}

function createGroup(data) { return groupModel.createGroup(data); }
function getGroup(code) { return groupModel.getGroup(code); }
function updateGroup(code, data) { return groupModel.updateGroup(code, data); }
function deleteGroup(code) { return groupModel.deleteGroup(code); }
function addMember(code, userId) { return groupModel.addMember(code, userId); }
function addMemberByEmail(code, email) { return groupModel.addMemberByEmail(code, email); }
function removeMember(code, userId) { return groupModel.removeMember(code, userId); }
function listMembers(code) { return groupModel.listMembers(code); }
function groupDetail(code) { return groupModel.groupDetail(code); }

module.exports = {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  addMemberByEmail,
  removeMember,
  listMembers,
  groupDetail
};
