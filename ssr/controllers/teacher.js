const { getDB } = require('../../api/db');
const { listGroups } = require('../../api/models/group');

function teacherQuizzesPage(req, res, baseContext) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  /*
  =====================================
  AUTH
  =====================================
  */

  if (
    req.user.role !== 'teacher' &&
    req.user.role !== 'admin'
  ) {

    return res.redirect('/auth/login');
  }

  const db = getDB();

  /*
  =====================================
  FETCH TESTS
  =====================================
  */

  let quizzes = [];

  if (req.user.role === 'admin') {

    quizzes = db.prepare(`
      SELECT
        tests.*,
        groups.name as group_name
      FROM tests
      LEFT JOIN groups
        ON groups.code = tests.group_code
      ORDER BY tests.created_at DESC
    `).all();

  } else {

    quizzes = db.prepare(`
      SELECT
        tests.*,
        groups.name as group_name
      FROM tests
      LEFT JOIN groups
        ON groups.code = tests.group_code
      WHERE tests.owner_id = ?
      ORDER BY tests.created_at DESC
    `).all(req.user.id);
  }

  /*
  =====================================
  COMPUTED DATA
  =====================================
  */

  quizzes = quizzes.map(q => ({

    code: q.code,

    title: q.title,

    description: q.description,

    status: q.status || 'draft',

    group_name: q.group_name || 'Sin grupo',

    due_at: q.due_at,

    created_at: q.created_at,

    statusVariant:

      q.status === 'published'
        ? 'success'

      : q.status === 'closed'
        ? 'danger'

      : 'warning'
  }));

  /*
  =====================================
  STATS
  =====================================
  */

  const stats = {

    totalQuizzes:
      quizzes.length,

    published:
      quizzes.filter(
        q => q.status === 'published'
      ).length,

    drafts:
      quizzes.filter(
        q => q.status === 'draft'
      ).length,

    closed:
      quizzes.filter(
        q => q.status === 'closed'
      ).length
  };

  /*
  =====================================
  RENDER
  =====================================
  */

  const ctx = baseContext(req, {

    pageTitle:
      'Mis cuestionarios',

    active: {
      quizzes: true
    },

    locals: {

      quizzes,

      stats
    }
  });

  return res.render(
    'teacher/quizzes',
    ctx
  );
}

function questionsPage(req, res, baseContext) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  const db = getDB();

  let questions = [];

  if (req.user.role === 'teacher') {

    questions = db.prepare(`
      SELECT *
      FROM questions
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

  } else if (req.user.role === 'admin') {

    questions = db.prepare(`
      SELECT *
      FROM questions
      ORDER BY created_at DESC
    `).all();
  }

  questions = questions.map(q => ({
    id: q.id,
    question: q.question,
    type: q.type,
    difficulty: q.difficulty || 'Media',

    difficultyVariant:
      q.difficulty === 'Fácil'
        ? 'success'
        : q.difficulty === 'Difícil'
        ? 'danger'
        : 'warning',

    uses: 0
  }));

  const ctx = baseContext(req, {
    pageTitle: 'Banco de preguntas',
    active: { questionBank: true },
    locals: {
      questions,
      stats: {
        totalQuestions: questions.length
      }
    }
  });

  return res.render('teacher/questions', ctx);
}

function templatesPage(req, res, baseContext) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  const db = getDB();

  let templates = [];

  if (req.user.role === 'admin') {

    templates = db.prepare(`
      SELECT *
      FROM quiz_templates
      ORDER BY created_at DESC
    `).all();

  } else {

    templates = db.prepare(`
      SELECT *
      FROM quiz_templates
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);
  }

  const ctx = baseContext(req, {
    pageTitle: 'Plantillas',
    active: { templates: true },
    locals: { templates }
  });

  return res.render('teacher/templates', ctx);
}

function createQuizPage(req, res, baseContext) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  const groups =
    req.user.role === 'teacher'
      ? listGroups({ owner_id: req.user.id })
      : listGroups();

  const ctx = baseContext(req, {
    pageTitle: 'Crear nuevo cuestionario',
    active: { createQuiz: true },
    locals: {
      groups,
      difficulties: ['Fácil', 'Media', 'Difícil']
    }
  });

  return res.render('teacher/create_quiz', ctx);
}

module.exports = {
  teacherQuizzesPage,
  questionsPage,
  templatesPage,
  createQuizPage
};
