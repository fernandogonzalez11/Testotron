const { getDB } = require('./db');
const { handleError } = require('./utils');

async function getDashboard(req, res) {
  try {
    const db = getDB();
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const totalGroups = db.prepare('SELECT COUNT(*) as cnt FROM groups').get().cnt;
    const totalTests = db.prepare('SELECT COUNT(*) as cnt FROM tests').get().cnt;
    const totalAnswers = db.prepare('SELECT COUNT(*) as cnt FROM answers').get().cnt;

    // role-specific breakdowns
    if (req.user && req.user.role === 'teacher') {
      // simple teacher view: tests and responses
      const tests = db.prepare('SELECT code, name, group_code FROM tests').all();
      return res.json({ totalUsers, totalGroups, totalTests, totalAnswers, tests });
    }

    if (req.user && req.user.role === 'student') {
      // student view: available tests and attempts
      const tests = db.prepare('SELECT t.code, t.name, t.group_code, (SELECT COUNT(*) FROM items i JOIN sections s ON s.id = i.section_id WHERE s.test_code = t.code) as questions, (SELECT COUNT(*) FROM answers a WHERE a.test_code = t.code AND a.user_id = ?) as attempts FROM tests t').all(req.user.id);
      return res.json({ tests });
    }

    res.json({ totalUsers, totalGroups, totalTests, totalAnswers });
  } catch (err) { handleError(err, res); }
}

module.exports = { getDashboard };