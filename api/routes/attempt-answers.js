const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { AnswerController } = require('../controllers/answer');

router.use(authMiddleware);

// POST /answers : submit attempt
router.post('/', requireRole('student','teacher','admin'), AnswerController.submit);
// GET /answers/results - aggregated teacher results
router.get('/results', requireRole('teacher','admin'), AnswerController.results);
// GET /answers
router.get('/', requireRole('teacher','admin'), AnswerController.list);
// GET /answers/:id
router.get('/:id', requireRole('teacher','admin','student'), AnswerController.get);

module.exports = router;