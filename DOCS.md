# Testotron — Documentación Técnica

> **Versión:** 1.0 | **Fecha:** 2026-05-18 | **Audiencia:** Desarrolladores, mantenedores y revisores técnicos

---

## Tabla de Contenidos

1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Registro de Módulos](#3-registro-de-módulos)
4. [Base de Datos](#4-base-de-datos)
5. [API y Endpoints](#5-api-y-endpoints)
6. [Documentación Frontend](#6-documentación-frontend)
7. [Lógica de Negocio](#7-lógica-de-negocio)
8. [Accesibilidad](#8-accesibilidad)
9. [Seguridad](#9-seguridad)
10. [Despliegue y Configuración del Entorno](#10-despliegue-y-configuración-del-entorno)
11. [Estándares de Desarrollo](#11-estándares-de-desarrollo)

---

## 1. Descripción General del Proyecto

### 1.1 Propósito

**Testotron** es una plataforma educativa de gestión de exámenes y cuestionarios diseñada para entornos hispanoparlantes. Permite a los docentes crear, publicar y calificar evaluaciones; organizar a sus estudiantes en grupos; y obtener reportes de resultados. Los estudiantes pueden unirse a grupos, rendir sus evaluaciones asignadas y consultar sus resultados una vez que hayan sido calificados.

### 1.2 Usuarios Objetivo

| Rol | Descripción |
|-----|-------------|
| **Estudiante** (`student`) | Puede unirse a grupos, tomar exámenes y ver sus resultados |
| **Docente** (`teacher`) | Crea y gestiona grupos, exámenes, preguntas y plantillas; califica entregas y revisa estadísticas |
| **Administrador** (`admin`) | Acceso total al sistema: puede gestionar todos los usuarios, grupos y exámenes |

### 1.3 Flujo Principal

```
Docente                          Estudiante
   │                                  │
   ├─ Crea grupo (código auto)        │
   ├─ Añade preguntas al banco        │
   ├─ Crea examen (desde banco        │    ← Recibe código de grupo
   │   o plantilla)                   │
   ├─ Publica examen ─────────────────┤
   │                              Estudiante se une al grupo
   │                              Accede a la lista de exámenes
   │                              Inicia intento (attempt)
   │                              Responde preguntas
   │                              Envía el intento
   │
   ├─ Califica el intento
   └─ Revisa resultados agregados
```

### 1.4 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | ≥ 18 |
| Framework HTTP | Express | 5.1.0 |
| Base de Datos | SQLite (better-sqlite3) | 8.3.0 |
| Autenticación | JSON Web Tokens (jsonwebtoken) | — |
| Hash de contraseñas | bcrypt | — |
| Renderizado de vistas | express-handlebars | 8.0.7 |
| Validación | Zod | 3.25.65 |
| UI | Bootstrap | 5.3.8 |
| Frontend | Vanilla JavaScript (ES6+) | — |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Capas

```
┌──────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                   │
│   Bootstrap 5 · Vanilla JS · Handlebars (compilado SSR)  │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP(S)
┌──────────────────────────▼───────────────────────────────┐
│                   Express Server (api/server.js)         │
│                                                          │
│  ┌──────────────┐          ┌───────────────────────────┐ │
│  │  SSR Layer   │          │        API Layer          │ │
│  │  /dashboard  │          │  /api/...                 │ │
│  │  /teacher    │          │  JSON responses           │ │
│  │  /student    │          │  JWT auth middleware      │ │
│  │  /groups     │          └───────────┬───────────────┘ │
│  │  /auth       │                      │                 │
│  └──────┬───────┘          ┌───────────▼───────────────┐ │
│         │                  │       Controllers          │ │
│         │                  │  user · group · test      │ │
│         │                  │  question · template      │ │
│         │                  │  attempt · answer         │ │
│         └──────────────────►  grading · test-question  │ │
│                            └───────────┬───────────────┘ │
│                                        │                 │
│                            ┌───────────▼───────────────┐ │
│                            │         Models             │ │
│                            │  Thin wrappers over DB     │ │
│                            └───────────┬───────────────┘ │
└────────────────────────────────────────┼─────────────────┘
                                         │ better-sqlite3
┌────────────────────────────────────────▼─────────────────┐
│                    SQLite (data.sqlite)                   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Carpetas

```
Testotron/
├── api/
│   ├── server.js             # Punto de entrada, Express config
│   ├── db.js                 # Inicialización de la DB y esquema
│   ├── controllers/          # Lógica de negocio por recurso
│   ├── models/               # Acceso a datos (SQL)
│   ├── routes/               # Definición de rutas API y SSR
│   ├── middleware/
│   │   ├── auth.js           # JWT validate + requireRole
│   │   ├── authPopulate.js   # Populate req.user sin fallar
│   │   └── ownership.js      # Verificación de propietario
│   └── services/             # Capa opcional sobre modelos
├── ssr/
│   ├── routes/               # Rutas SSR (HTML)
│   └── controllers/          # Controladores de vistas SSR
├── frontend/
│   ├── views/
│   │   ├── layouts/          # Layouts Handlebars (main, auth, quiz)
│   │   ├── shared/           # Vistas compartidas entre roles
│   │   ├── teacher/          # Vistas exclusivas del docente
│   │   ├── student/          # Vistas exclusivas del estudiante
│   │   └── admin/            # Panel de administración
│   ├── components/           # Parciales reutilizables
│   └── assets/
│       ├── js/               # Scripts del cliente
│       └── css/              # Estilos globales
└── data.sqlite               # Archivo de base de datos
```

---

## 3. Registro de Módulos

### 3.1 Tabla de Módulos

| Módulo | Ruta | Responsabilidad |
|--------|------|-----------------|
| **Server** | `api/server.js` | Inicializa Express, monta middleware y rutas |
| **DB** | `api/db.js` | Crea/migra el esquema SQLite, expone la instancia `db` |
| **Auth Middleware** | `api/middleware/auth.js` | Valida JWT, genera tokens, aplica control por rol |
| **AuthPopulate** | `api/middleware/authPopulate.js` | Rellena `req.user` de forma no bloqueante |
| **Ownership** | `api/middleware/ownership.js` | Verifica que el usuario autenticado sea propietario del recurso |
| **UserController** | `api/controllers/user.js` | Registro, login, perfil, CRUD usuarios |
| **GroupController** | `api/controllers/group.js` | Creación y gestión de grupos, membresía |
| **TestController** | `api/controllers/test.js` | CRUD de exámenes, publicación, cierre |
| **QuestionController** | `api/controllers/question.js` | CRUD del banco de preguntas |
| **TemplateController** | `api/controllers/template.js` | CRUD de plantillas, usar plantilla |
| **AttemptController** | `api/controllers/attempt.js` | Iniciar, obtener y enviar intentos |
| **AnswerController** | `api/controllers/answer.js` | Guardar respuestas, listar resultados |
| **GradingController** | `api/controllers/grading.js` | Calcular y guardar calificación final |
| **TestQuestionController** | `api/controllers/test-question.js` | CRUD de preguntas dentro de un examen |
| **User Model** | `api/models/user.js` | SQL para usuarios |
| **Group Model** | `api/models/group.js` | SQL para grupos y membresía |
| **Test Model** | `api/models/test.js` | SQL para exámenes y preguntas snapshot |
| **Question Model** | `api/models/questions.js` | SQL para banco de preguntas |
| **Template Model** | `api/models/quiz-template.js` | SQL para plantillas y secciones |
| **Attempt Model** | `api/models/attempt.js` | SQL para intentos |
| **AttemptAnswer Model** | `api/models/attempt-answer.js` | SQL para respuestas y resultados |
| **GroupService** | `api/services/group-service.js` | Fachada sobre el modelo de grupos |
| **TemplateService** | `api/services/template-service.js` | Fachada sobre el modelo de plantillas |
| **SSR Teacher** | `ssr/controllers/teacher.js` | Renderiza todas las vistas del docente |
| **SSR Dashboard** | `ssr/controllers/dashboard.js` | Panel principal por rol |
| **SSR Groups** | `ssr/controllers/groups.js` | Vistas de grupos (lista y detalle) |
| **SSR Student** | `ssr/controllers/student.js` | Vista de exámenes del estudiante |
| **SSR Admin** | `ssr/controllers/admin.js` | Panel de administración |
| **SSR Profile** | `ssr/controllers/profile.js` | Página de perfil de usuario |

### 3.2 Diagrama de Dependencias

```
server.js
  ├── middleware/authPopulate     (todos los requests)
  ├── routes/auth         → UserController → User Model
  ├── routes/users        → UserController → User Model
  ├── routes/groups       → GroupController → Group Model / GroupService
  ├── routes/tests        → TestController → Test Model
  │                       → QuestionController → Question Model
  ├── routes/templates    → TemplateController → Template Model / TemplateService
  ├── routes/attempts     → AttemptController → Attempt Model
  ├── routes/answers      → AnswerController → AttemptAnswer Model
  ├── routes/grading      → GradingController → Attempt Model
  └── ssr/routes/*        → ssr/controllers/* → (mismos modelos)
```

---

## 4. Base de Datos

### 4.1 Diagrama ER

```
users ──────────────────────────────────────────────────────────────┐
  │id (PK)                                                          │
  │email, name, password, role, bio                                 │
  │                                                                 │
  ├──< groups (owner_id FK)                                         │
  │      │code (PK), name, description                              │
  │      │                                                          │
  │      ├──< user_groups >── users                                 │
  │      │      (user_id, group_code) PK                            │
  │      │                                                          │
  │      └──< tests (group_code FK, owner_id FK) >── users          │
  │             │code (PK), title, description, instructions        │
  │             │status, time_limit_minutes, min_score              │
  │             │show_answers, allow_retries, shuffle_*             │
  │             │template_id FK ──────────────────────────────────┐ │
  │             │                                                 │ │
  │             ├──< test_questions                               │ │
  │             │      │id (PK), position, section_title          │ │
  │             │      │question, type, metadata, correct_answer  │ │
  │             │      │pts                                       │ │
  │             │      │original_question_id FK ──────────────────┤ │
  │             │      │                                          │ │
  │             │      └──< attempt_answers                       │ │
  │             │             (attempt_id, test_question_id) PK   │ │
  │             │             response, pts_obtained, feedback     │ │
  │             │             graded_by FK ── users               │ │
  │             │                                                 │ │
  │             └──< attempts (user_id FK, test_code FK)          │ │
  │                    id (PK), status, score, max_score           │ │
  │                    started_at, submitted_at, graded_at         │ │
  │                                                                │ │
  └──< questions (owner_id FK) <────────────────────────────────┘  │
  │      id (PK), question, type, metadata, correct_answer         │
  │      difficulty, category, is_public, source_type              │
  │                                                                 │
  │      └──< template_questions (question_id FK)                  │
  │                  id (PK), pts, required, position              │
  │                  template_section_id FK ────────────────────┐  │
  │                                                             │  │
  └──< quiz_templates (owner_id FK) <──────────────────────────┘  │
         id (PK), title, description, instructions               │
         time_limit_minutes, shuffle_questions, shuffle_answers  │
         └──< template_sections (template_id FK)                 │
                id (PK), title, description, position ───────────┘
```

### 4.2 Tablas Detalladas

#### `users`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único |
| `email` | TEXT | NOT NULL, UNIQUE | Correo electrónico del usuario |
| `name` | TEXT | NOT NULL | Nombre completo |
| `password` | TEXT | NOT NULL | Hash bcrypt de la contraseña |
| `role` | TEXT | CHECK IN ('student','teacher','admin'), DEFAULT 'student' | Rol del usuario |
| `bio` | TEXT | — | Descripción opcional |
| `created_at` | TEXT | DEFAULT now | Timestamp ISO 8601 |
| `updated_at` | TEXT | DEFAULT now | Timestamp ISO 8601 |

---

#### `groups`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `code` | TEXT | PK | Código alfanumérico auto-generado |
| `name` | TEXT | NOT NULL | Nombre del grupo |
| `owner_id` | INTEGER | FK → users.id | Docente propietario |
| `description` | TEXT | DEFAULT '' | Descripción opcional |
| `created_at` | TEXT | DEFAULT now | — |
| `updated_at` | TEXT | DEFAULT now | — |

**Índices:** `idx_groups_owner` sobre `owner_id`.

---

#### `user_groups`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `user_id` | INTEGER | PK (compuesto), FK → users.id | Estudiante |
| `group_code` | TEXT | PK (compuesto), FK → groups.code | Grupo |
| `role_in_group` | TEXT | DEFAULT 'member' | Rol dentro del grupo |
| `created_at` | TEXT | DEFAULT now | — |

---

#### `tests`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `code` | TEXT | PK | `crypto.randomBytes(4).toString('hex')` |
| `template_id` | INTEGER | FK → quiz_templates.id, nullable | Plantilla de origen |
| `owner_id` | INTEGER | FK → users.id | Docente propietario |
| `group_code` | TEXT | FK → groups.code, nullable | Grupo asignado |
| `title` | TEXT | NOT NULL | Título del examen |
| `description` | TEXT | DEFAULT '' | Descripción |
| `instructions` | TEXT | DEFAULT '' | Instrucciones para el estudiante |
| `category` | TEXT | DEFAULT '' | Categoría del examen |
| `status` | TEXT | CHECK IN ('draft','published','closed'), DEFAULT 'draft' | Estado |
| `time_limit_minutes` | INTEGER | nullable | Tiempo límite en minutos |
| `min_score` | REAL | DEFAULT 60 | Puntaje mínimo para aprobar |
| `show_answers` | INTEGER | boolean (0/1) | Mostrar respuestas al finalizar |
| `allow_retries` | INTEGER | boolean (0/1) | Permitir reintentos |
| `shuffle_questions` | INTEGER | boolean (0/1) | Aleatorizar orden de preguntas |
| `shuffle_answers` | INTEGER | boolean (0/1) | Aleatorizar opciones de respuesta |
| `settings` | TEXT | JSON | Configuraciones adicionales |
| `published_at` | TEXT | nullable | Timestamp de publicación |
| `due_at` | TEXT | nullable | Fecha límite de entrega |
| `created_at` | TEXT | DEFAULT now | — |
| `updated_at` | TEXT | DEFAULT now | — |

**Índices:** `idx_tests_owner` sobre `owner_id`.

---

#### `test_questions`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `test_code` | TEXT | FK → tests.code, CASCADE DELETE | Examen al que pertenece |
| `original_question_id` | INTEGER | FK → questions.id, SET NULL, nullable | Referencia al banco de preguntas |
| `section_title` | TEXT | nullable | Sección organizativa |
| `position` | INTEGER | DEFAULT 0 | Orden de aparición |
| `question` | TEXT | NOT NULL | Texto de la pregunta (snapshot) |
| `type` | TEXT | NOT NULL | Tipo: `text`, `mcq`, `select-multiple` |
| `metadata` | TEXT | JSON | Opciones, configuración extra |
| `correct_answer` | TEXT | JSON | Respuesta correcta |
| `pts` | INTEGER | DEFAULT 1 | Puntos asignados |
| `created_at` | TEXT | DEFAULT now | — |

> Las preguntas de un examen son **snapshots**: se copian del banco al crear el examen para que los cambios futuros en el banco no alteren exámenes publicados.

---

#### `questions`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `owner_id` | INTEGER | FK → users.id, CASCADE DELETE | Docente propietario |
| `question` | TEXT | NOT NULL | Texto de la pregunta |
| `type` | TEXT | NOT NULL | Tipo de pregunta |
| `source_type` | TEXT | CHECK IN ('bank','quiz'), DEFAULT 'bank' | Origen |
| `metadata` | TEXT | JSON | Opciones, configuración extra |
| `correct_answer` | TEXT | JSON | Respuesta correcta |
| `difficulty` | TEXT | DEFAULT 'medium' | `easy`, `medium`, `hard` |
| `category` | TEXT | DEFAULT '' | Categoría temática |
| `is_public` | INTEGER | boolean (0/1) | Visible para otros docentes |
| `created_at` | TEXT | DEFAULT now | — |
| `updated_at` | TEXT | DEFAULT now | — |

---

#### `quiz_templates`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `owner_id` | INTEGER | FK → users.id, CASCADE DELETE | Docente propietario |
| `title` | TEXT | NOT NULL | Nombre de la plantilla |
| `description` | TEXT | DEFAULT '' | Descripción |
| `instructions` | TEXT | DEFAULT '' | Instrucciones base |
| `time_limit_minutes` | INTEGER | nullable | Tiempo límite predeterminado |
| `shuffle_questions` | INTEGER | DEFAULT 0 | — |
| `shuffle_answers` | INTEGER | DEFAULT 0 | — |
| `created_at` | TEXT | DEFAULT now | — |
| `updated_at` | TEXT | DEFAULT now | — |

**Índices:** `idx_templates_owner` sobre `owner_id`.

---

#### `template_sections`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `template_id` | INTEGER | FK → quiz_templates.id, CASCADE DELETE | — |
| `title` | TEXT | NOT NULL | Título de la sección |
| `description` | TEXT | DEFAULT '' | — |
| `position` | INTEGER | DEFAULT 0 | Orden en la plantilla |
| `created_at` | TEXT | DEFAULT now | — |

---

#### `template_questions`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `template_section_id` | INTEGER | FK → template_sections.id, CASCADE DELETE | Sección padre |
| `question_id` | INTEGER | FK → questions.id, CASCADE DELETE | Pregunta del banco |
| `position` | INTEGER | DEFAULT 0 | Orden en la sección |
| `pts` | INTEGER | DEFAULT 1 | Puntos asignados |
| `required` | INTEGER | DEFAULT 1 | Pregunta obligatoria |
| `created_at` | TEXT | DEFAULT now | — |

---

#### `attempts`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | — |
| `user_id` | INTEGER | FK → users.id, CASCADE DELETE | Estudiante |
| `test_code` | TEXT | FK → tests.code, CASCADE DELETE | Examen rendido |
| `status` | TEXT | CHECK IN ('in_progress','submitted','graded'), DEFAULT 'in_progress' | Estado del intento |
| `started_at` | TEXT | DEFAULT now | Inicio del intento |
| `submitted_at` | TEXT | nullable | Momento de entrega |
| `graded_at` | TEXT | nullable | Momento de calificación |
| `score` | REAL | DEFAULT 0 | Puntaje obtenido |
| `max_score` | REAL | DEFAULT 0 | Puntaje máximo posible |
| `created_at` | TEXT | DEFAULT now | — |

---

#### `attempt_answers`

| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| `attempt_id` | INTEGER | PK (compuesto), FK → attempts.id, CASCADE DELETE | — |
| `test_question_id` | INTEGER | PK (compuesto), FK → test_questions.id, CASCADE DELETE | — |
| `response` | TEXT | JSON | Respuesta del estudiante |
| `pts_obtained` | REAL | DEFAULT 0 | Puntos obtenidos en esta respuesta |
| `feedback` | TEXT | nullable | Retroalimentación del docente |
| `graded_by` | INTEGER | FK → users.id, SET NULL | Docente que calificó |
| `graded_at` | TEXT | nullable | — |
| `created_at` | TEXT | DEFAULT now | — |
| `updated_at` | TEXT | DEFAULT now | — |

---

## 5. API y Endpoints

### 5.1 Convenciones Generales

- **Base URL:** `http://localhost:8080/api`
- **Autenticación:** Cookie HttpOnly `token` (preferida) o header `Authorization: Bearer <jwt>`
- **Formato de respuesta:** `application/json`
- **Errores:** Ver sección 5.2

### 5.2 Formato de Error Estándar

```json
// Error de validación (400)
{
  "status": 400,
  "error": "validation",
  "issues": [
    { "path": ["email"], "message": "Invalid email" }
  ]
}

// Error genérico
{
  "status": 401,
  "error": "Invalid credentials"
}
```

| Código | Significado |
|--------|-------------|
| `200` | Éxito |
| `201` | Recurso creado |
| `400` | Error de validación (Zod) |
| `401` | No autenticado / credenciales inválidas |
| `403` | Prohibido (rol insuficiente o no es propietario) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej. email ya existe) |
| `500` | Error interno del servidor |

---

### 5.3 Autenticación

#### `POST /api/auth/register`

Registra un nuevo usuario.

**Body:**
```json
{
  "name": "string (min 1)",
  "email": "email válido",
  "password": "string (min 6)",
  "role": "student | teacher | admin (opcional, default: student)"
}
```

**Respuesta (201):**
```json
{
  "user": { "id": 1, "name": "María", "email": "maria@example.com", "role": "student" }
}
```

---

#### `POST /api/auth/login`

Autentica al usuario y establece cookie JWT.

**Body:**
```json
{
  "email": "teacher@example.com",
  "password": "secreto123"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "email": "teacher@example.com", "name": "Juan", "role": "teacher" }
}
```

Establece cookie HttpOnly `token` con expiración de 7 días.

---

#### `POST /api/logout`

Elimina la cookie de sesión.

**Respuesta:** `200 OK` / redirect a `/auth/login` si es petición HTML.

---

### 5.4 Usuarios

#### `GET /api/users`
**Roles:** admin, teacher | **Descripción:** Lista todos los usuarios.

**Respuesta:**
```json
{ "users": [ { "id": 1, "name": "...", "email": "...", "role": "..." } ] }
```

---

#### `GET /api/users/:id`
**Roles:** cualquiera autenticado | **Descripción:** Obtiene un usuario por ID.

---

#### `PUT /api/users/:id`
**Roles:** propietario o admin | **Descripción:** Actualiza datos del usuario.

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "email": "nuevo@email.com",
  "password": "nueva (min 6)",
  "role": "student | teacher | admin",
  "bio": "Texto libre"
}
```

---

#### `PATCH /api/users`
**Roles:** cualquiera autenticado | **Descripción:** Actualiza el perfil del usuario autenticado. Para cambiar contraseña, requiere `currentPassword`, `newPassword` y `confirmPassword`.

---

#### `DELETE /api/users/:id`
**Roles:** admin | **Descripción:** Elimina un usuario.

---

### 5.5 Grupos

#### `POST /api/groups`
**Roles:** teacher, admin

**Body:**
```json
{ "name": "Grupo A", "description": "Descripción opcional" }
```

**Respuesta (200/redirect):** JSON `{ "group": {...} }` o redirect a `/groups`.

---

#### `GET /api/groups`
**Roles:** teacher, admin | Los docentes solo ven sus grupos.

**Respuesta:** `{ "groups": [...] }`

---

#### `GET /api/groups/:code`
**Roles:** cualquiera | Datos básicos del grupo.

---

#### `GET /api/groups/:code/detail`
**Roles:** cualquiera | Grupo con miembros, exámenes y estadísticas agregadas.

**Respuesta:**
```json
{
  "group": {
    "code": "ABC12",
    "name": "Grupo A",
    "members": [...],
    "quizzes": [...],
    "membersCount": 10,
    "quizzesCount": 3,
    "averageScore": 78.5
  }
}
```

---

#### `GET /api/groups/:code/members`
**Roles:** cualquiera | Lista de miembros del grupo.

---

#### `POST /api/groups/:code/add-user`
**Roles:** teacher, admin (propietario)

**Body:** `{ "email": "estudiante@example.com" }`

Busca al usuario por email y lo añade al grupo. Error `409` si ya es miembro.

---

#### `POST /api/groups/join`
**Roles:** student, teacher, admin

**Body:** `{ "code": "ABC12" }` | Permite al estudiante unirse a un grupo con su código.

---

#### `DELETE /api/groups/:code/members`
**Roles:** teacher, admin (propietario)

**Body:** `{ "user_id": 5 }`

---

#### `PUT /api/groups/:code`
**Roles:** teacher, admin (propietario)

**Body:** `{ "name": "...", "description": "..." }`

---

#### `DELETE /api/groups/:code`
**Roles:** teacher, admin (propietario)

---

### 5.6 Exámenes (Tests)

#### `POST /api/tests`
**Roles:** teacher, admin

**Body:**
```json
{
  "title": "Evaluación 1",
  "description": "...",
  "instructions": "...",
  "group_code": "ABC12",
  "template_id": null,
  "status": "draft",
  "time_limit_minutes": 60,
  "min_score": 70,
  "show_answers": true,
  "allow_retries": false,
  "shuffle_questions": false,
  "shuffle_answers": true,
  "questions": [
    { "question_id": 5, "pts": 2 },
    {
      "question": "¿Cuánto es 2+2?",
      "type": "mcq",
      "metadata": { "options": ["3", "4", "5"] },
      "correct_answer": "4",
      "pts": 1
    }
  ]
}
```

Las preguntas con `question_id` se copian como snapshot del banco. Las preguntas sin `question_id` se almacenan directamente.

**Respuesta (201):** `{ "success": true, "code": "a1b2c3d4" }`

---

#### `GET /api/tests`
**Query params:** `title` (LIKE), `group_code`, `owner_id`, `status`

Los docentes solo ven sus propios exámenes.

**Respuesta:** `{ "tests": [...] }`

---

#### `GET /api/tests/:code`
**Respuesta:** `{ "test": { ...campos } }`

---

#### `GET /api/tests/:code/detail`
**Respuesta:** `{ "test": { ...campos, "questions": [...] } }`

---

#### `PATCH /api/tests/:code`
**Roles:** teacher, admin (propietario)

Actualiza campos del examen. Si se incluye `questions`, reemplaza todas las preguntas existentes (clearTestQuestions + re-insert).

---

#### `DELETE /api/tests/:code`
**Roles:** teacher, admin (propietario) | Elimina en cascada intentos y respuestas.

---

#### `POST /api/tests/:code/publish`
**Roles:** teacher, admin (propietario)

Cambia `status` a `'published'` y registra `published_at`.

**Respuesta:** `{ "published": true }`

---

#### `POST /api/tests/:code/close`
**Roles:** teacher, admin (propietario)

Cambia `status` a `'closed'`.

**Respuesta:** `{ "closed": true }`

---

### 5.7 Preguntas (Banco)

#### `POST /api/questions`
**Roles:** teacher, admin

**Body:**
```json
{
  "question": "¿Cuál es la capital de Chile?",
  "type": "mcq",
  "metadata": { "options": ["Santiago", "Valparaíso", "Lima"] },
  "correct_answer": "Santiago",
  "difficulty": "easy",
  "category": "Geografía",
  "is_public": 0,
  "source_type": "bank"
}
```

---

#### `GET /api/questions`
**Query:** `owner_id` (opcional). Devuelve preguntas con `source_type='bank'`.

---

#### `GET /api/questions/:id` | `PATCH /api/questions/:id` | `DELETE /api/questions/:id`
Roles: any (GET) / teacher, admin (PATCH, DELETE).

---

### 5.8 Plantillas

#### `POST /api/templates`
**Roles:** teacher, admin

**Body:**
```json
{
  "title": "Plantilla Matemáticas",
  "description": "...",
  "instructions": "...",
  "time_limit_minutes": 45,
  "questions": [
    { "question_id": 3, "pts": 2 },
    { "question_id": 7, "pts": 1 }
  ]
}
```

Crea automáticamente una sección por defecto `'General'` y asocia las preguntas.

**Respuesta (201):** `{ "success": true, "template_id": 1 }`

---

#### `GET /api/templates/:id`
**Respuesta:** `{ "template": { ...campos, "questions": [...] } }`

---

#### `PATCH /api/templates/:id` | `DELETE /api/templates/:id`
**Roles:** teacher, admin (propietario).

---

#### `POST /api/templates/:id/use`
**Roles:** teacher, admin

Crea un examen borrador a partir de la plantilla. Redirige a `/teacher/quizzes/edit/{test_code}`.

---

### 5.9 Intentos (Attempts)

#### `POST /api/tests/:code/start`
**Roles:** cualquiera autenticado

Crea un nuevo intento para el usuario autenticado.

**Respuesta (201):** `{ "attempt": { "id": 1, "user_id": 2, "test_code": "a1b2" } }`

---

#### `GET /api/attempts/:id`
**Respuesta:** `{ "attempt": { ...campos } }`

---

#### `POST /api/attempts/:id/submit`
Marca el intento como `'submitted'` y registra `submitted_at`.

**Respuesta:** `{ "submitted": true }`

---

### 5.10 Respuestas (Answers)

#### `POST /api/attempt-answers`
**Body:**
```json
{
  "attempt_id": 1,
  "answers": [
    { "test_question_id": 3, "response": "Santiago" },
    { "test_question_id": 4, "response": ["opción1", "opción3"] }
  ]
}
```

Usa `ON CONFLICT` (upsert): actualiza si ya existe respuesta para ese par (attempt, question).

**Respuesta:** `{ "success": true }`

---

#### `GET /api/attempt-answers`
**Roles:** teacher, admin | **Query:** `test_code`, `attempt_id`, `user_id`

---

#### `GET /api/attempt-answers/:id`
Respuestas de un intento específico.

---

#### `GET /api/attempt-answers/results`
**Roles:** teacher, admin | **Query:** `owner_id`, `group_code`, `search`

Vista agregada con información del estudiante y estado calculado.

**Respuesta:**
```json
{
  "results": [
    {
      "attempt_id": 1,
      "student_name": "María López",
      "student_email": "maria@example.com",
      "quiz_title": "Evaluación 1",
      "group_name": "Grupo A",
      "score": 8,
      "max_score": 10,
      "percentage": 80,
      "status": "Aprobado",
      "raw_status": "graded",
      "submitted_at": "2026-05-18T11:05:00Z"
    }
  ]
}
```

**Lógica del estado calculado:**
- `raw_status = 'graded'` + `percentage >= min_score` → `"Aprobado"`
- `raw_status = 'graded'` + `percentage < min_score` → `"Reprobado"`
- `raw_status = 'submitted'` → `"Entregado"`
- otro → `"Pendiente"`

---

### 5.11 Calificación (Grading)

#### `POST /api/attempts/:id/grade`
**Roles:** teacher, admin

Suma `pts_obtained` de todas las `attempt_answers` del intento y el máximo posible de `test_questions`. Actualiza `attempts`: `score`, `max_score`, `status='graded'`, `graded_at`.

**Respuesta:** `{ "graded": true, "score": 8, "max_score": 10 }`

---

### 5.12 Preguntas de Examen (Test Questions)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tests/:code/questions` | Lista preguntas del examen |
| POST | `/api/tests/:code/questions` | Añade pregunta al examen |
| PATCH | `/api/test-questions/:id` | Actualiza pregunta del examen |
| DELETE | `/api/test-questions/:id` | Elimina pregunta del examen |

---

### 5.13 Endpoints SSR (Vistas HTML)

Estos endpoints son manejados por la capa SSR y devuelven HTML renderizado con Handlebars.

| Método | Ruta | Vista | Rol requerido |
|--------|------|-------|---------------|
| GET | `/auth/login` | Login | — |
| GET | `/auth/register` | Registro | — |
| GET | `/dashboard` | Panel principal | cualquiera |
| GET | `/groups` | Lista de grupos | cualquiera |
| GET | `/groups/:id` | Detalle de grupo | cualquiera |
| GET | `/teacher/quizzes` | Lista de exámenes | teacher |
| GET | `/teacher/quizzes/create` | Formulario crear examen | teacher |
| GET | `/teacher/quizzes/edit/:code` | Editar examen | teacher |
| GET | `/teacher/quizzes/view/:code` | Ver examen (solo lectura) | teacher |
| GET | `/teacher/questions` | Banco de preguntas | teacher |
| GET | `/teacher/templates` | Lista de plantillas | teacher |
| GET | `/teacher/templates/edit/:id` | Editar plantilla | teacher |
| GET | `/teacher/results` | Resultados y calificaciones | teacher |
| GET | `/student/quizzes` | Exámenes disponibles | student |
| GET | `/profile` | Perfil del usuario | cualquiera |
| GET | `/admin` | Panel de administración | admin |

---

## 6. Documentación Frontend

### 6.1 Layouts

#### Layout Principal (`frontend/views/layouts/main.hbs`)
Estructura base para todas las páginas autenticadas.

```
┌─────────────────────────────────────┐
│ Navbar (logo, usuario, logout)       │
├──────────┬──────────────────────────┤
│ Sidebar  │   Contenido Principal    │
│ 14% ancho│   {{{body}}}             │
│          │                          │
│ ─ Inicio │                          │
│ ─ Grupos │                          │
│ ─ Exámenes                          │
│ ─ Preguntas                         │
│ ─ Plantillas                        │
└──────────┴──────────────────────────┘
│              Footer                  │
└─────────────────────────────────────┘
```

Incluye enlace "Saltar al contenido" accesible al inicio del DOM.

#### Layout de Autenticación (`frontend/views/layouts/auth.hbs`)
Formulario centrado verticalmente. Sin sidebar ni navbar.

#### Layout de Cuestionario (`frontend/views/layouts/quiz.hbs`)
Interfaz inmersiva de tiempo completo:
```
┌──────────────── Barra de progreso ──────────────────┐
│ Temporizador │  Pregunta actual  │ Nav. preguntas   │
│              │                   │ [1][2][3][4]...  │
│              │  [opciones / campo de texto]         │
│              │                   │                  │
│              │  [ Anterior ] [ Siguiente ]          │
└─────────────────────────────────────────────────────┘
```

### 6.2 Flujo de Navegación

```
/auth/login
     │
     ▼
/dashboard (rol-aware)
     │
     ├──[teacher]──► /teacher/quizzes
     │                    │
     │               /teacher/quizzes/create
     │               /teacher/quizzes/edit/:code
     │               /teacher/quizzes/view/:code
     │
     ├──[teacher]──► /teacher/questions
     │
     ├──[teacher]──► /teacher/templates
     │                    │
     │               /teacher/templates/edit/:id
     │
     ├──[teacher]──► /teacher/results
     │
     ├──[any]──────► /groups
     │                    │
     │               /groups/:id (detalle)
     │
     ├──[student]──► /student/quizzes
     │                    │
     │               (modal o redirect a quiz tomado)
     │
     ├──[any]──────► /profile
     │
     └──[admin]────► /admin
```

### 6.3 Componentes Reutilizables

| Parcial | Archivo | Descripción |
|---------|---------|-------------|
| `navbar` | `components/navbar.hbs` | Barra de navegación superior con usuario y logout |
| `sidebar` | `components/sidebar.hbs` | Menú lateral con links según rol |
| `footer` | `components/footer.hbs` | Pie de página |
| `quiz-card` | `components/quiz-card.hbs` | Tarjeta de examen (título, estado, fecha) |
| `group-card` | `components/group-card.hbs` | Tarjeta de grupo con estadísticas |
| `template-card` | `components/template-card.hbs` | Tarjeta de plantilla |
| `question-card` | `components/question-card.hbs` | Tarjeta de pregunta del banco |
| `question-modal` | `components/question-modal.hbs` | Modal de creación/edición de preguntas |
| `group-modal` | `components/group-modal.hbs` | Modal de creación/edición de grupos |
| `join-group-modal` | `components/join-group-modal.hbs` | Modal para unirse a un grupo con código |
| `quiz-actions` | `components/quiz-actions.hbs` | Botones de acciones sobre exámenes |
| `result-box` | `components/result-box.hbs` | Resumen de resultado (puntaje, estado) |
| `answer-item` | `components/answer-item.hbs` | Ítem de respuesta (vista de corrección) |
| `progress-bar` | `components/progress-bar.hbs` | Barra de progreso del cuestionario |
| `timer` | `components/timer.hbs` | Temporizador regresivo |
| `question-nav` | `components/question-nav.hbs` | Navegación por número de pregunta |
| `db-table` | `components/db-table.hbs` | Tabla genérica para panel admin |
| `group-stats` | `components/group-stats.hbs` | Estadísticas de grupo |
| `profile-summary-card` | `components/profile-summary-card.hbs` | Tarjeta resumen de perfil |
| `auth-header` | `components/auth-header.hbs` | Cabecera de páginas de auth |
| `quick-access` | `components/quick-access.hbs` | Ingreso rápido a grupo |

### 6.4 Scripts del Cliente

| Archivo | Descripción |
|---------|-------------|
| `api-client.js` | Cliente centralizado: `login`, `register`, `fetchTests`, `getTest`, `createTest`, `submitAnswers`, etc. Usa `window.__API_BASE__` y localStorage para token. |
| `auth.js` | Manejadores de formularios de login/registro. Llama a `apiClient` y redirige. |
| `logout.js` | Envía POST `/api/logout` y limpia localStorage. |
| `hydrate-user.js` | Rellena el DOM con nombre/email del usuario desde localStorage. |
| `quick-access.js` | Lógica del componente de ingreso rápido a grupo. |
| `create-quiz.js` | Interfaz completa de creación y edición de exámenes (442 líneas): selección de preguntas, asignación de puntos, configuración. |
| `question-modal.js` | Modal de creación/edición de preguntas del banco (860 líneas): tipos de pregunta, opciones, dificultad, categoría. |
| `student-quiz.js` | Interfaz de toma de examen (170 líneas): carga preguntas, renderiza formulario, maneja envío. |
| `results-page.js` | Vista de resultados del docente (89 líneas). |
| `teacher-quizzes.js` | Dashboard de exámenes del docente (42 líneas). |
| `quizzes-page.js` | Página de exámenes (lista y filtros, 86 líneas). |
| `quiz.js` | Lógica base del cuestionario (34 líneas). |
| `env.js` | Inicializa `window.__API_BASE__`. |

### 6.5 Variables CSS Personalizadas

```css
:root {
  --color-primary:      #2B7FFF;  /* Azul principal */
  --color-success:      #00C950;  /* Verde */
  --color-accent:       #AD46FF;  /* Violeta */
  --color-primary-dark: #1e66cc;  /* Hover azul */
  --color-success-dark: #00a843;  /* Hover verde */
  --sidebar-width:      14%;
}
```

---

## 7. Lógica de Negocio

### 7.1 Ciclo de Vida de un Examen

```
draft ──[publish]──► published ──[close]──► closed
  │                      │
  │◄──[update/patch]─────┘ (solo en draft)
  │
  └──[delete]──► (eliminado con cascada)
```

- Un examen solo puede ser tomado por estudiantes cuando está en estado `published`.
- Al publicar, se registra `published_at`.
- Al cerrar, no se aceptan nuevos intentos.

### 7.2 Snapshots de Preguntas

Cuando se crea un examen con preguntas del banco (`question_id`), el sistema copia los datos de la pregunta en la tabla `test_questions`. El campo `original_question_id` mantiene la referencia pero los cambios posteriores al banco **no afectan** el examen ya creado.

```javascript
// TestController.create — lógica de snapshot
if (q.question_id) {
  const original = getQuestion(q.question_id);
  addTestQuestion({
    test_code: code,
    original_question_id: q.question_id,
    question: original.question,
    type: original.type,
    metadata: original.metadata,
    correct_answer: original.correct_answer,
    pts: q.pts || original.pts || 1
  });
} else {
  addTestQuestion({ test_code: code, ...q });
}
```

### 7.3 Flujo Completo de Calificación

```
1. Docente POST /api/attempts/:id/grade
2. GradingController.grade:
   a. Obtiene todas las attempt_answers del intento
   b. Suma pts_obtained → score
   c. Obtiene todas las test_questions del examen
   d. Suma pts → max_score
   e. updateAttemptScore(id, score, max_score)
      → status = 'graded', graded_at = now()
3. Resultado disponible en /api/attempt-answers/results
```

### 7.4 Estado de Resultado por Estudiante

El estado se calcula en `listTeacherResults`:

```
percentage = (score / max_score) * 100

IF raw_status = 'graded':
  IF percentage >= min_score → "Aprobado"
  ELSE                       → "Reprobado"
ELSE IF raw_status = 'submitted':
  → "Entregado"
ELSE:
  → "Pendiente"
```

### 7.5 Generación de Códigos

- **Grupos:** Código alfanumérico, auto-generado por el modelo. Único en la tabla.
- **Exámenes:** `crypto.randomBytes(4).toString('hex')` → 8 caracteres hexadecimales.

### 7.6 Permisos y Ownership

```
requireOwnership(resource) aplica para: 'group' | 'test' | 'template'

1. Admins → bypass (siempre permitido)
2. Obtiene owner_id del recurso en la DB
3. Si owner_id !== req.user.id → 403 Forbidden
```

### 7.7 Validación con Zod

Los controladores de usuario usan esquemas Zod explícitos:

```javascript
// UserController.register
const schema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['student','teacher','admin']).optional()
});
```

Los errores de validación Zod se capturan en `handleError(err, res)` y se retornan como `{ status: 400, error: 'validation', issues: [...] }`.

### 7.8 Membresía en Grupos

- `addMember` es idempotente: si el usuario ya es miembro, retorna `0` (sin lanzar error).
- `addMemberByEmail` sí lanza error si el usuario ya es miembro (para el formulario de invitación).
- Estudiantes pueden unirse con `POST /api/groups/join` usando el código del grupo.

---

## 8. Accesibilidad

### 8.1 Idioma de la Interfaz

- **Idioma principal:** Español (es)
- Todo el texto de la UI debe estar en español.
- El atributo `lang="es"` debe estar presente en el elemento `<html>` del layout principal.

### 8.2 Enlace de Salto

El layout principal incluye un enlace oculto visible al recibir foco:

```html
<a href="#main-content" class="skip-to-content">Saltar al contenido principal</a>
```

Este enlace permite a los usuarios de lectores de pantalla y teclado saltar la navegación repetitiva.

### 8.3 HTML Semántico

| Elemento | Uso esperado |
|----------|-------------|
| `<main>` | Contenido principal de la página |
| `<nav>` | Barra de navegación y sidebar |
| `<header>` | Cabecera de la aplicación |
| `<footer>` | Pie de página |
| `<section>` | Secciones temáticas dentro de una vista |
| `<article>` | Tarjetas de examen, grupo, pregunta |
| `<form>` | Todos los formularios con `<label>` asociados |
| `<button>` | Acciones (no usar `<div>` con onclick) |

### 8.4 Formularios Accesibles

```html
<!-- Correcto -->
<label for="email">Correo electrónico</label>
<input id="email" type="email" name="email" required aria-required="true" />

<!-- Para errores -->
<input aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert">El correo es obligatorio</span>
```

### 8.5 Botones y Controles

- Todos los `<button>` deben tener texto visible o `aria-label` descriptivo en español.
- Los íconos (Bootstrap Icons) deben tener `aria-hidden="true"` si van acompañados de texto.

```html
<button type="submit" aria-label="Guardar cambios">
  <i class="bi bi-save" aria-hidden="true"></i>
  Guardar
</button>
```

### 8.6 Contenido Dinámico

- Los modales deben incluir `role="dialog"`, `aria-modal="true"` y `aria-labelledby`.
- Las notificaciones/alertas deben usar `role="alert"` o `aria-live="polite"`.

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
  <h2 id="modal-title">Crear Pregunta</h2>
  ...
</div>
```

### 8.7 Temporizador de Examen

El temporizador debe anunciar intervalos críticos a los lectores de pantalla:

```html
<div id="timer" aria-live="polite" aria-atomic="true">
  Tiempo restante: <span id="time-display">45:00</span>
</div>
```

### 8.8 Contraste y Foco

- El color primario `#2B7FFF` sobre fondo blanco cumple WCAG AA (contraste ≥ 4.5:1 para texto normal).
- Todos los elementos interactivos deben tener estilos de foco visibles (`:focus-visible`).
- No eliminar `outline` sin reemplazarlo por un indicador equivalente.

### 8.9 Checklist WCAG 2.1 (mínimo nivel AA)

| Criterio | Descripción |
|----------|-------------|
| 1.1.1 | Alternativas de texto para imágenes y íconos |
| 1.3.1 | Información y relaciones mediante semántica HTML |
| 1.4.3 | Contraste mínimo de 4.5:1 para texto normal |
| 2.1.1 | Toda funcionalidad accesible por teclado |
| 2.4.1 | Enlace de salto al contenido principal |
| 2.4.3 | Orden de foco lógico |
| 3.1.1 | `lang="es"` en el elemento `<html>` |
| 3.3.1 | Mensajes de error identificados y descriptivos |
| 4.1.2 | Nombre, rol y valor para todos los componentes UI |

---

## 9. Seguridad

### 9.1 Autenticación

- **JWT** con 8 horas de expiración (cookie) y 7 días en cookie persistente.
- La cookie usa `httpOnly: true` para prevenir acceso desde JavaScript del cliente.
- En producción (`NODE_ENV=production`), la cookie usa `secure: true` (solo HTTPS).
- El payload del token contiene `{ id, email, name, role }` — no incluir datos sensibles.

### 9.2 Hash de Contraseñas

- Las contraseñas se almacenan como hash bcrypt con factor de costo por defecto.
- La contraseña en texto plano **nunca** se registra ni retorna en respuestas.

### 9.3 Autorización por Rol

```
authMiddleware           → Verifica JWT (401 si inválido/ausente)
requireRole(...roles)    → Verifica rol del usuario (403 si no coincide)
requireOwnership(resource) → Verifica propiedad del recurso (403 si no es dueño)
```

### 9.4 Validación de Entrada

- Zod en los endpoints de usuario para validación estricta de tipos y formatos.
- Los parámetros de ruta y query se usan directamente en consultas SQL mediante `better-sqlite3` con **parámetros preparados** (`stmt.get(param)`), lo que previene SQL Injection.

### 9.5 Protección contra SQL Injection

`better-sqlite3` usa sentencias preparadas en todas las consultas:

```javascript
// Correcto — parametrizado
const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
return stmt.get(email);

// NUNCA hacer
db.exec(`SELECT * FROM users WHERE email = '${email}'`);
```

### 9.6 CORS

El servidor debe configurar CORS apropiadamente para el entorno de producción (restringir `origin` al dominio de la aplicación).

### 9.7 Headers de Seguridad Recomendados

Para producción, se recomienda agregar middleware como `helmet`:

```javascript
// Recomendado en api/server.js para producción
const helmet = require('helmet');
app.use(helmet());
```

Esto añade: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, entre otros.

### 9.8 XSS

- Handlebars escapa HTML por defecto usando `{{variable}}`.
- Usar `{{{triple-stache}}}` solo cuando el contenido es confiable y sanitizado.
- El contenido generado por usuarios (nombres, descripciones) debe renderizarse siempre con doble llave.

### 9.9 CSRF

Al usarse cookies HttpOnly para la autenticación, se recomienda implementar protección CSRF en operaciones de mutación (POST/PUT/DELETE). Para APIs consumidas por JavaScript, el header `Content-Type: application/json` actúa como protección básica de mismo origen.

---

## 10. Despliegue y Configuración del Entorno

### 10.1 Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `JWT_SECRET` | **Sí** | — | Clave secreta para firmar y verificar JWT |
| `PORT` | No | `8080` | Puerto en que escucha el servidor |
| `NODE_ENV` | No | `development` | `production` activa cookies `secure` |
| `APP_NAME` | No | `Testotron` | Nombre mostrado en la UI |

Crear un archivo `.env` en la raíz:

```env
JWT_SECRET=tu_clave_secreta_aqui
PORT=8080
NODE_ENV=development
APP_NAME=Testotron
```

### 10.2 Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Testotron

# 2. Instalar dependencias
npm install

# 3. Inicializar la base de datos
npm run api:init

# 4. Iniciar el servidor
npm start
# → http://localhost:8080
```

### 10.3 Scripts NPM

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor Express |
| `npm run api:init` | Crea/actualiza el esquema en `data.sqlite` |

### 10.4 Consideraciones de Producción

1. **HTTPS:** Usar un proxy inverso (Nginx, Caddy) con certificado TLS.
2. **Variables de entorno:** Nunca commitear `.env` con credenciales reales.
3. **JWT_SECRET:** Usar un string aleatorio de alta entropía (≥ 32 caracteres).
4. **Base de datos:** Para mayor carga, considerar migrar de SQLite a PostgreSQL.
5. **Archivos estáticos:** Servir `frontend/assets/` desde CDN o con cache agresivo.
6. **Logs:** Integrar `morgan` o similar para logs de acceso en producción.
7. **`NODE_ENV=production`:** Activa cookies seguras y puede afectar comportamientos del framework.

```nginx
# Ejemplo Nginx (proxy inverso)
server {
  listen 443 ssl;
  server_name testotron.example.com;

  location / {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 10.5 Respaldo de Base de Datos

```bash
# SQLite — copiar el archivo
cp data.sqlite data.sqlite.backup.$(date +%Y%m%d)
```

---

## 11. Estándares de Desarrollo

### 11.1 Estructura de Carpetas

```
api/controllers/    Controladores: validan input, llaman modelos, retornan respuesta
api/models/         Acceso a datos: solo SQL, sin lógica de negocio
api/routes/         Definición de rutas y montaje de middleware
api/middleware/     Funciones de middleware Express
api/services/       Lógica de orquestación opcional (capa sobre modelos)
ssr/controllers/    Controladores que renderizan vistas Handlebars
ssr/routes/         Rutas SSR con autenticación y control de rol
frontend/views/     Plantillas Handlebars por rol
frontend/components/ Parciales reutilizables
frontend/assets/js/ Scripts del cliente (un archivo por funcionalidad)
frontend/assets/css/ Estilos globales
```

### 11.2 Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos JS | `kebab-case.js` | `create-quiz.js`, `api-client.js` |
| Clases JS | `PascalCase` | `GroupController`, `UserModel` |
| Métodos y variables | `camelCase` | `createGroup`, `ownerId` |
| Rutas API | `kebab-case` | `/api/attempt-answers`, `/api/test-questions` |
| Tablas DB | `snake_case` | `user_groups`, `quiz_templates` |
| Campos DB | `snake_case` | `owner_id`, `created_at`, `min_score` |
| Vistas Handlebars | `kebab-case.hbs` | `group-info.hbs`, `create_quiz.hbs` |
| Variables CSS | `--kebab-case` | `--color-primary`, `--sidebar-width` |

### 11.3 Patrones de Código

**Controladores:** Son clases con métodos estáticos. Cada método sigue el patrón:

```javascript
static async methodName(req, res) {
  try {
    // 1. Validar input (Zod si aplica)
    // 2. Llamar modelo/servicio
    // 3. Retornar respuesta JSON o redirect
  } catch (err) {
    handleError(err, res);
  }
}
```

**Modelos:** Funciones puras que retornan datos o lanzan errores. Sin lógica HTTP.

```javascript
// Correcto
export function getGroup(code) {
  return db.prepare('SELECT * FROM groups WHERE code = ?').get(code);
}

// Incorrecto — el modelo no debe conocer req/res
export function getGroup(req, res) { ... }
```

**Rutas:** Solo registran el path, método y middleware. No contienen lógica.

```javascript
router.get('/:code', authMiddleware, GroupController.get);
router.post('/', authMiddleware, requireRole('teacher','admin'), GroupController.create);
```

### 11.4 Manejo de Errores

```javascript
// api/controllers/utils.js
export function handleError(err, res) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ status: 400, error: 'validation', issues: err.issues });
  }
  console.error(err);
  res.status(err.status || 500).json({ status: err.status || 500, error: err.message || 'Internal error' });
}
```

**Convención:**
- Lanzar errores con `Object.assign(new Error(msg), { status: 403 })` para propagar el código HTTP.
- Los controladores siempre envuelven en `try/catch` y llaman a `handleError`.

### 11.5 Respuestas Consistentes

```javascript
// Creación exitosa
res.status(201).json({ success: true, code: test.code });

// Listado
res.json({ tests: rows });

// Operación booleana
res.json({ published: true });

// Redirect (SSR)
res.redirect('/teacher/quizzes');
```

### 11.6 Decisiones de Diseño Notables

| Decisión | Razón |
|----------|-------|
| Preguntas como snapshots en `test_questions` | Inmutabilidad: cambios al banco no rompen exámenes publicados |
| Código de grupo auto-generado | Facilita el sharing sin URLs largas |
| SSR + API en el mismo proceso | Simplicidad de despliegue (un solo puerto) |
| SQLite para almacenamiento | Sin dependencias externas; suficiente para escala educativa pequeña/mediana |
| `authPopulate` no bloqueante | Permite que las rutas SSR manejen el redirect en lugar del middleware |

---

*Documentación generada el 2026-05-18 para Testotron v1.0.*
