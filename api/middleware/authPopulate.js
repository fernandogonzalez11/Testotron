const jwt = require('jsonwebtoken');

function authPopulate(secret) {
  const s = secret || process.env.JWT_SECRET || 'dev-secret';
  return function (req, res, next) {
    try {
      const cookieToken = req.cookies && req.cookies.token;
      const authHeader = req.headers && req.headers.authorization;
      const bearer = authHeader && authHeader.split && authHeader.split(' ')[1];
      const token = cookieToken || bearer;
      if (!token) {
        return next();
      }
      let payload;
      try {
        payload = jwt.verify(token, s);
      } catch (err) {
        return next();
      }
      req.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role
      };
    } catch (err) {
      // ignore invalid token
    }
    next();
  };
}

module.exports = authPopulate;
