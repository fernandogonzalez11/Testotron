const { z } = require('zod');
const { createAnswer, addAnswerItem, getAnswer, listAnswers } = require('../models/answer');
const { getItem } = require('../models/item');
const { handleError } = require('./utils');

const schema = z.object({ test_code: z.string().min(1), responses: z.array(z.object({ item_id: z.number().int(), answer: z.any() })) });

// simple auto-grading helpers
function gradeAnswer(item, given) {
  if (!item) return { pts: 0 };
  const type = item.type;
  if (type === 'short' || type === 'mcq') {
    const correct = String(item.answer || '').trim().toLowerCase();
    const got = String(given || '').trim().toLowerCase();
    return { pts: got === correct ? item.pts : 0, correct_answer: item.answer, student_answer: given };
  }
  if (type === 'select-multiple') {
    try {
      const correct = JSON.parse(item.answer || '[]').sort();
      const got = Array.isArray(given) ? given.map(String) : JSON.parse(String(given || '[]'));
      got.sort();
      const eq = JSON.stringify(correct) === JSON.stringify(got);
      return { pts: eq ? item.pts : 0, correct_answer: correct, student_answer: got };
    } catch (e) { return { pts: 0, correct_answer: null, student_answer: given }; }
  }
  // matching or others: best effort
  return { pts: String(given) === String(item.answer) ? item.pts : 0, correct_answer: item.answer, student_answer: given };
}

class AnswerController {
  static submit(req, res) {
    try {
      const data = schema.parse(req.body);
      // enforce submitting user is the authenticated user
      const user_id = req.user && req.user.id;
      if (!user_id) return res.status(401).json({ error: 'Not authenticated' });
      const a = createAnswer({ user_id, test_code: data.test_code });
      let total = 0;
      for (const r of data.responses) {
        const item = getItem(r.item_id);
        const g = gradeAnswer(item, r.answer);
        addAnswerItem({ answer_id: a.id, item_id: r.item_id, pts_obtained: g.pts, feedback: null });
        total += g.pts;
      }
      res.status(201).json({ answer_id: a.id, total });
    } catch (err) { handleError(err, res); }
  }

  static get(req, res) {
    try {
      const id = Number(req.params.id);
      const a = getAnswer(id);
      if (!a) return res.status(404).json({ error: 'Not found' });
      // authorization: students can only see their own, teachers only answers for their tests
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      if (user.role === 'student' && a.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
      if (user.role === 'teacher') {
        // verify teacher owns the test
        const db = require('./db').getDB();
        const t = db.prepare('SELECT owner_id FROM tests WHERE code = ?').get(a.test_code);
        if (!t || t.owner_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
      }
      // compute totals
      let obtained = 0, max = 0;
      for (const it of a.items) { obtained += it.pts_obtained; max += it.max_pts; }
      a.score = max ? Math.round((obtained / max) * 100) : 0;
      res.json({ answer: a });
    } catch (err) { handleError(err, res); }
  }

  static list(req, res) {
    try {
      const user = req.user;
      const filters = { user_id: req.query.user_id ? Number(req.query.user_id) : undefined, test_code: req.query.test_code, group_code: req.query.group };
      // enforce visibility
      if (user.role === 'student') {
        filters.user_id = user.id;
      }
      if (user.role === 'teacher') {
        // restrict to answers for tests owned by teacher
        const db = require('./db').getDB();
        let q = `SELECT a.id, a.user_id, u.email as student_email, a.test_code, t.name as test_name, a.created_at
          FROM answers a JOIN users u ON u.id = a.user_id JOIN tests t ON t.code = a.test_code WHERE t.owner_id = ?`;
        const params = [user.id];
        if (filters.test_code) { q += ' AND a.test_code = ?'; params.push(filters.test_code); }
        if (filters.user_id) { q += ' AND a.user_id = ?'; params.push(filters.user_id); }
        const rows = db.prepare(q).all(...params);
        return res.json({ results: rows });
      }
      const list = listAnswers(filters);
      res.json({ results: list });
    } catch (err) { handleError(err, res); }
  }

  static results(req, res) {
    try {
      const user = req.user;
      const filters = { student_email: req.query.student, group_code: req.query.group, test_code: req.query.test };
      if (user.role === 'teacher') {
        // limit to teacher's tests
        filters.owner_id = user.id;
      }
      const rows = require('../models/answer').listResults(filters);
      // compute aggregates
      const total = rows.length;
      const avg = total ? Math.round(rows.reduce((s, r) => s + r.score_pct, 0) / total) : 0;
      const passThreshold = req.query.pass ? Number(req.query.pass) : 60;
      const passCount = rows.filter(r => r.score_pct >= passThreshold).length;
      const passRate = total ? Math.round((passCount / total) * 100) : 0;
      res.json({ totalResults: total, averageScore: avg, passRate, rows });
    } catch (err) { handleError(err, res); }
  }
}

module.exports = { AnswerController };