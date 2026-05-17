const express = require('express');
const groupsController = require('../controllers/groups');

module.exports = function(baseContext) {
  const router = express.Router();

  // list groups
  router.get('/', (req, res) => groupsController.groupsPage(req, res, baseContext));

// group detail
  router.get('/:id', (req, res) => groupsController.groupDetail(req, res, baseContext));

  return router;
};
