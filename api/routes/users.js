const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { UserController } = require('../controllers/user');

router.use(authMiddleware);

// GET /users - list (admin/teacher)
router.get('/', requireRole('admin','teacher'), UserController.list);
// GET /users/:id
router.get('/:id', requireRole('admin','teacher','student'), UserController.get);
// PUT /users/:id
router.put('/:id', requireRole('admin','teacher','student'), UserController.update);
// DELETE /users/:id (admin only)
router.delete('/:id', requireRole('admin'), UserController.delete);

module.exports = router;