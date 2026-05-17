const express = require('express');
const router = express.Router();

// API route index - mounts existing API routers
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/groups', require('./groups'));
router.use('/tests', require('./tests'));
router.use('/answers', require('./answers'));
router.use('/templates', require('./templates'));

module.exports = router;
