const { getDB } = require('../../api/db');
const { listGroups } = require('../../api/models/user');

function adminPage(req, res, baseContext)  {
    if (!req.user) return res.redirect('/auth/login');
    if (req.user.role !== 'admin') return res.status(403).render('shared/error', { message: 'Acceso denegado' });
    const users = require('../../api/models/user').listUsers();
    const tests = require('../../api/models/test').listTests();
    const db = getDB();
    const adminsRow = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='admin'").get();
    const stats = { totalUsers: users.length, activeQuizzes: tests.length, admins: adminsRow ? adminsRow.cnt : 0, activityToday: 0 };
    // build tables array for template
    const tables = [
      {
        name: 'Usuarios',
        headers: ['ID', 'Nombre', 'Correo', 'Rol', 'Creado'],
        rows: users.map(u => [u.id, u.name, u.email, u.role, u.created_at])
      },
      {
        name: 'Cuestionarios',
        headers: ['Código', 'Nombre', 'Grupo', 'Propietario'],
        rows: tests.map(t => [t.code, t.name, t.group_code || '', t.owner_id || ''])
      }
    ];
    const ctx = baseContext(req, { pageTitle: 'Panel de administración', active: { tables: true }, locals: { stats, tables } });
    res.render('admin/management', ctx);
};

module.exports = { adminPage }
