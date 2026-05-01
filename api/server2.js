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

const PORT = 3000;
app.listen(PORT, () => console.log(`Testotron corriendo en http://localhost:${PORT}/teacher/quizzes`));