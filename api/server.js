const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const authPopulate = require('./middleware/authPopulate');
const { initDB, createSchema } = require('./controllers/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const testRoutes = require('./routes/tests');
const sectionRoutes = require('./routes/sections');
const itemRoutes = require('./routes/items');
const templateRoutes = require('./routes/templates');
const answerRoutes = require('./routes/answers');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 8080;

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
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/tests', testRoutes);
app.use('/sections', sectionRoutes);
app.use('/items', itemRoutes);
app.use('/templates', templateRoutes);
app.use('/answers', answerRoutes);
app.use('/dashboard', dashboardRoutes);

const APP_NAME = process.env.APP_NAME || 'Testotron';

function baseContext(req, extra = {}) {
    const u = req && req.user ? req.user : null;
    const user = u ? {
        id: u.id,
        name: u.name || u.email || 'Usuario',
        role: u.role || 'guest',
        initials: (u.name || '').split(' ').map(s => s[0] || '').slice(0,2).join('').toUpperCase()
    } : { name: 'Invitado', role: 'teacher', initials: '??' };

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
        quickAccessAction: '/quizzes/join',
        placeholders: { email: 'tu@email.com', password: '********', quizCode: 'Ingresa el código del cuestionario' }
    }});
    res.render('shared/login', ctx);
});

app.get('/auth/register', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Crear cuenta', layout: 'auth', locals: {
        authAction: '/auth/register',
        loginUrl: '/auth/login',
        quickAccessAction: '/quizzes/join',
        roles: [ { value: 'student', label: 'Estudiante' }, { value: 'teacher', label: 'Profesor' } ],
        placeholders: { name: 'Jaime Hernández', email: 'tu@email.com', password: '********', quizCode: 'Ingresa el código del cuestionario' }
    }});
    res.render('shared/register', ctx);
});

app.get('/student/quizzes', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Mis cuestionarios', active: { studentQuizzes: true }, locals: {
        pageDescription: 'Consulta y realiza tus cuestionarios asignados',
        filters: { group: 'Todos los grupos', status: 'Todos los estados', search: '' },
        stats: { totalAssigned: 0, completed: 0, pending: 0, averageScore: 0 },
        quizzes: [] // placeholder array; frontend JS will fetch real data
    }});
    res.render('student/quizzes', ctx);
});

app.get('/student/quiz/:id', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Cuestionario', locals: {
        quizTitle: 'Cuestionario de ejemplo',
        quizCode: req.params.id || 'QUIZ-1',
        timer: { timeLimit: 1800, elapsedTime: 0 },
        progress: { current: 0, total: 0 },
        questions: [],
        layout: 'quiz'
    }});
    res.render('student/quiz', ctx);
});

app.get('/teacher/quizzes', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Profesor', active: { quizzes: true }, locals: {
        pageDescription: 'Gestiona y organiza todos tus cuestionarios',
        stats: { total: 0, active: 0, drafts: 0, totalResponses: 0 },
        quizzes: []
    }});
    res.render('teacher/quizzes', ctx);
});

app.get('/teacher/quizzes/create', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Crear nuevo cuestionario', active: { createQuiz: true }, locals: {
        categories: ['Matemáticas', 'Historia', 'Ciencias'],
        groups: [],
        difficulties: ['Fácil', 'Media', 'Difícil'],
        quiz: { name: '', description: '', category: 'Matemáticas', group: 'Crear como plantilla', timeLimit: 30, minScore: 70, showAnswers: false, allowRetries: false, status: 'Activo', questions: [] },
        questionForm: { types: ['Selección única','Selección múltiple','Respuesta corta'], categories: ['Matemáticas','Historia','Ciencias'], difficulties: ['Fácil','Media','Difícil'], current: { type: 'Selección única', category: 'Matemáticas', difficulty: 'Media', options: [ { text: 'Opción 1', correct: false }, { text: 'Opción 2', correct: true } ] } }
    }});
    res.render('teacher/create_quiz', ctx);
});

app.get('/teacher/questions', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Banco de preguntas', active: { questionBank: true }, locals: {
        filters: { search: '' },
        stats: { totalQuestions: 0, mostUsed: 0 },
        questions: [],
        questionForm: { types: ['Selección única','Selección múltiple','Respuesta corta'], categories: ['Matemáticas','Historia','Ciencias'], difficulties: ['Fácil','Media','Difícil'], current: { type: 'Selección única', category: 'Matemáticas', difficulty: 'Media', options: [ { text: 'Opción 1', correct: false }, { text: 'Opción 2', correct: true } ] } }
    }});
    res.render('teacher/questions', ctx);
});

app.get('/teacher/templates', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Plantillas de cuestionarios', active: { templates: true }, locals: { templates: [] }});
    res.render('teacher/templates', ctx);
});

app.get('/teacher/quizzes/view/:id', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Resultados', active: { results: true }, locals: {
        stats: { totalResults: 0, averageScore: 0, approvalRate: 0, totalAttempts: 0 },
        results: []
    }});
    res.render('teacher/results', ctx);
});

app.get('/admin/tables', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Panel de administración', active: { tables: true }, locals: {
        stats: { totalUsers: 0, activeQuizzes: 0, admins: 0, activityToday: 0 },
        tables: []
    }});
    res.render('admin/tables', ctx);
});

app.get('/groups', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Mis grupos', active: { groups: true }, locals: {
        pageDescription: 'Organiza estudiantes y asigna cuestionarios',
        filters: { search: '' },
        stats: { totalGroups: 0, totalStudents: 0, assignedQuizzes: 0, averageStudents: 0 },
        groups: []
    }});
    res.render('shared/groups', ctx);
});

app.get('/groups/:id', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Grupo', locals: { group: { name: 'Grupo de ejemplo', membersCount: 0, quizzesCount: 0, averageScore: 0, accessCode: 'GRP2026', members: [], quizzes: [] } }});
    res.render('shared/group-info', ctx);
});

app.get('/profile', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Mi perfil', locals: { profileData: { name: 'Profesor Demo', initials: 'PD', email: 'demo@local', role: 'teacher', memberSince: '2026-01-01', bio: 'Perfil de ejemplo' } }});
    res.render('shared/profile', ctx);
});

app.get('/results/quiz/:id', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Resultados', locals: {
        quizTitle: 'Cuestionario Demo',
        score: 0,
        minScore: 70,
        correctAnswers: 0,
        totalQuestions: 0,
        timeSpent: '00:00',
        passed: false,
        answers: []
    }});
    res.render('shared/quiz-result', ctx);
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
