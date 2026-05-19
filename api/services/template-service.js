const templateModel = require('../models/quiz-template');

function createTemplate(data) { return templateModel.createTemplate(data); }
function getTemplate(id) { return templateModel.getTemplateById(id); }
function listTemplates(owner_id) { return templateModel.listTemplates(owner_id); }
function updateTemplate(id, data) { return templateModel.updateTemplate(id, data); }
function deleteTemplate(id) { return templateModel.deleteTemplate(id); }
function getOwnerId(id) { return templateModel.getOwnerId(id); }

module.exports = { createTemplate, getTemplate, listTemplates, updateTemplate, deleteTemplate, getOwnerId };
