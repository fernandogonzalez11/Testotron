const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { SectionController } = require('../controllers/section');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), SectionController.create);
router.get('/', requireRole('teacher','admin','student'), SectionController.list);
router.get('/:id', requireRole('teacher','admin','student'), SectionController.get);
router.put('/:id', requireRole('teacher','admin'), SectionController.update);
router.delete('/:id', requireRole('admin'), SectionController.delete);

module.exports = router;