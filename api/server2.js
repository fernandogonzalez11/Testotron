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
        eq: (a, b) => a === b, // Helper esencial para comparar roles
        ifEquals: function (arg1, arg2, options) {
            return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
        }
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

app.get('/teacher/templates', (req, res) => {
    const mockData = {
        "appName": "Testotron",
        "pageTitle": "Plantillas de cuestionarios",
        "pageDescription": "Utiliza plantillas prediseñadas para crear cuestionarios más rápido",
        "user": {
            "name": "Profesor Carlos Mendoza",
            "role": "teacher",
            "initials": "CM"
        },
        "activePage": {
            "templates": true
        },
        "templates": [
            {
            "id": 1,
            "title": "Examen de Matemáticas",
            "description": "Plantilla para evaluaciones de matemáticas con 20 preguntas",
            "category": "Matemáticas",
            "questions": 20,
            "uses": 45
            },
            {
            "id": 2,
            "title": "Quiz de Historia",
            "description": "Cuestionario básico de historia con preguntas de opción múltiple",
            "category": "Historia",
            "questions": 15,
            "uses": 32
            },
            {
            "id": 3,
            "title": "Evaluación de Programación",
            "description": "Plantilla técnica para evaluar conocimientos de programación",
            "category": "Tecnología",
            "questions": 25,
            "uses": 67
            },
            {
            "id": 4,
            "title": "Test de Ciencias",
            "description": "Plantilla general para ciencias naturales",
            "category": "Ciencias",
            "questions": 18,
            "uses": 28
            }
        ]
    };
    res.render('teacher/templates', mockData);
});

app.get('/teacher/questions', (req, res) => {
    const mockData = {
        "appName": "Testotron",
        "pageTitle": "Banco de preguntas",
        "pageDescription": "Organiza y reutiliza preguntas en múltiples cuestionarios",
        "user": {
            "name": "Profesor Carlos Mendoza",
            "role": "teacher",
            "initials": "CM"
        },
        "activePage": {
            "questionBank": true
        },
        "filters": {
            "search": ""
        },
        "stats": {
            "totalQuestions": 4,
            "mostUsed": 15
        },
        "questions": [
            {
            "id": 1,
            "question": "¿Cuál es la derivada de x²?",
            "type": "Opción múltiple",
            "difficulty": "Fácil",
            "difficultyVariant": "success",
            "uses": 12
            },
            {
            "id": 2,
            "question": "¿En qué año comenzó la Segunda Guerra Mundial?",
            "type": "Respuesta corta",
            "difficulty": "Media",
            "difficultyVariant": "warning",
            "uses": 8
            },
            {
            "id": 3,
            "question": "¿Qué es una función pura en programación?",
            "type": "Opción múltiple",
            "difficulty": "Difícil",
            "difficultyVariant": "danger",
            "uses": 5
            },
            {
            "id": 4,
            "question": "¿Cuál es la fórmula química del agua?",
            "type": "Respuesta corta",
            "difficulty": "Fácil",
            "difficultyVariant": "success",
            "uses": 15
            }
        ],
        "questionForm": {
            types: ["Selección única", "Selección múltiple", "Respuesta corta"],
            categories: ["Matemáticas", "Historia", "Ciencias"],
            difficulties: ["Fácil", "Media", "Difícil"],
            current: {
                type: "Selección única",
                category: "Matemáticas",
                difficulty: "Media",
                options: [
                    { text: "Opción 1", correct: false },
                    { text: "Opción 2", correct: true }
                ]
            }
        }
    };
    res.render('teacher/questions', mockData);
});

app.get('/teacher/quizzes/create', (req, res) => {
  const mockData = {
    appName: "Testotron",
    pageTitle: "Crear nuevo cuestionario",
    pageDescription: "Configura los detalles y añade preguntas",
    user: { 
      name: "Profesor Carlos Mendoza", 
      role: "teacher", 
      initials: "CM" 
    },
    activePage: { createQuiz: true },
    categories: ["Matemáticas", "Historia", "Ciencias"],
    groups: ["Crear como plantilla", "Ingeniería 2024", "Humanidades A"],
    difficulties: ["Fácil", "Media", "Difícil"],
    quiz: {
      name: "",
      description: "",
      category: "Matemáticas",
      group: "Crear como plantilla",
      timeLimit: 30,
      minScore: 70,
      showAnswers: false,
      allowRetries: false,
      status: "Activo",
      questions: []
    },
    "questionForm": {
        types: ["Selección única", "Selección múltiple", "Respuesta corta"],
        categories: ["Matemáticas", "Historia", "Ciencias"],
        difficulties: ["Fácil", "Media", "Difícil"],
        current: {
            type: "Selección única",
            category: "Matemáticas",
            difficulty: "Media",
            options: [
                { text: "Opción 1", correct: false },
                { text: "Opción 2", correct: true }
            ]
        }
    }
  };
  res.render('teacher/create_quiz', mockData);
});

app.get('/teacher/quizzes/view/:id', (req, res) => {
  const mockData = {
    appName: "Testotron",
    pageTitle: "Resultados de cuestionarios",
    pageDescription: "Visualiza y exporta los resultados de tus estudiantes",
    user: { 
      name: "Profesor Carlos Mendoza", 
      role: "teacher", 
      initials: "CM" 
    },
    activePage: { results: true },
    filters: {
      group: "Todos los grupos",
      status: "Todos los estados",
      search: ""
    },
    stats: {
      totalResults: 8,
      averageScore: 79.4,
      approvalRate: 75.0,
      totalAttempts: 10
    },
    results: [
      { student: "Ana García Martínez", quiz: "Matemáticas Avanzadas - Unidad 3", group: "Ingeniería 2024", score: "87%", status: "Aprobado", date: "2026-04-05", time: "24:35" },
      { student: "Carlos López Ramírez", quiz: "Matemáticas Avanzadas - Unidad 3", group: "Ingeniería 2024", score: "92%", status: "Aprobado", date: "2026-04-05", time: "22:10" },
      { student: "María Fernández Soto", quiz: "Historia Universal Contemporánea", group: "Humanidades A", score: "65%", status: "Reprobado", date: "2026-04-04", time: "28:45" },
      { student: "Juan Pérez González", quiz: "Programación Web - React", group: "Desarrollo Web", score: "95%", status: "Aprobado", date: "2026-04-05", time: "30:20" },
      { student: "Laura Sánchez Torres", quiz: "Química Orgánica - Parcial 1", group: "Ciencias Naturales", score: "78%", status: "Aprobado", date: "2026-04-03", time: "35:11" },
      { student: "Pedro Martínez Ruiz", quiz: "Matemáticas Avanzadas - Unidad 3", group: "Ingeniería 2024", score: "58%", status: "Reprobado", date: "2026-04-04", time: "30:00" },
      { student: "Sofía Rodríguez Díaz", quiz: "Historia Universal Contemporánea", group: "Humanidades A", score: "88%", status: "Aprobado", date: "2026-04-04", time: "26:34" },
      { student: "Diego Hernández Luna", quiz: "Programación Web - React", group: "Desarrollo Web", score: "72%", status: "Aprobado", date: "2026-04-03", time: "29:55" }
    ]
  };
  res.render('teacher/results', mockData);
});



app.get('/admin/tables', (req, res) => {
    const mockData = {
        appName: "Testotron",
        pageTitle: "Panel de administración",
        user: { 
            name: "Admin General", 
            role: "admin", 
            initials: "AG" 
        },
        activePage: { tables: true },
        stats: { 
            totalUsers: 245, 
            activeQuizzes: 48, 
            admins: 5, 
            activityToday: 127 
        },
        tables: [
            {
                name: "Usuarios",
                headers: ["Usuario", "Email", "Rol", "Estado", "Registro"],
                rows: [
                    { Usuario: "Ana García", Email: "ana@mail.com", Rol: "student", Estado: "active", Registro: "2026-01-15" },
                    { Usuario: "Carlos Mendoza", Email: "carlos@mail.com", Rol: "teacher", Estado: "active", Registro: "2026-01-10" },
                    { Usuario: "María López", Email: "maria@mail.com", Rol: "student", Estado: "active", Registro: "2026-02-01" }
                ],
                actions: [
                    { label: "Editar", icon: "bi-pencil", url: "/admin/users/edit/{{id}}", color: "primary" }
                ]
            },
            {
                name: "Grupos",
                headers: ["Nombre", "Miembros", "Creación", "Estado"],
                rows: [
                    { Nombre: "Ingeniería 2024", Miembros: 32, Creación: "2025-09-01", Estado: "active" },
                    { Nombre: "Humanidades A", Miembros: 28, Creación: "2025-10-12", Estado: "active" }
                ]
            },
            {
                name: "Cuestionarios y plantillas",
                headers: ["Título", "Código", "Creación", "Preguntas", "Estado"],
                rows: [
                    { Título: "Matemáticas Avanzadas - Unidad 3", Código: "MAT-2024", Creación: "2026-03-15", Preguntas: 15, Estado: "active" },
                    { Título: "Historia Universal Contemporánea", Código: "HIS-7832", Creación: "2026-03-18", Preguntas: 20, Estado: "active" }
                ]
            }
        ]
    };
    res.render('admin/tables', mockData);
});

app.get('/teacher/questions/new', (req, res) => {
    const mockData = {
        appName: "Testotron",
        pageTitle: "Banco de preguntas",
        user: { 
            name: "Profesor Carlos Mendoza", 
            role: "teacher", 
            initials: "CM" 
        },
        activePage: { questions: true },
        questionForm: {
            types: ["Selección única", "Selección múltiple", "Respuesta corta"],
            categories: ["Matemáticas", "Historia", "Ciencias"],
            difficulties: ["Fácil", "Media", "Difícil"],
            current: {
                type: "Selección única",
                category: "Matemáticas",
                difficulty: "Media",
                options: [
                    { text: "Opción 1", correct: false },
                    { text: "Opción 2", correct: true }
                ]
            }
        }
    };
    res.render('teacher/new-question', mockData);
});


app.get('/groups', (req, res) => {
    const mockData = {
        appName: "Testotron",
        pageTitle: "Mis grupos",
        pageDescription: "Organiza estudiantes y asigna cuestionarios",

        user: {
            name: "Profesor Carlos Mendoza",
            role: "teacher",
            initials: "CM"
        },

        activePage: {
            groups: true
        },

        filters: {
            search: ""
        },

        stats: {
            totalGroups: 4,
            totalStudents: 143,
            assignedQuizzes: 31,
            averageStudents: 36
        },

        groups: [
            {
                id: 1,
                name: "Ingeniería 2024",
                code: "ING2024",
                students: 42,
                quizzes: 8,
                createdAt: "2026-01-15"
            },
            {
                id: 2,
                name: "Humanidades A",
                code: "HUM-A24",
                students: 35,
                quizzes: 5,
                createdAt: "2026-01-20"
            },
            {
                id: 3,
                name: "Desarrollo Web",
                code: "WEB2024",
                students: 28,
                quizzes: 12,
                createdAt: "2026-02-01"
            },
            {
                id: 4,
                name: "Ciencias Naturales",
                code: "CNAT24",
                students: 38,
                quizzes: 6,
                createdAt: "2026-02-10"
            }
        ]
    };

    res.render('shared/groups', mockData);
});

app.get('/groups/:id', (req, res) => {
  const mockData = {
    appName: "Testotron",
    pageTitle: "Grupo Ingeniería 2024",
    user: { 
      name: "Profesor Carlos Mendoza", 
      role: "teacher", 
      initials: "CM" 
    },
    activePage: { groups: true },
    group: {
      name: "Ingeniería 2024",
      membersCount: 42,
      quizzesCount: 3,
      averageScore: 86,
      accessCode: "ING2024",
      members: [
        { name: "Ana García", email: "ana.garcia@gmail.com", progress: 92 },
        { name: "Carlos López", email: "carlos.lopez@gmail.com", progress: 88 },
        { name: "María Rodríguez", email: "maria.rodriguez@gmail.com", progress: 85 },
        { name: "Juan Martínez", email: "juan.martinez@gmail.com", progress: 90 }
      ],
      quizzes: [
        { title: "Matemáticas Avanzadas - Unidad 3", responses: "34/42", average: 87 },
        { title: "Física Mecánica - Dinámica", responses: "40/42", average: 84 },
        { title: "Programación Web - React", responses: "34/42", average: 90 }
      ]
    }
  };
  res.render('shared/group-info', mockData);
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

app.get('/profile', (req, res) => {
    const mockData = {
        "pageTitle": "Profesor",
        "page": {
            "title": "Mi perfil",
            "subtitle": "Gestiona tu información personal y configuración"
        },
        "user": {
            "name": "Profesor Carlos Mendoza",
            "initials": "CM",
            "email": "carlos.mendoza@universidad.edu",
            "role": "teacher",
            "memberSince": "2026-01-10",
            "bio": "Docente de matemáticas y física con más de 10 años de experiencia en educación superior."
        }
    };
    res.render('shared/profile', mockData)
});

app.get('/', (req, res) => {
    res.redirect('/auth/login');
})

const PORT = 3000;
app.listen(PORT, () => console.log(`Testotron corriendo en http://localhost:${PORT}`));