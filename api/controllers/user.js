const bcrypt = require('bcrypt');
const { z } = require('zod');
const { createUser, getUserById, getUserByEmail, updateUser, deleteUser, listUsers } = require('../models/user');
const { handleError } = require('./utils');
const { generateToken } = require('../middleware/auth');

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(6), role: z.enum(['student','teacher','admin']).optional() });
const updateSchema = z.object({ email: z.string().email().optional(), password: z.string().min(6).optional(), role: z.enum(['student','teacher','admin']).optional() });

class UserController {
  static async register(req, res) {
    try {
      const data = registerSchema.parse(req.body);
      const hashed = await bcrypt.hash(data.password, 10);
      const user = createUser({ email: data.email, password: hashed, role: data.role });
      res.status(201).json({ user });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async login(req, res) {
    try {
      const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
      const u = getUserByEmail(body.email);
      if (!u) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(body.password, u.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = generateToken({ id: u.id, email: u.email, role: u.role });
      res.json({ token, user: { id: u.id, email: u.email, role: u.role } });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async list(req, res) {
    try {
      const users = listUsers();
      res.json({ users });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async get(req, res) {
    try {
      const id = Number(req.params.id);
      const user = getUserById(id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      res.json({ user });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async update(req, res) {
    try {
      const id = Number(req.params.id);
      const data = updateSchema.parse(req.body);
      let hashed;
      if (data.password) hashed = await bcrypt.hash(data.password, 10);
      const changes = updateUser(id, { email: data.email, password: hashed, role: data.role });
      res.json({ updated: changes });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const changes = deleteUser(id);
      res.json({ deleted: changes });
    } catch (err) {
      handleError(err, res);
    }
  }
}

module.exports = { UserController };