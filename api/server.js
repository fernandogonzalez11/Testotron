const express = require('express');
const cors = require('cors');
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
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:8080' }));

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

// protected/resource routes
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/tests', testRoutes);
app.use('/sections', sectionRoutes);
app.use('/items', itemRoutes);
app.use('/templates', templateRoutes);
app.use('/answers', answerRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});