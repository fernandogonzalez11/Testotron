const { getDB } = require('../../api/db');
const { listGroups } = require('../../api/models/group');
const { listTeacherResults } = require('../../api/models/attempt-answer');
const { getTest } = require('../../api/models/test');
const { getTemplate } =  require('../../api/models/template');

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


function quizzesResultsPage(req, res, baseContext) {

    /*
    =========================================
    AUTH
    =========================================
    */

    if (!req.user) {
        return res.redirect('/auth/login');
    }

    if (
        req.user.role !== 'teacher' &&
        req.user.role !== 'admin'
    ) {
        return res.redirect('/');
    }

    /*
    =========================================
    FILTERS
    =========================================
    */

    const {
        search = '',
        group = '',
        status = ''
    } = req.query;

    /*
    =========================================
    RESULTS
    =========================================
    */

    const results =
        listTeacherResults({

            owner_id:
                req.user.role === 'admin'
                    ? null
                    : req.user.id,

            search: search.trim(),

            group_code:
                group || null
        });

    /*
    =========================================
    STATUS FILTER
    =========================================
    */

    let filteredResults = results;

    if (status) {

        filteredResults =
            filteredResults.filter(
                r => r.status === status
            );
    }

    /*
    =========================================
    TEACHER GROUPS
    =========================================
    */

    const groups =
        listGroups(
            req.user.role === 'admin'
                ? {}
                : {
                    owner_id: req.user.id
                }
        );

    /*
    =========================================
    STATS
    =========================================
    */

    const totalResults =
        filteredResults.length;

    const averageScore =
        totalResults
            ? Math.round(
                filteredResults.reduce(
                    (sum, r) =>
                        sum + r.percentage,
                    0
                ) / totalResults
            )
            : 0;

    const approved =
        filteredResults.filter(
            r => r.percentage >= 70
        ).length;

    const approvalRate =
        totalResults
            ? Math.round(
                (approved * 100) /
                totalResults
            )
            : 0;

    const stats = {

        totalResults,

        averageScore,

        approvalRate,

        totalAttempts:
            totalResults
    };

    /*
    =========================================
    PAGE
    =========================================
    */

    const ctx = baseContext(req, {

        pageTitle: 'Resultados',

        active: {
            results: true
        },

        locals: {

            pageDescription:
                'Consulta el rendimiento de los estudiantes',

            filteredResults,

            groups,

            stats,

            filters: {

                search,

                group,

                status
            }
        }
    });

    return res.render(
        'teacher/results',
        ctx
    );
}

function editQuizPage(
  req,
  res,
  baseContext
) {

  /*
  =====================================
  AUTH
  =====================================
  */

  if (!req.user) {

    return res.redirect(
      '/auth/login'
    );
  }

  /*
  =====================================
  QUIZ
  =====================================
  */

  const rawQuiz =
    getTest(req.params.code);

  if (!rawQuiz) {

    return res.redirect(
      '/teacher/quizzes'
    );
  }

  /*
  =====================================
  OWNERSHIP
  =====================================
  */

  if (

    req.user.role !== 'admin' &&

    rawQuiz.owner_id !== req.user.id

  ) {

    return res.redirect(
      '/teacher/quizzes'
    );
  }

  /*
  =====================================
  GROUPS
  =====================================
  */

  const groups =

    req.user.role === 'teacher'

      ? listGroups({

          owner_id:
            req.user.id

        })

      : listGroups();

  /*
  =====================================
  NORMALIZE QUIZ
  =====================================
  */

  const quiz = {

    code:
      rawQuiz.code,

    id:
      rawQuiz.id,

    /*
    ===================================
    BASIC
    ===================================
    */

    name:
      rawQuiz.title || '',

    title:
      rawQuiz.title || '',

    description:
      rawQuiz.description || '',

    instructions:
      rawQuiz.instructions || '',

    category:
      rawQuiz.category || '',

    /*
    ===================================
    SETTINGS
    ===================================
    */

    status:
      rawQuiz.status || 'draft',

    group_code:
      rawQuiz.group_code || '',

    timeLimit:
      rawQuiz.time_limit_minutes || 0,

    minScore:
      rawQuiz.min_score || 0,

    showAnswers:
      Boolean(
        rawQuiz.show_answers
      ),

    allowRetries:
      Boolean(
        rawQuiz.allow_retries
      ),

    shuffleQuestions:
      Boolean(
        rawQuiz.shuffle_questions
      ),

    shuffleAnswers:
      Boolean(
        rawQuiz.shuffle_answers
      ),

    /*
    ===================================
    QUESTIONS
    ===================================
    */

    questions:
      Array.isArray(
        rawQuiz.questions
      )

      ? rawQuiz.questions.map(q => ({

          question_id:
            q.original_question_id,

          question:
            q.question,

          type:
            q.type,

          metadata:
            q.metadata,

          correct_answer:
            q.correct_answer,

          pts:
            q.pts || 1

      }))

      : []

  };

  /*
  =====================================
  PAGE
  =====================================
  */

  const ctx = baseContext(req, {

    pageTitle:
      'Editar cuestionario',

    pageDescription:
      'Modifica la configuración y preguntas del cuestionario',

    active: {
      quizzes: true
    },

    locals: {

      quiz,

      groups,

      mode: 'test',

      difficulties: [

        'Fácil',

        'Media',

        'Difícil'

      ]
    }

  });

  return res.render(

    'teacher/create_quiz',

    ctx

  );

}

function editTemplatePage(
  req,
  res,
  baseContext
) {

  if (!req.user) {
    return res.redirect('/auth/login');
  }

  const template =
    getTemplate(req.params.id);

  if (!template) {
    return res.redirect('/teacher/templates');
  }

  const ctx = baseContext(req, {

    pageTitle:
      'Editar plantilla',

    active: {
      templates: true
    },

    locals: {
      template
    }
  });

  return res.render(
    'teacher/create_template',
    ctx
  );
}

function viewQuizPage(
  req,
  res,
  baseContext
) {

  const quiz =
    getTest(req.params.code);

  if (!quiz) {
    return res.redirect(
      '/teacher/quizzes'
    );
  }

  const ctx = baseContext(req, {

    pageTitle:
      quiz.title,

    active: {
      quizzes: true
    },

    locals: {
      quiz
    }
  });

  return res.render(
    'teacher/view_quiz',
    ctx
  );
}

module.exports = {
viewQuizPage,
  editQuizPage,
  teacherQuizzesPage,
  questionsPage,
  templatesPage,
  createQuizPage,
  quizzesResultsPage,
  editTemplatePage
};
