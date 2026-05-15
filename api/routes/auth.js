const express = require('express');
const router = express.Router();
const { UserController } = require('../controllers/user');

// POST /auth/register
router.post('/register', UserController.register);

// POST /auth/login
// body: { email, password }
router.post('/login', UserController.login);

// GET /auth/me - return current user (if authenticated via cookie or header)
router.get('/me', (req, res) => {
  if (req.user) return res.json({ user: req.user });
  return res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
