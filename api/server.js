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

// API Backend
//
app.use('/auth', authRoutes);  // THIS DOES THE POST FOR REGISTE AND LOGIN NOT TO RENDER THE LOGIN AND REGISTER PAGE 
app.use('/logout', logoutRoutes);

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


app.post('/questions/create', authMiddleware, (req, res) => {

  try {

    /*
    =====================================
    AUTH
    =====================================
    */

    if (
      req.user.role !== 'teacher' &&
      req.user.role !== 'admin'
    ) {

      return res.status(403).json({
        error: 'Unauthorized'
      });
    }

    /*
    =====================================
    BODY
    =====================================
    */

    const {

      question,
      type,
      metadata,
      correct_answer,
      difficulty,
      category,
      is_public

    } = req.body;

    /*
    =====================================
    VALIDATION
    =====================================
    */

    if (!question || !type) {

      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    /*
    =====================================
    CREATE
    =====================================
    */

    const id = createQuestion({

      owner_id: req.user.id,

      question,

      type,

      metadata,

      correct_answer,

      difficulty,

      category,

      is_public

    });

    /*
    =====================================
    RESPONSE
    =====================================
    */

    return res.json({

      success: true,

      id

    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }

});



// logout handled by /logout router (api/routes/logout.js)


/* root handled by SSR */

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
