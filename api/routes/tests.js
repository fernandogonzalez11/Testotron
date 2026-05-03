const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { TestController } = require('../controllers/test');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), TestController.create);
router.get('/', requireRole('teacher','admin','student'), TestController.list);
router.get('/:code', requireRole('teacher','admin','student'), TestController.get);
router.put('/:code', requireRole('teacher','admin'), TestController.update);
router.delete('/:code', requireRole('admin'), TestController.delete);

module.exports = router;