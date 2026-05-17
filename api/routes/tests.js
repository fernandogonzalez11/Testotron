const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { TestController } = require('../controllers/test');
const { AttemptController } = require('../controllers/attempt');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), TestController.create);
router.get('/', requireRole('teacher','admin','student'), TestController.list);
router.get('/:code/detail', requireRole('teacher','admin','student'), TestController.detail);
router.get('/:code', requireRole('teacher','admin','student'), TestController.get);
router.post('/:code/start', requireRole('student','teacher','admin'), AttemptController.start);
router.put('/:code', requireRole('teacher','admin'), requireOwnership('test'), TestController.update);
router.delete('/:code', requireRole('teacher','admin'), requireOwnership('test'), TestController.delete);

// publish / close
router.post('/:code/publish', requireRole('teacher','admin'), requireOwnership('test'), TestController.publish);
router.post('/:code/close', requireRole('teacher','admin'), requireOwnership('test'), TestController.close);

// nested: test questions
router.use('/:code/questions', require('./test-questions'));

module.exports = router;