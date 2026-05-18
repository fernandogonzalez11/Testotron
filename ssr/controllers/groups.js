const groupService = require('../../api/services/group-service');
const { groupDetail: getGroupDetail } = require('../../api/models/group');

function groupsPage(req, res, baseContext) {
  if (!req.user) return res.redirect('/auth/login');

  // handle success/error messages
  const successMessage = req.query && req.query.success ? decodeURIComponent(req.query.success) : null;
  const errorMessage = req.query && req.query.error ? decodeURIComponent(req.query.error) : null;

  let groups = [];

  if (req.user.role === 'teacher') {
    groups = groupService.listGroups({ owner_id: req.user.id });
  } else if (req.user.role === 'student') {
    const db = require('../../api/db').getDB();
    const memberships = db.prepare(`SELECT group_code FROM user_groups WHERE user_id = ?`).all(req.user.id);
    groups = memberships.map(m => groupService.groupDetail(m.group_code)).filter(Boolean);
  } else if (req.user.role === 'admin') {
    groups = groupService.listGroups();
  }

  groups = groups.map(g => {
    const detail = groupService.groupDetail(g.code);
    return {
      code: g.code,
      name: g.name,
      owner_id: g.owner_id,
      created_at: g.created_at,
      membersCount: detail?.members?.length || 0,
      quizzesCount: detail?.quizzes?.length || 0,
      averageScore: detail?.avg_score || 0,
      members: detail?.members || [],
      quizzes: detail?.quizzes || []
    };
  });

  const totalStudents = groups.reduce((sum, g) => sum + (g.membersCount || 0), 0);
  const assignedQuizzes = groups.reduce((sum, g) => sum + (g.quizzesCount || 0), 0);
  const avgStudents = groups.length ? Math.round(totalStudents / groups.length) : 0;

  const stats = { totalGroups: groups.length, totalStudents, assignedQuizzes, averageStudents: avgStudents };
  const search = String(req.query.search || '').trim().toLowerCase();
  if (search) {
    groups = groups.filter(g => g.name?.toLowerCase().includes(search));
  }

  const ctx = baseContext(req, {
    pageTitle: 'Mis grupos',
    active: { groups: true },
    locals: { pageDescription: 'Organiza estudiantes y asigna cuestionarios', filters: { search }, stats, groups, successMessage, errorMessage }
  });

  res.render('shared/groups', ctx);
}

function groupDetail(req, res, baseContext) {
if (!req.user) {
        return res.redirect('/auth/login');
    }

    const code = req.params.id;
    const group = getGroupDetail(code);

    // GROUP NOT FOUND

    if (!group) {

        return res.redirect(
            '/groups?error=' +
            encodeURIComponent('Grupo no encontrado')
        );
    }

    // TEACHER:
    // only owner can access

    if (
        req.user.role === 'teacher' &&
        group.owner_id !== req.user.id
    ) {

        return res.redirect(
            '/groups?error=' +
            encodeURIComponent('Acceso denegado')
        );
    }

    // STUDENT:
    // must belong to group

    if (req.user.role === 'student') {

        const member = group.members.find(
            m => m.id === req.user.id
        );

        if (!member) {

            return res.redirect(
                '/groups?error=' +
                encodeURIComponent('Acceso denegado')
            );
        }
    }

    // EXTRA COMPUTED DATA

    group.membersCount =
        group.members?.length || 0;

    group.quizzesCount =
        group.quizzes?.length || 0;

    group.avg_score =
        group.avg_score || 0;

    const ctx = baseContext(req, {

        pageTitle:
            group.name || 'Grupo',

        active: {
            groups: true
        },

        locals: {
            group
        }
    });

    return res.render(
        'shared/group-info',
        ctx
    );
};


module.exports = { groupsPage, groupDetail };
