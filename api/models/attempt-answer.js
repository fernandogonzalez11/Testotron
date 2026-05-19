const { getDB } = require('../db');

// Upsert an attempt answer (one row per attempt_id + test_question_id)
function upsertAttemptAnswer({ attempt_id, test_question_id, response = null, pts_obtained = 0, feedback = null, graded_by = null }) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO attempt_answers (attempt_id, test_question_id, response, pts_obtained, feedback, graded_by, graded_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    ON CONFLICT(attempt_id, test_question_id) DO UPDATE SET
      response = excluded.response,
      pts_obtained = excluded.pts_obtained,
      feedback = excluded.feedback,
      graded_by = excluded.graded_by,
      graded_at = excluded.graded_at,
      updated_at = datetime('now')
  `);
  const info = stmt.run(attempt_id, test_question_id, JSON.stringify(response), pts_obtained, feedback, graded_by);
  return info.changes;
}

function getAttemptAnswers(attempt_id) {
  const db = getDB();
  const rows = db.prepare(`
    SELECT aa.attempt_id, aa.test_question_id, aa.response, aa.pts_obtained, aa.feedback, aa.graded_by, aa.graded_at, tq.question, tq.pts
    FROM attempt_answers aa
    JOIN test_questions tq ON tq.id = aa.test_question_id
    WHERE aa.attempt_id = ?
    ORDER BY tq.position ASC
  `).all(Number(attempt_id));

  return rows.map(r => ({
    attempt_id: r.attempt_id,
    test_question_id: r.test_question_id,
    response: r.response ? JSON.parse(r.response) : null,
    pts_obtained: r.pts_obtained,
    feedback: r.feedback,
    graded_by: r.graded_by,
    graded_at: r.graded_at,
    question: r.question,
    pts: r.pts
  }));
}

function listAttemptAnswers(filters = {}) {
  const db = getDB();
  let q = `SELECT aa.attempt_id, aa.test_question_id, aa.pts_obtained, aa.feedback, aa.updated_at, a.user_id, a.test_code FROM attempt_answers aa JOIN attempts a ON a.id = aa.attempt_id WHERE 1=1`;
  const params = [];
  if (filters.user_id) { q += ' AND a.user_id = ?'; params.push(filters.user_id); }
  if (filters.test_code) { q += ' AND a.test_code = ?'; params.push(filters.test_code); }
  if (filters.attempt_id) { q += ' AND aa.attempt_id = ?'; params.push(filters.attempt_id); }
  q += ' ORDER BY aa.updated_at DESC';
  return db.prepare(q).all(...params);
}

function listTeacherResults(filters = {}) {

    const db = getDB();

    let q = `
        SELECT
            a.id AS attempt_id,
            a.user_id,
            u.name AS student_name,
            u.email AS student_email,

            a.test_code,
            t.title AS quiz_title,
            t.group_code,
            g.name AS group_name,

            a.status,

            a.score,
            a.max_score,

            ROUND(
                CASE
                    WHEN a.max_score > 0
                    THEN (
                        a.score * 100.0 /
                        a.max_score
                    )
                    ELSE 0
                END,
                2
            ) AS percentage,

            a.started_at,
            a.submitted_at,
            a.graded_at,
            a.created_at

        FROM attempts a

        INNER JOIN tests t
            ON t.code = a.test_code

        INNER JOIN users u
            ON u.id = a.user_id

        LEFT JOIN groups g
            ON g.code = t.group_code

        WHERE 1=1
    `;

    const params = [];

    /*
    =========================================
    OWNER FILTER
    =========================================
    */

    if (filters.owner_id) {

        q += `
            AND t.owner_id = ?
        `;

        params.push(
            filters.owner_id
        );
    }

    /*
    =========================================
    GROUP FILTER
    =========================================
    */

    if (filters.group_code) {

        q += `
            AND t.group_code = ?
        `;

        params.push(
            filters.group_code
        );
    }

    /*
    =========================================
    SEARCH FILTER
    =========================================
    */

    if (filters.search) {

        q += `
            AND (
                t.title LIKE ?
                OR u.name LIKE ?
                OR u.email LIKE ?
            )
        `;

        const searchLike =
            `%${filters.search}%`;

        params.push(
            searchLike,
            searchLike,
            searchLike
        );
    }

    /*
    =========================================
    ORDER
    =========================================
    */

    q += `
        ORDER BY a.created_at DESC
    `;

    const rows =
        db.prepare(q).all(...params);

    /*
    =========================================
    FORMAT
    =========================================
    */

    return rows.map(row => {

        let computedStatus =
            'Pendiente';

        if (
            row.status === 'graded'
        ) {

            computedStatus =
                row.percentage >= 70
                    ? 'Aprobado'
                    : 'Reprobado';
        }

        else if (
            row.status === 'submitted'
        ) {

            computedStatus =
                'Entregado';
        }

        else if (
            row.status === 'in_progress'
        ) {

            computedStatus =
                'En progreso';
        }

        return {

            attempt_id:
                row.attempt_id,

            user_id:
                row.user_id,

            student_name:
                row.student_name,

            student_email:
                row.student_email,

            test_code:
                row.test_code,

            quiz_title:
                row.quiz_title,

            group_code:
                row.group_code,

            group_name:
                row.group_name,

            score:
                row.score || 0,

            max_score:
                row.max_score || 0,

            percentage:
                row.percentage || 0,

            status:
                computedStatus,

            raw_status:
                row.status,

            started_at:
                row.started_at,

            submitted_at:
                row.submitted_at,

            graded_at:
                row.graded_at,

            created_at:
                row.created_at
        };
    });
}

module.exports = { upsertAttemptAnswer, getAttemptAnswers, listAttemptAnswers, listTeacherResults };
