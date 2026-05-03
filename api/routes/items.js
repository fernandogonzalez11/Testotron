const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { ItemController } = require('../controllers/item');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), ItemController.create);
router.get('/', requireRole('teacher','admin','student'), ItemController.list);
router.get('/:id', requireRole('teacher','admin','student'), ItemController.get);
router.put('/:id', requireRole('teacher','admin'), ItemController.update);
router.delete('/:id', requireRole('admin'), ItemController.delete);

module.exports = router;