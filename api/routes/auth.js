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
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { getUserById } = require('../models/user');
    const full = getUserById(req.user.id);
    if (!full) return res.status(404).json({ error: 'User not found' });
    // avoid returning password
    delete full.password;
    return res.json({ user: full });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
