const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { GroupController } = require('../controllers/group');

router.use(authMiddleware);

router.post('/', requireRole('teacher','admin'), GroupController.create);
router.get('/', requireRole('teacher','admin'), GroupController.list);
router.get('/:code', requireRole('teacher','admin','student'), GroupController.get);
router.get('/:code/detail', requireRole('teacher','admin','student'), GroupController.detail);
router.post('/:code/members', requireRole('teacher','admin'), GroupController.addMember);
router.get('/:code/members', requireRole('teacher','admin','student'), GroupController.members);
router.delete('/:code/members', requireRole('teacher','admin'), GroupController.removeMember);
router.put('/:code', requireRole('teacher','admin'), GroupController.update);
router.delete('/:code', requireRole('admin'), GroupController.delete);

module.exports = router;