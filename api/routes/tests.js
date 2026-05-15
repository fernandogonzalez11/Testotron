const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { TestController } = require('../controllers/test');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), TestController.create);
router.get('/', requireRole('teacher','admin','student'), TestController.list);
router.get('/:code/detail', requireRole('teacher','admin','student'), TestController.detail);
router.get('/:code', requireRole('teacher','admin','student'), TestController.get);
router.put('/:code', requireRole('teacher','admin'), requireOwnership('test'), TestController.update);
router.delete('/:code', requireRole('teacher','admin'), requireOwnership('test'), TestController.delete);

module.exports = router;