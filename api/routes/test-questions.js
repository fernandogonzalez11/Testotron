const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware, requireRole } = require('../middleware/auth');
const { TestQuestionController } = require('../controllers/test-question');

router.use(authMiddleware);

// GET /api/tests/:code/questions
router.get('/', requireRole('teacher','admin','student'), TestQuestionController.list);
// POST /api/tests/:code/questions
router.post('/', requireRole('teacher','admin'), TestQuestionController.add);
// PATCH /api/test-questions/:id
router.patch('/:id', requireRole('teacher','admin'), TestQuestionController.update);
// DELETE /api/test-questions/:id
router.delete('/:id', requireRole('teacher','admin'), TestQuestionController.delete);

module.exports = router;