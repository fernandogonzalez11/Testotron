const express = require('express');
const controller = require('../controllers/admin');

module.exports = function(baseContext) {

  const router = express.Router();

  router.get(
    '/management',
    (req, res) =>
      controller.adminPage(req, res, baseContext)
  );

  return router;

};

