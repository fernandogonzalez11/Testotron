const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  // clear cookie
  res.clearCookie('token');
  // also accept fetch-based logout
  if (req.xhr || req.headers['accept'] && req.headers['accept'].includes('application/json')) {
    return res.json({ ok: true });
  }
  res.redirect('/auth/login');
});

module.exports = router;
