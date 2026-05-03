const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'secretdev';

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });
  try {
    const payload = jwt.verify(parts[1], SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

module.exports = { authMiddleware, requireRole, generateToken, SECRET };