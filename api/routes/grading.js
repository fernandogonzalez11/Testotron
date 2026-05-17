const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { GradingController } = require('../controllers/grading');

router.use(authMiddleware);

// POST /api/attempts/:id/grade
router.post('/:id/grade', requireRole('teacher','admin'), GradingController.grade);

module.exports = router;