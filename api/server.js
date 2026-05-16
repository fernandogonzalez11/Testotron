const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const authPopulate = require('./middleware/authPopulate');
const { initDB, createSchema, getDB } = require('./controllers/db');

// api routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const testRoutes = require('./routes/tests');
const sectionRoutes = require('./routes/sections');
const itemRoutes = require('./routes/items');
const templateRoutes = require('./routes/templates');
const answerRoutes = require('./routes/answers');
const dashboardRoutes = require('./routes/dashboard');

// models used for SSR
const { getUserById, updateUser, getUserByEmail } = require('./models/user');
const { listTests, getTest } = require('./models/test');
const { authMiddleware } = require('./middleware/auth');
const { listSections } = require('./models/section');
const { listItems } = require('./models/item');
const { listAnswers, listResults, getAnswer } = require('./models/answer');
const { listGroups, groupDetail, createGroup} = require('./models/group');

const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(authPopulate(process.env.JWT_SECRET));

app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../frontend/views/layouts'),
    partialsDir: path.join(__dirname, '../frontend/components'),
    helpers: {
        eq: (a, b) => a === b,
        ifEquals: function (arg1, arg2, options) { return (arg1 === arg2) ? options.fn(this) : options.inverse(this); }
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// initialize DB
initDB();

// run `node api/server.js init` to create schema
if (process.argv[2] === 'init') {
  createSchema();
  console.log('Schema created');
  process.exit(0);
}

// public routes
app.use('/auth', authRoutes);
const logoutRoutes = require('./routes/logout');
app.use('/logout', logoutRoutes);

// protected/resource routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/dashboard', dashboardRoutes);

const APP_NAME = process.env.APP_NAME || 'Testotron';

function baseContext(req, extra = {}) {
    const u = req && req.user ? req.user : null;
    const user = u ? {
        id: u.id,
        name: u.name || u.email || 'Usuario',
        email: u.email,
	role: u.role || 'guest',
        initials: (u.name || '').split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase()
    } : { name: 'Invitado', role: 'guest', initials: '??' }; 

    return Object.assign({
        appName: APP_NAME,
        pageTitle: extra.pageTitle || '',
        appSlogan: 'Gestiona cuestionarios de forma rápida, clara y organizada',
        user,
        layout: extra.layout || 'main',
        activePage: extra.active || {}
    }, extra.locals || {});
}

// Frontend SSR routes
app.get('/', (req, res) => res.redirect('/auth/login'));

app.get('/auth/login', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Iniciar sesión', layout: 'auth', locals: {
        authAction: '/auth/login',
        registerUrl: '/auth/register',
        quickAccessAction: '/quizzes/join'
    }});
    res.render('shared/login', ctx);
});

app.get('/auth/register', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Crear cuenta', layout: 'auth', locals: {
        authAction: '/auth/register',
        loginUrl: '/auth/login',
        quickAccessAction: '/quizzes/join',
        roles: [ { value: 'student', label: 'Estudiante' }, { value: 'teacher', label: 'Profesor' } ]
    }});
    res.render('shared/register', ctx);
});

app.get('/student/quizzes', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const db = require('./controllers/db').getDB();
    // tests assigned to student's groups
    const tests = db.prepare('SELECT t.code, t.name, t.group_code, t.created_at FROM tests t JOIN user_groups ug ON ug.group_code = t.group_code WHERE ug.user_id = ?').all(req.user.id);
    // student's answers
    const answers = listAnswers({ user_id: req.user.id });
    const totalAssigned = tests.length;
    const completed = answers.length;
    const pending = totalAssigned - completed;
    // compute average score across student's answers
    let averageScore = 0;
    if (completed > 0) {
      const scores = answers.map(a => {
        const items = db.prepare('SELECT ax.pts_obtained, i.pts as max_pts FROM answerxitem ax JOIN items i ON i.id = ax.item_id WHERE ax.answer_id = ?').all(a.id);
        let obtained = 0, max = 0;
        for (const it of items) { obtained += it.pts_obtained; max += it.max_pts; }
        return max ? Math.round((obtained / max) * 100) : 0;
      });
      averageScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    }

    // map tests to view model expected by templates
    const quizzes = tests.map(t => {
      const groupRow = db.prepare('SELECT name FROM groups WHERE code = ?').get(t.group_code) || {};
      const qCountRow = db.prepare('SELECT COUNT(i.id) as cnt FROM items i JOIN sections s ON s.id = i.section_id WHERE s.test_code = ?').get(t.code) || { cnt: 0 };
      const respRow = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE test_code = ?').get(t.code) || { cnt: 0 };
      return {
        title: t.name,
        code: t.code,
        group: groupRow.name || t.group_code || '',
        questions: qCountRow.cnt || 0,
        responses: respRow.cnt || 0,
        status: t.status || 'active',
        createdAt: t.created_at
      };
    });

    const ctx = baseContext(req, { pageTitle: 'Mis cuestionarios', active: { studentQuizzes: true }, locals: {
        pageDescription: 'Consulta y realiza tus cuestionarios asignados',
        filters: { group: '', status: '', search: '' },
        stats: { totalAssigned, completed, pending, averageScore },
        quizzes
    }});
    res.render('student/quizzes', ctx);
});

app.get('/student/quiz/:id', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const code = req.params.id;
    const t = getTest(code);
    if (!t) return res.status(404).render('shared/error', { message: 'Cuestionario no encontrado' });
    // ensure student has access via group membership or quiz is public (group_code null)
    if (req.user.role === 'student') {
      const db = require('./controllers/db').getDB();
      const g = db.prepare('SELECT 1 FROM user_groups ug WHERE ug.user_id = ? AND ug.group_code = ?').get(req.user.id, t.group_code);
      if (!g) return res.status(403).render('shared/error', { message: 'Acceso denegado' });
    }
    const sections = listSections(code).map(s => Object.assign({}, s, { items: listItems(s.id) }));
    // flatten items into question objects expected by templates
    const questions = [];
    for (const s of sections) {
      for (const it of (s.items||[])) {
        let options = [];
        try { options = JSON.parse(it.answer || '[]'); } catch(e) { options = []; }
        // normalize options: array of { id, text }
        options = options.map((op, idx) => ({ id: idx+1, text: op.text || op }));
        questions.push({ id: it.id, text: it.question, options });
      }
    }
    const ctx = baseContext(req, { pageTitle: t.name || 'Cuestionario', locals: {
        quizTitle: t.name,
        quizCode: code,
        timer: { timeLimit: t.time_limit || 0, elapsedTime: 0 },
        progress: { current: 0, total: questions.length },
        questions: questions,
        layout: 'quiz'
    }});
    res.render('student/quiz', ctx);
});

app.get('/teacher/quizzes', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    // only show teacher's quizzes (or all for admin)
    let tests = [];
    const db = require('./controllers/db').getDB();
    if (req.user.role === 'teacher') {
      tests = listTests({ owner_id: req.user.id });
    } else if (req.user.role === 'admin') {
      tests = listTests();
    }
    // build view model
    const quizzes = tests.map(t => {
      const groupRow = db.prepare('SELECT name FROM groups WHERE code = ?').get(t.group_code) || {};
      const qCountRow = db.prepare('SELECT COUNT(i.id) as cnt FROM items i JOIN sections s ON s.id = i.section_id WHERE s.test_code = ?').get(t.code) || { cnt: 0 };
      const respRow = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE test_code = ?').get(t.code) || { cnt: 0 };
      return {
        title: t.name,
        code: t.code,
        group: groupRow.name || t.group_code || '',
        questions: qCountRow.cnt || 0,
        responses: respRow.cnt || 0,
        status: t.status || 'active',
        createdAt: t.created_at
      };
    });
    // basic stats
    const total = quizzes.length;
    const totalResponsesRow = db.prepare('SELECT COUNT(*) as cnt FROM answers a JOIN tests t ON t.code = a.test_code WHERE t.owner_id = ?').get(req.user.id);
    const totalResponses = totalResponsesRow ? totalResponsesRow.cnt : 0;
    const ctx = baseContext(req, { pageTitle: 'Profesor', active: { quizzes: true }, locals: {
        pageDescription: 'Gestiona y organiza todos tus cuestionarios',
        stats: { total, active: quizzes.filter(t=>t.status!== 'draft').length || 0, drafts: quizzes.filter(t=>t.status === 'draft').length || 0, totalResponses },
        quizzes
    }});
    res.render('teacher/quizzes', ctx);
});

app.get('/teacher/quizzes/create', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const groups = req.user.role === 'teacher' ? listGroups({ owner_id: req.user.id }) : listGroups();
    const ctx = baseContext(req, { pageTitle: 'Crear nuevo cuestionario', active: { createQuiz: true }, locals: {
        groups: groups,
        difficulties: ['Fácil', 'Media', 'Difícil']
    }});
    res.render('teacher/create_quiz', ctx);
});

app.get('/teacher/questions', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const db = require('./controllers/db').getDB();
    let questions = [];
    if (req.user.role === 'teacher') {
      questions = db.prepare('SELECT i.*, t.code as test_code, t.name as test_name FROM items i JOIN sections s ON s.id = i.section_id JOIN tests t ON t.code = s.test_code WHERE t.owner_id = ?').all(req.user.id);
    } else if (req.user.role === 'admin') {
      questions = db.prepare('SELECT i.*, t.code as test_code, t.name as test_name FROM items i JOIN sections s ON s.id = i.section_id JOIN tests t ON t.code = s.test_code').all();
    }
    const ctx = baseContext(req, { pageTitle: 'Banco de preguntas', active: { questionBank: true }, locals: {
        filters: { search: '' },
        stats: { totalQuestions: questions.length, mostUsed: 0 },
        questions: questions
    }});
    res.render('teacher/questions', ctx);
});

app.get('/teacher/templates', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const db = require('./controllers/db').getDB();
    let templates = [];
    if (req.user.role === 'admin') templates = db.prepare('SELECT * FROM templates').all();
    else templates = db.prepare('SELECT * FROM templates WHERE user_id = ?').all(req.user.id);
    const ctx = baseContext(req, { pageTitle: 'Plantillas de cuestionarios', active: { templates: true }, locals: { templates }});
    res.render('teacher/templates', ctx);
});

app.get('/teacher/quizzes/view/:id', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const testCode = req.params.id;
    // only owner (teacher) or admin can view
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const raw = listResults({ owner_id: req.user.role === 'admin' ? undefined : req.user.id, test_code: testCode });
      // map to template fields
      const db = require('./controllers/db').getDB();
      const results = raw.map(r => {
        const groupRow = db.prepare('SELECT name FROM groups WHERE code = ?').get(r.group_code) || {};
        return {
          student: r.student_email,
          quiz: r.test_name,
          group: groupRow.name || r.group_code,
          score: r.score_pct,
          status: (r.score_pct >= 70) ? 'Aprobado' : 'Reprobado',
          date: r.date,
          time: '00:00'
        };
      });
      // compute stats
      const totalResults = results.length;
      const averageScore = totalResults ? Math.round(results.reduce((s,r)=>s + (r.score||0),0)/totalResults) : 0;
      const approvalRate = totalResults ? Math.round((results.filter(r=>r.score>=70).length/totalResults)*100) : 0;
      const ctx = baseContext(req, { pageTitle: 'Resultados', active: { results: true }, locals: {
        stats: { totalResults, averageScore, approvalRate, totalAttempts: totalResults },
        results
      }});
      return res.render('teacher/results', ctx);
    }
    return res.status(403).render('shared/error', { message: 'Acceso denegado' });
});

app.get('/admin/tables', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    if (req.user.role !== 'admin') return res.status(403).render('shared/error', { message: 'Acceso denegado' });
    const users = require('./models/user').listUsers();
    const tests = listTests();
    const db = require('./controllers/db').getDB();
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
    res.render('admin/tables', ctx);
});


app.get('/groups', (req, res) => {

    if (!req.user) {
        return res.redirect('/auth/login');
    }

    // show success/error messages from query params
    const successMessage =
        req.query && req.query.success
            ? decodeURIComponent(req.query.success)
            : null;

    const errorMessage =
        req.query && req.query.error
            ? decodeURIComponent(req.query.error)
            : null;

    let groups = [];

    // =========================
    // TEACHER -> own groups
    // =========================
    if (req.user.role === 'teacher') {

        groups = listGroups({
            owner_id: req.user.id
        });

    }

    // =========================
    // STUDENT -> joined groups
    // =========================
    else if (req.user.role === 'student') {

        const db = require('./controllers/db').getDB();

        const memberships = db.prepare(`
            SELECT group_code
            FROM user_groups
            WHERE user_id = ?
        `).all(req.user.id);

        groups = memberships
            .map(m => groupDetail(m.group_code))
            .filter(Boolean);

    }

    // =========================
    // ADMIN -> all groups
    // =========================
    else if (req.user.role === 'admin') {

        groups = listGroups();

    }

    // =========================
    // ENRICH GROUPS WITH STATS
    // =========================
    groups = groups.map(g => {

        const detail = groupDetail(g.code);

        return {
            code: g.code,
            name: g.name,
            owner_id: g.owner_id,
            created_at: g.created_at,

            students_count:
                detail?.members?.length || 0,

            quizzes_count:
                detail?.quizzes?.length || 0,

            avg_score:
                detail?.avg_score || 0,

            members:
                detail?.members || [],

            quizzes:
                detail?.quizzes || []
        };
    });

    // =========================
    // GLOBAL STATS
    // =========================
    const totalStudents =
        groups.reduce(
            (sum, g) =>
                sum + (g.students_count || 0),
            0
        );

    const assignedQuizzes =
        groups.reduce(
            (sum, g) =>
                sum + (g.quizzes_count || 0),
            0
        );

    const avgStudents =
        groups.length
            ? Math.round(
                totalStudents / groups.length
            )
            : 0;

    const stats = {
        totalGroups: groups.length,
        totalStudents,
        assignedQuizzes,
        averageStudents: avgStudents
    };

    // =========================
    // SEARCH FILTER
    // =========================
    const search =
        String(req.query.search || '')
            .trim()
            .toLowerCase();

    if (search) {

        groups = groups.filter(g =>
            g.name
                ?.toLowerCase()
                .includes(search)
        );
    }

    // =========================
    // RENDER PAGE
    // =========================
    const ctx = baseContext(req, {

        pageTitle: 'Mis grupos',

        active: {
            groups: true
        },

        locals: {

            pageDescription:
                'Organiza estudiantes y asigna cuestionarios',

            filters: {
                search
            },

            stats,

            groups,

            successMessage,

            errorMessage
        }
    });

    res.render('shared/groups', ctx);
});


app.post('/groups/create', authMiddleware, (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        createGroup({
            name: req.body.name,
            owner_id: req.user.id,
            description: req.body.description
	});

        return res.redirect('/groups?created=1');

    } catch (err) {
        console.error(err);

        return res.redirect(
            '/groups?error=' +
            encodeURIComponent('No se pudo crear el grupo')
        );
    }
});


app.get('/groups/:id', (req, res) => {

    if (!req.user) {
        return res.redirect('/auth/login');
    }

    const code = req.params.id;

    const group = groupDetail(code);

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
});

app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }

    const dbUser = getUserById(req.user.id);

    if (!dbUser) { return res.redirect('/profile?error=' + encodeURIComponent('Usuario no encontrado')); }

    const profileData = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        bio: dbUser.bio || '',
        memberSince: dbUser.created_at,
        initials: (dbUser.name || '')
            .split(' ')
            .map(s => s[0] || '')
            .slice(0, 2)
            .join('')
            .toUpperCase()
    };

    const successMessage =
        req.query.updated
            ? 'Perfil actualizado correctamente.'
            : null;

    const errorMessage =
        req.query.error
            ? req.query.error
            : null;

    const ctx = baseContext(req, {
        pageTitle: 'Mi perfil',
        active: { profile: true },
        locals: {
            profileData,
            user: profileData,
            successMessage,
            errorMessage
        }
    });

    res.render('shared/profile', ctx);
});

// POST /profile/update - update profile fields from SSR form
app.post('/profile/update', authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        const id = req.user.id;

        const name = String(req.body.fullName || req.body.name || '').trim();
        const email = String(req.body.email || '').trim();
        const bio = String(req.body.bio || '').trim();

        const currentPassword = req.body.currentPassword || '';
        const newPassword = req.body.newPassword || '';
        const confirmPassword = req.body.confirmPassword || '';

        // VALIDATION

        if (!name) {
            return res.redirect('/profile?error=' + encodeURIComponent('Nombre inválido'));
        }

        if (!email) {
            return res.redirect('/profile?error=' + encodeURIComponent('Correo inválido'));
        }

        // Check duplicate email
        const existing = getUserByEmail(email);

        if (existing && existing.id !== id) {
            return res.redirect('/profile?error=' + encodeURIComponent('El correo ya está en uso'));
        }

        let hashed = null;

        // PASSWORD CHANGE FLOW

        if (newPassword || confirmPassword || currentPassword) {

            if (!currentPassword) {
                return res.redirect('/profile?error=' + encodeURIComponent('Debes ingresar la contraseña actual'));
            }

            if (newPassword.length < 6) {
                return res.redirect('/profile?error=' + encodeURIComponent('La nueva contraseña debe tener al menos 6 caracteres'));
            }

            if (newPassword !== confirmPassword) {
                return res.redirect('/profile?error=' + encodeURIComponent('Las contraseñas no coinciden'));
            }

            const dbUser = getUserById(id);

            if (!dbUser) {
                return res.redirect('/profile?error=' + encodeURIComponent('Usuario no encontrado'));
            }

            const ok = await bcrypt.compare(currentPassword, dbUser.password);

            if (!ok) {
                return res.redirect('/profile?error=' + encodeURIComponent('Contraseña actual incorrecta'));
            }

            hashed = await bcrypt.hash(newPassword, 10);
        }

        const changes = updateUser(id, {
            name,
            email,
            bio,
            password: hashed
        });

        if (!changes) {
            return res.redirect('/profile?error=' + encodeURIComponent('No se realizaron cambios'));
        }

        return res.redirect('/profile?updated=1');

    } catch (err) {
        console.error(err);

        return res.redirect('/profile?error=' + encodeURIComponent('Error interno del servidor'));
    }
});


app.get('/results/quiz/:id', (req, res) => {
    if (!req.user) return res.redirect('/auth/login');
    const id = req.params.id;
    const db = require('./controllers/db').getDB();
    // Student view: find their answer for this test code
    if (req.user.role === 'student') {
      const ansRow = db.prepare('SELECT id FROM answers WHERE user_id = ? AND test_code = ?').get(req.user.id, id);
      if (!ansRow) return res.status(404).render('shared/error', { message: 'Resultado no encontrado' });
      const ans = getAnswer(ansRow.id);
      // compute score and summary
      const items = ans.items || [];
      let obtained = 0, max = 0, correct = 0;
      const answersList = items.map(it => {
        const isCorrect = (it.pts_obtained || 0) >= (it.max_pts || 0);
        if (isCorrect) correct++;
        obtained += (it.pts_obtained || 0);
        max += (it.max_pts || 0);
        return {
          question: it.question,
          yourAnswer: it.feedback || '',
          isCorrect,
          correctAnswer: it.correct_answer
        };
      });
      const scorePct = max ? Math.round((obtained / max) * 100) : 0;
      const minScore = 70;
      const passed = scorePct >= minScore;
      // group stats for this test/group
      const groupResults = listResults({ group_code: ans.group_code, test_code: id });
      const average = groupResults.length ? Math.round(groupResults.reduce((s,r)=>s + (r.score_pct||0),0)/groupResults.length) : 0;
      const highestScore = groupResults.length ? Math.max(...groupResults.map(r=>r.score_pct||0)) : 0;
      const sorted = groupResults.slice().sort((a,b)=> (b.score_pct||0) - (a.score_pct||0));
      const position = sorted.findIndex(r => r.student_id === req.user.id) + 1 || null;
      const groupStats = { average, position: position || 0, totalStudents: groupResults.length, highestScore };
      const ctx = baseContext(req, { pageTitle: 'Resultados', locals: {
        quizTitle: ans.test_name,
        score: scorePct,
        minScore,
        correctAnswers: correct,
        totalQuestions: items.length,
        timeSpent: ans.time_spent || '00:00',
        passed,
        answers: answersList,
        groupStats
      }});
      return res.render('shared/quiz-result', ctx);
    }
    // Teacher/Admin: can view aggregated results for a test they own (or any if admin)
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const results = listResults({ owner_id: req.user.role === 'admin' ? undefined : req.user.id, test_code: id });
      const avg = results.length ? Math.round(results.reduce((s,r)=>s + (r.score_pct||0),0)/results.length) : 0;
      const ctx = baseContext(req, { pageTitle: 'Resultados', locals: { quizTitle: id, score: 0, minScore: 70, correctAnswers: 0, totalQuestions: 0, timeSpent: '00:00', passed: false, answers: results, averageScore: avg }});
      return res.render('shared/quiz-result', ctx);
    }
    return res.status(403).render('shared/error', { message: 'Acceso denegado' });
});

// Logout route to clear cookie server-side
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});



/* root handled by SSR */

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
