const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { QuestionController } = require('../controllers/question');

router.use(authMiddleware);

// GET /api/questions
router.get('/', QuestionController.list);
// GET /api/questions/:id
router.get('/:id', QuestionController.get);
// POST /api/questions
router.post('/', requireRole('teacher','admin'), QuestionController.create);
// PATCH /api/questions/:id
router.patch('/:id', requireRole('teacher','admin'), QuestionController.update);
// DELETE /api/questions/:id
router.delete('/:id', requireRole('teacher','admin'), QuestionController.delete);

module.exports = router;
