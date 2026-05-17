const testModel = require('../../api/models/test');
const { getDB } = require('../../api/db');

function studentQuizzesPage(req, res, baseContext) {
  if (!req.user) { return res.redirect('/auth/login'); }

  const db = getDB();
  const tests = db.prepare(`
    SELECT
      t.code,
      t.title,
      t.description,
      t.status,
      t.created_at,
      g.name AS group_name,
      COUNT(tq.id) AS questions_count
    FROM tests t
    JOIN user_groups ug
      ON ug.group_code = t.group_code
    LEFT JOIN groups g
      ON g.code = t.group_code
    LEFT JOIN test_questions tq
      ON tq.test_code = t.code
    WHERE ug.user_id = ?
    GROUP BY t.code
    ORDER BY t.created_at DESC
  `).all(req.user.id);

  const attempts = db.prepare(`
    SELECT DISTINCT test_code
    FROM attempts
    WHERE user_id = ?
  `).all(req.user.id);

  const completed = attempts.length;

  const quizzes = tests.map(t => ({
    title: t.title,
    code: t.code,
    group: t.group_name || '',
    questions: t.questions_count || 0,
    status: t.status,
    createdAt: t.created_at
  }));

  const ctx = baseContext(req, {
    pageTitle: 'Mis cuestionarios',
    active: { studentQuizzes: true },
    locals: {
      quizzes,
      stats: {
        totalAssigned: quizzes.length,
        completed,
        pending: Math.max(0, quizzes.length - completed)
      }
    }
  });

  res.render('student/quizzes', ctx);
}

module.exports = { studentQuizzesPage };
