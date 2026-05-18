const express = require('express');
const controller = require('../controllers/student');

module.exports = function(baseContext) {

  const router = express.Router();

  router.get(
    '/quizzes',
    (req, res) =>
      controller.studentQuizzesPage(req, res, baseContext)
  );

  return router;
};
