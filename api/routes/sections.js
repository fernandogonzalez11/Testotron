const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { SectionController } = require('../controllers/section');

router.use(authMiddleware);

// create: test owner only
router.post('/', requireRole('teacher','admin'), requireOwnership('test'), SectionController.create);
router.get('/', requireRole('teacher','admin','student'), SectionController.list);
router.get('/:id', requireRole('teacher','admin','student'), SectionController.get);
router.put('/:id', requireRole('teacher','admin'), requireOwnership('section'), SectionController.update);
router.delete('/:id', requireRole('teacher','admin'), requireOwnership('section'), SectionController.delete);

module.exports = router;
module.exports = router;