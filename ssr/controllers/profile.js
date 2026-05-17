const { getUserById } = require('../../api/models/user');

function profilePage(req, res, baseContext) {
  if (!req.user) return res.redirect('/auth/login');

  const dbUser = getUserById(req.user.id);
  if (!dbUser) return res.redirect('/profile?error=' + encodeURIComponent('Usuario no encontrado'));

  const profileData = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    bio: dbUser.bio || '',
    memberSince: dbUser.created_at,
    initials: (dbUser.name || '').split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase()
  };

  const successMessage = req.query.updated ? 'Perfil actualizado correctamente.' : null;
  const errorMessage = req.query.error ? req.query.error : null;

  const ctx = baseContext(req, {
    pageTitle: 'Mi perfil',
    active: { profile: true },
    locals: { profileData, user: profileData, successMessage, errorMessage }
  });

  res.render('shared/profile', ctx);
}

module.exports = { profilePage };
