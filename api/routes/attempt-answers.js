const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { AnswerController } = require('../controllers/answer');

router.use(authMiddleware);

// POST /api/attempt-answers : submit attempt answers
router.post('/', requireRole('student','teacher','admin'), AnswerController.submit);
// GET /api/attempt-answers/results - aggregated teacher results
router.get('/results', requireRole('teacher','admin'), AnswerController.results);
// GET /api/attempt-answers
router.get('/', requireRole('teacher','admin'), AnswerController.list);
// GET /api/attempt-answers/:id
router.get('/:id', requireRole('teacher','admin','student'), AnswerController.get);

module.exports = router;
