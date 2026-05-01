const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();

// Configuración de Handlebars
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../frontend/views/layouts'),
    partialsDir: path.join(__dirname, '../frontend/components'),
    helpers: {
        eq: (a, b) => a === b // Helper esencial para comparar roles
    }
}));

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Servir archivos estáticos (CSS, Imágenes)
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// RUTA DE PRUEBA: Vista de Cuestionarios
app.get('/teacher/quizzes', (req, res) => {
    // Aquí simulas el JSON que definimos en el contrato
    const mockData = {
        appName: "Testotron",        
        pageTitle: "Profesor",
        user: { 
            name: "Profesor Carlos Mendoza", 
            role: "teacher", 
            initials: "CM" 
        },
        activePage: { quizzes: true },
        stats: { total: 6, active: 3, drafts: 2, totalResponses: 138 },
        quizzes: [
            { id: 1, title: "Matemáticas Avanzadas - Unidad 3", createdAt: "2026-03-15", group: "Ingeniería 2024", questions: 15, responses: 28, status: "active", code: "MAT-2024" },
            { id: 2, title: "Historia Universal Contemporánea", createdAt: "2026-03-18", group: "Humanidades A", questions: 20, responses: 34, status: "active", code: "HIS-7832" }
        ]
    };
    res.render('teacher/quizzes', mockData);
});

app.get('/auth/login', (req, res) => {
    // Datos basados estrictamente en el Contrato JSON definido
    const mockData = {
        appName: "Testotron",
        pageTitle: "Iniciar sesión",
        appSlogan: "Gestiona cuestionarios de forma rápida, clara y organizada",
        authAction: "/auth/login",
        registerUrl: "/auth/register",
        quickAccessAction: "/quizzes/join",
        placeholders: {
            email: "tu@email.com",
            password: "********",
            quizCode: "Ingresa el código del cuestionario"
        },
        // Forzamos el uso del layout de autenticación
        layout: 'auth' 
    };

    res.render('shared/login', mockData);
});

app.get('/auth/register', (req, res) => {
    const mockData = {
        pageTitle: "Crear cuenta",
        appName: "Testotron",
        appSlogan: "Gestiona cuestionarios de forma rápida, clara y organizada",
        authAction: "/auth/register",
        loginUrl: "/auth/login",
        quickAccessAction: "/quizzes/join",
        roles: [
            { "value": "student", "label": "Estudiante" },
            { "value": "teacher", "label": "Profesor" }
        ],
        placeholders: {
            name: "Jaime Hernández",
            email: "tu@email.com",
            password: "********",
            quizCode: "Ingresa el código del cuestionario"
        },
        layout: "auth"
    };

    res.render('shared/register', mockData);
})

app.get('/', (req, res) => {
    res.redirect('/auth/login');
})

const PORT = 3000;
app.listen(PORT, () => console.log(`Testotron corriendo en http://localhost:${PORT}`));