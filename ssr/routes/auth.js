const express = require('express');

module.exports = function(baseContext) {
	const router = express.Router();

router.get('/', (req, res) => res.redirect('/auth/login'));

router.get('/login', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Iniciar sesión', layout: 'auth', locals: {
        authAction: '/auth/login',
        registerUrl: '/auth/register',
        quickAccessAction: '/quizzes/join'
    }});
    res.render('shared/login', ctx);
});

	router.get('/register', (req, res) => {
    const ctx = baseContext(req, { pageTitle: 'Crear cuenta', layout: 'auth', locals: {
        authAction: '/auth/register',
        loginUrl: '/auth/login',
        quickAccessAction: '/quizzes/join',
        roles: [ { value: 'student', label: 'Estudiante' }, { value: 'teacher', label: 'Profesor' } ]
    }});
    res.render('shared/register', ctx);
});

	return router;
};
