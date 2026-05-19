const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { AttemptController } = require('../controllers/attempt');

router.use(authMiddleware);

// POST /api/tests/:code/start (mounted from tests router)
// GET /api/attempts/:id
router.get('/:id', requireRole('teacher','admin','student'), AttemptController.get);
// POST /api/attempts/:id/submit
router.post('/:id/submit', requireRole('student','teacher','admin'), AttemptController.submit);

module.exports = router;