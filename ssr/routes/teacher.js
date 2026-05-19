const express = require('express');
const controller = require('../controllers/teacher');

module.exports = function(baseContext) {

  const router = express.Router();
  
  router.get(
    '/quizzes',
    (req, res) =>
      controller.teacherQuizzesPage(req, res, baseContext)
  );

  router.get(
    '/questions',
    (req, res) =>
      controller.questionsPage(req, res, baseContext)
  );

  router.get(
    '/templates',
    (req, res) =>
      controller.templatesPage(req, res, baseContext)
  );

router.get(
  '/templates/edit/:id',
  (req, res) =>
    controller.editTemplatePage(req, res, baseContext)
);

  router.get(
    '/quizzes/create',
    (req, res) =>
      controller.createQuizPage(req, res, baseContext)
  );

  router.get(
    '/results',
    (req, res) =>
      controller.quizzesResultsPage(req, res, baseContext)
  );

router.get(
  '/quizzes/edit/:code',
  (req, res) =>
    controller.editQuizPage(req, res, baseContext)
);

router.get(
  '/quizzes/view/:code',
  (req, res) =>
    controller.viewQuizPage(req, res, baseContext)
);

  return router;
};
