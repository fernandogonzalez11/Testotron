const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { GroupController } = require('../controllers/group');

router.use(authMiddleware);

// create: teacher must own created group
router.post('/', requireRole('teacher','admin'), (req, res, next) => { req.body.owner_id = req.user.id; next(); });

// group-level actions require ownership (teachers) or admin
router.post('/:code/members', requireRole('teacher','admin'), requireOwnership('group'), (req, res) => require('../controllers/group').GroupController.addMember(req, res));
router.delete('/:code/members', requireRole('teacher','admin'), requireOwnership('group'), (req, res) => require('../controllers/group').GroupController.removeMember(req, res));
router.get('/:code/members', requireRole('teacher','admin','student'), (req, res) => require('../controllers/group').GroupController.members(req, res));

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