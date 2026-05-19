//api/routes/groups.js

const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth');
const { requireOwnership } = require('../middleware/ownership');
const { GroupController } = require('../controllers/group');

router.use(authMiddleware);

router.post(
    '/',
    requireRole('teacher', 'admin'),
    GroupController.create
);

router.get(
    '/',
    requireRole('teacher', 'admin'),
    GroupController.list
);

router.get(
    '/:code',
    requireRole('teacher', 'admin', 'student'),
    GroupController.get
);

router.get(
    '/:code/detail',
    requireRole('teacher', 'admin', 'student'),
    GroupController.detail
);

router.post(
    '/join',
    requireRole('teacher', 'admin', 'student'),
    GroupController.joinGroupByCode
);

router.post(
  '/:code/add-user',
  requireRole('teacher', 'admin'),
  requireOwnership('group'),
  GroupController.addMemberByEmail
);

router.get(
    '/:code/members',
    requireRole('teacher', 'admin', 'student'),
    GroupController.members
);

router.delete(
    '/:code/members',
    requireRole('teacher', 'admin'),
    requireOwnership('group'),
    GroupController.removeMember
);

router.put(
    '/:code',
    requireRole('teacher', 'admin'),
    requireOwnership('group'),
    GroupController.update
);

router.post(
    '/:code/update',
    requireRole('teacher', 'admin'),
    requireOwnership('group'),
    GroupController.update
);

router.delete(
    '/:code',
    requireRole('teacher', 'admin'),
    requireOwnership('group'),
    GroupController.delete
);

router.post(
    '/:code/members/remove',
    requireRole('teacher', 'admin'),
    requireOwnership('group'),
    GroupController.removeMember
);

module.exports = router;
