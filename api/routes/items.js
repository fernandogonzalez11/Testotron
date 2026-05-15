const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { ItemController } = require('../controllers/item');

router.use(authMiddleware);

// create: ensure teacher owns the parent section/test
router.post('/', requireRole('teacher','admin'), requireOwnership('section'), ItemController.create);
router.get('/', requireRole('teacher','admin','student'), ItemController.list);
router.get('/:id', requireRole('teacher','admin','student'), ItemController.get);
router.put('/:id', requireRole('teacher','admin'), requireOwnership('item'), ItemController.update);
router.delete('/:id', requireRole('teacher','admin'), requireOwnership('item'), ItemController.delete);

module.exports = router;