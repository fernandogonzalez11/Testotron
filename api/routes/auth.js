const express = require('express');
const router = express.Router();
const { UserController } = require('../controllers/user');

// POST /auth/register
// body: { email, password, role }
router.post('/register', UserController.register);

// POST /auth/login
// body: { email, password }
router.post('/login', UserController.login);

module.exports = router;