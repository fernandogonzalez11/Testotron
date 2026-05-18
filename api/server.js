const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const authPopulate = require('./middleware/authPopulate');
const { initDB, createSchema, getDB } = require('./db');

// api routes
const authRoutes = require('./routes/auth');
const logoutRoutes = require('./routes/logout');

// models used for SSR
const { getUserById, updateUser, getUserByEmail } = require('./models/user');
const { listTests, getTest } = require('./models/test');
const { authMiddleware } = require('./middleware/auth');
const { createGroup, getGroup, updateGroup, deleteGroup, listGroups, addMember, removeMember, addMemberByEmail, listMembers, groupDetail } = require('./models/group');
const { createQuestion } = require('./models/questions');

const APP_NAME = process.env.APP_NAME || 'Testotron';

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
        or: function () { return Array.from(arguments).slice(0, -1).some(Boolean);},
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

// app.use('/api', require('./routes/index')); OLD VERSION NOT IN USE ANY MORE

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

app.get('/', (req, res) => res.redirect('/auth/login'));

// SSR groups routes
// Frontend SSR routes

app.use('/auth', require('../ssr/routes/auth')(baseContext));
app.use('/groups', require('../ssr/routes/groups')(baseContext));
app.use('/teacher', require('../ssr/routes/teacher')(baseContext));
app.use('/student', require('../ssr/routes/student')(baseContext));
app.use('/admin', require('../ssr/routes/admin')(baseContext));
app.use('/profile', require('../ssr/routes/profile')(baseContext));
app.use('/dashboard',require('../ssr/routes/dashboard')(baseContext));

// API Backend
// Mount API routers under /api
app.use('/api/auth', authRoutes);
app.use('/api/logout', logoutRoutes);
app.use('/api/groups', require('./routes/groups'));
app.use('/api/users', require('./routes/users'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/test-questions', require('./routes/test-questions'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/attempt-answers', require('./routes/attempt-answers'));
app.use('/api/attempts', require('./routes/grading'));

// Note: all business logic has been moved into route handlers/controllers.

/* root handled by SSR */

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
