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
        stats: { total: 0, active: 0, drafts: 0, totalResponses: 0 },
        quizzes: []
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
        "templates": []
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
        "stats": { "totalQuestions": 0, "mostUsed": 0 },
        "questions": [],
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
    groups: [],
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
    results: []
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
        tables: []
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

app.get('/student/quizzes', (req, res) => {
  const mockData = {
    appName: "Testotron",
    pageTitle: "Mis cuestionarios",
    pageDescription: "Consulta y realiza tus cuestionarios asignados",
    user: { 
      name: "Ana García", 
      role: "student", 
      initials: "AG" 
    },
    activePage: { studentQuizzes: true },
    filters: {
      group: "Todos los grupos",
      status: "Todos los estados",
      search: ""
    },
    stats: {
      totalAssigned: 6,
      completed: 3,
      pending: 3,
      averageScore: 82.3
    },
    quizzes: []
  };
  res.render('student/quizzes', mockData);
});

app.get('/student/quiz/:id', (req, res) => {
    const mockData = {
        appName: "Testotron",
        "quizTitle": "Matemáticas avanzadas - Unidad 3",
        "quizCode": "QUIZ-1",
        user: { 
            name: "Ana García", 
            role: "student", 
            initials: "AG" 
        },
        "timer": {
            "timeLimit": 1800,
            "elapsedTime": 0
        },
        "progress": {
            "current": 0,
            "total": 7
        },
        "questions": [],
        "layout": "quiz"
    };
    res.render('student/quiz', mockData);
});

app.get('/results/quiz/:id', (req, res) => {
    // const mockData = {
    //     appName: "Testotron",
    //     user: { 
    //         name: "Ana García", 
    //         role: "student", 
    //         initials: "AG" 
    //     },
    //     "quizTitle": "Matemáticas avanzadas - Unidad 3",
    //     "quizCode": "QUIZ-1",
    //     "result": {
    //         "status": "Aprobado",
    //         "scorePercent": 87,
    //         "correctAnswers": 13,
    //         "totalQuestions": 15,
    //         "timeSpent": "24:35",
    //         "minScore": 70
    //     },
    //     "answers": [
    //         {
    //         "id": 1,
    //         "text": "¿Cuál es la derivada de la función f(x) = x²?",
    //         "userAnswer": "2x",
    //         "isCorrect": true
    //         },
    //         {
    //         "id": 2,
    //         "text": "¿Cuál es el resultado de la integral ∫3 dx?",
    //         "userAnswer": "3x + c",
    //         "isCorrect": true
    //         },
    //         {
    //         "id": 3,
    //         "text": "¿Qué es un límite en cálculo?",
    //         "userAnswer": "El valor al que se aproxima una función",
    //         "isCorrect": true
    //         },
    //         {
    //         "id": 4,
    //         "text": "Resuelve: lim(x→0) sin(x)/x",
    //         "userAnswer": "0",
    //         "isCorrect": false,
    //         "correctAnswer": "1"
    //         },
    //         {
    //         "id": 5,
    //         "text": "¿Cuál es la regla de la cadena?",
    //         "userAnswer": "d/dx[f(g(x))] = f’(g(x))g’(x)",
    //         "isCorrect": true
    //         }
    //     ],
    //     "groupStats": {
    //         "average": 82,
    //         "position": 5,
    //         "totalStudents": 42,
    //         "highestScore": 98
    //     }
    // };

    const mockData = {
        appName: "Testotron",
        user: { 
            name: "Ana García", 
            role: "student", 
            initials: "AG" 
        },
        "quizTitle": "Matemáticas avanzadas - Unidad 3",
        "score": 87,
        "minScore": 70,
        "correctAnswers": 13,
        "totalQuestions": 15,
        "timeSpent": "24:35",
        "passed": true,
        "answers": [
            {
            "question": "¿Cuál es la derivada de la función f(x) = x²?",
            "yourAnswer": "2x",
            "isCorrect": true
            },
            {
            "question": "¿Cuál es el resultado de la integral ∫3x dx?",
            "yourAnswer": "(3/2)x²",
            "isCorrect": true
            },
            {
            "question": "¿Qué es un límite en cálculo?",
            "yourAnswer": "El valor al que se aproxima una función",
            "isCorrect": true
            },
            {
            "question": "Resuelve: lim(x→0) sin(x)/x",
            "yourAnswer": "0",
            "isCorrect": false,
            "correctAnswer": "1"
            },
            {
            "question": "¿Cuál es la regla de la cadena?",
            "yourAnswer": "d/dx[f(g(x))] = f’(g(x))g’(x)",
            "isCorrect": true
            }
        ],
        "groupStats": {
            "average": 82,
            "position": 5,
            "totalStudents": 42,
            "highestScore": 98
        }
        };


    res.render('shared/quiz-result', mockData);
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

        groups: []
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
        authAction: '/auth/login',
        registerUrl: '/auth/register',
        quickAccessAction: '/quizzes/join',
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
        authAction: '/auth/register',
        loginUrl: '/auth/login',
        quickAccessAction: '/quizzes/join',
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

const PORT = process.env.FRONTEND_PORT || 3001;
app.listen(PORT, () => console.log(`Frontend (server2) corriendo en http://localhost:${PORT}`));
