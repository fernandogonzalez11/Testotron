const express = require('express');
const controller = require('../controllers/profile');

module.exports = function(baseContext) {

  const router = express.Router();

  router.get(
    '/',
    (req, res) =>
      controller.profilePage(req, res, baseContext)
  );

  return router;
};
