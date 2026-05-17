const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { QuestionController } = require('../controllers/question');

router.use(authMiddleware);

// POST /api/questions
router.post('/', requireRole('teacher','admin'), QuestionController.create);

module.exports = router;
