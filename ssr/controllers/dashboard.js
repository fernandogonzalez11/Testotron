// ssr/controllers/dashboard.js

const { getDB } = require('../../api/db');

function dashboardPage(req, res, baseContext) {

    if (!req.user) {
        return res.redirect('/auth/login');
    }

    const db = getDB();
    let stats = {};
    let recentQuizzes = [];
    let notifications = [];

    let weeklyActivity = [];
    let weeklyActivityLabels = [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
    ];

    let gradeProgress = [];
    let gradeProgressLabels = [];

    let quizPerformance = [];
    let activeGroups = [];
    let completionRate = 0;

    const role = req.user.role;

    /*
    =========================================
    ADMIN DASHBOARD
    =========================================
    */

    if (role === 'admin') {

        const totalUsers = db.prepare(`
            SELECT COUNT(*) as total
            FROM users
        `).get().total;

        const totalGroups = db.prepare(`
            SELECT COUNT(*) as total
            FROM groups
        `).get().total;

        const totalTests = db.prepare(`
            SELECT COUNT(*) as total
            FROM tests
        `).get().total;

        const totalAttempts = db.prepare(`
            SELECT COUNT(*) as total
            FROM attempts
        `).get().total;

        stats = {
            quizzes: totalTests,
            groups: totalGroups,
            attempts: totalAttempts,
            students: totalUsers
        };

        recentQuizzes = db.prepare(`
            SELECT
                tests.code,
                tests.title,
                tests.status,
                tests.created_at,
                groups.name as group_name
            FROM tests
            LEFT JOIN groups
                ON groups.code = tests.group_code
            ORDER BY tests.created_at DESC
            LIMIT 5
        `).all();

        notifications = db.prepare(`
            SELECT
                title as quiz_title,
                created_at
            FROM tests
            ORDER BY created_at DESC
            LIMIT 6
        `).all();

    }

    /*
    =========================================
    TEACHER DASHBOARD
    =========================================
    */

    else if (role === 'teacher') {

        const createdQuizzes = db.prepare(`
            SELECT COUNT(*) as total
            FROM tests
            WHERE owner_id = ?
        `).get(req.user.id).total;

        const ownedGroups = db.prepare(`
            SELECT COUNT(*) as total
            FROM groups
            WHERE owner_id = ?
        `).get(req.user.id).total;

        const totalAttempts = db.prepare(`
            SELECT COUNT(*) as total
            FROM attempts
            INNER JOIN tests
                ON tests.code = attempts.test_code
            WHERE tests.owner_id = ?
        `).get(req.user.id).total;

        const studentsReached = db.prepare(`
            SELECT COUNT(DISTINCT attempts.user_id) as total
            FROM attempts
            INNER JOIN tests
                ON tests.code = attempts.test_code
            WHERE tests.owner_id = ?
        `).get(req.user.id).total;

        stats = {
            quizzes: createdQuizzes,
            groups: ownedGroups,
            attempts: totalAttempts,
            students: studentsReached
        };

        recentQuizzes = db.prepare(`
            SELECT
                tests.code,
                tests.title,
                tests.status,
                tests.created_at,
                groups.name as group_name
            FROM tests
            LEFT JOIN groups
                ON groups.code = tests.group_code
            WHERE tests.owner_id = ?
            ORDER BY tests.created_at DESC
            LIMIT 5
        `).all(req.user.id);

        notifications = db.prepare(`
            SELECT
                tests.title as quiz_title,
                tests.created_at
            FROM tests
            WHERE tests.owner_id = ?
            ORDER BY tests.created_at DESC
            LIMIT 6
        `).all(req.user.id);

        /*
        =========================================
        WEEKLY QUIZ CREATION ACTIVITY
        =========================================
        */

        const teacherActivityRows = db.prepare(`
            SELECT
                strftime('%w', created_at) as day,
                COUNT(*) as total
            FROM tests
            WHERE owner_id = ?
            AND created_at >= datetime('now', '-6 days')
            GROUP BY day
        `).all(req.user.id);

        const activityMap = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0
        };

        teacherActivityRows.forEach(row => {
            activityMap[row.day] = row.total;
        });

        weeklyActivity = [
            activityMap[1],
            activityMap[2],
            activityMap[3],
            activityMap[4],
            activityMap[5],
            activityMap[6],
            activityMap[0]
        ];

        /*
        =========================================
        QUIZ PERFORMANCE
        =========================================
        */

        quizPerformance = db.prepare(`
            SELECT
                tests.title,
                ROUND(
                    AVG(
                        CASE
                            WHEN attempts.max_score > 0
                            THEN (attempts.score * 100.0 / attempts.max_score)
                            ELSE 0
                        END
                    ),
                    2
                ) as avg_score
            FROM attempts
            INNER JOIN tests
                ON tests.code = attempts.test_code
            WHERE tests.owner_id = ?
            AND attempts.status = 'graded'
            GROUP BY tests.code
            ORDER BY avg_score DESC
            LIMIT 5
        `).all(req.user.id);

        /*
        =========================================
        GRADE PROGRESS
        =========================================
        */

        gradeProgress = quizPerformance.map(q =>
            Math.round(q.avg_score)
        );

        gradeProgressLabels = quizPerformance.map(q =>
            q.title
        );

    }

    /*
    =========================================
    STUDENT DASHBOARD
    =========================================
    */

    else {

        const assignedQuizzes = db.prepare(`
            SELECT COUNT(*) as total
            FROM tests
            INNER JOIN user_groups
                ON user_groups.group_code = tests.group_code
            WHERE user_groups.user_id = ?
        `).get(req.user.id).total;

        const submittedAttempts = db.prepare(`
            SELECT COUNT(*) as total
            FROM attempts
            WHERE user_id = ?
        `).get(req.user.id).total;

        const completedQuizzes = db.prepare(`
            SELECT COUNT(*) as total
            FROM attempts
            WHERE user_id = ?
            AND status IN ('submitted', 'graded')
        `).get(req.user.id).total;

        const avgScoreRow = db.prepare(`
            SELECT AVG(
                CASE
                    WHEN max_score > 0
                    THEN (score * 100.0 / max_score)
                    ELSE 0
                END
            ) as avg_score
            FROM attempts
            WHERE user_id = ?
            AND status = 'graded'
        `).get(req.user.id);

        stats = {
            quizzes: assignedQuizzes,
            groups: completedQuizzes,
            attempts: submittedAttempts,
            students: Math.round(avgScoreRow.avg_score || 0)
        };

        recentQuizzes = db.prepare(`
            SELECT
                tests.code,
                tests.title,
                tests.status,
                tests.created_at,
                groups.name as group_name
            FROM tests
            INNER JOIN user_groups
                ON user_groups.group_code = tests.group_code
            LEFT JOIN groups
                ON groups.code = tests.group_code
            WHERE user_groups.user_id = ?
            ORDER BY tests.created_at DESC
            LIMIT 5
        `).all(req.user.id);

        notifications = db.prepare(`
            SELECT
                tests.title as quiz_title,
                tests.created_at
            FROM tests
            INNER JOIN user_groups
                ON user_groups.group_code = tests.group_code
            WHERE user_groups.user_id = ?
            ORDER BY tests.created_at DESC
            LIMIT 6
        `).all(req.user.id);

        /*
        =========================================
        WEEKLY ACTIVITY
        =========================================
        */

        const weeklyActivityRows = db.prepare(`
            SELECT
                strftime('%w', created_at) as day,
                COUNT(*) as total
            FROM attempts
            WHERE user_id = ?
            AND created_at >= datetime('now', '-6 days')
            GROUP BY day
        `).all(req.user.id);

        const weeklyMap = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0
        };

        weeklyActivityRows.forEach(row => {
            weeklyMap[row.day] = row.total;
        });

        weeklyActivity = [
            weeklyMap[1],
            weeklyMap[2],
            weeklyMap[3],
            weeklyMap[4],
            weeklyMap[5],
            weeklyMap[6],
            weeklyMap[0]
        ];

        /*
        =========================================
        GRADE PROGRESS
        =========================================
        */

        const gradeProgressRows = db.prepare(`
            SELECT
                tests.title,
                attempts.score,
                attempts.max_score
            FROM attempts
            INNER JOIN tests
                ON tests.code = attempts.test_code
            WHERE attempts.user_id = ?
            AND attempts.status = 'graded'
            ORDER BY attempts.graded_at ASC
            LIMIT 5
        `).all(req.user.id);

        gradeProgress = gradeProgressRows.map(row => {

            if (!row.max_score || row.max_score === 0) {
                return 0;
            }

            return Math.round(
                (row.score * 100) / row.max_score
            );

        });

        gradeProgressLabels = gradeProgressRows.map(row =>
            row.title
        );

        /*
        =========================================
        COMPLETION RATE
        =========================================
        */

        const completionRateRow = db.prepare(`
            SELECT
                ROUND(
                    COUNT(
                        CASE
                            WHEN status IN ('submitted', 'graded')
                            THEN 1
                        END
                    ) * 100.0 / COUNT(*),
                    2
                ) as completion_rate
            FROM attempts
            WHERE user_id = ?
        `).get(req.user.id);

        completionRate = completionRateRow?.completion_rate || 0;

        /*
        =========================================
        MOST ACTIVE GROUPS
        =========================================
        */

        activeGroups = db.prepare(`
            SELECT
                groups.name,
                COUNT(attempts.id) as attempts_count
            FROM attempts
            INNER JOIN tests
                ON tests.code = attempts.test_code
            INNER JOIN groups
                ON groups.code = tests.group_code
            WHERE attempts.user_id = ?
            GROUP BY groups.code
            ORDER BY attempts_count DESC
            LIMIT 5
        `).all(req.user.id);

    }

    /*
    =========================================
    RENDER
    =========================================
    */

    const ctx = baseContext(req, {
        pageTitle: 'Panel de control',
        active: {
            dashboard: true
        },
        locals: {
            role,
            stats,
            recentQuizzes,
            notifications,

            weeklyActivity,
            weeklyActivityLabels,

            gradeProgress,
            gradeProgressLabels,

            quizPerformance,
            activeGroups,
            completionRate
        }
    });

    return res.render('shared/dashboard', ctx);
}

module.exports = {
    dashboardPage
};
