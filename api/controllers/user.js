const bcrypt = require('bcrypt');
const { z } = require('zod');
const { createUser, getUserById, getUserByEmail, updateUser, deleteUser, listUsers } = require('../models/user');
const { handleError } = require('./utils');
const { generateToken } = require('../middleware/auth');

const registerSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), role: z.enum(['student','teacher','admin']).optional() });

const updateSchema = z.object({ name: z.string().min(1).optional(), email: z.string().email().optional(), password: z.string().min(6).optional(), role: z.enum(['student','teacher','admin']).optional(), bio: z.string().optional() });

class UserController {
  static async register(req, res) {
    try {
      const data = registerSchema.parse(req.body);
      const hashed = await bcrypt.hash(data.password, 10);
      const user = createUser({ name:data.name, email: data.email, password: hashed, role: data.role });
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
      const token = generateToken({id: u.id, email: u.email, name: u.name,role: u.role});
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7
      });
      res.json({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role } });
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
      // enforce non-admins can only update their own profile
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
      let hashed;
      if (data.password) hashed = await bcrypt.hash(data.password, 10);
      const changes = updateUser(id, { name: data.name, email: data.email, password: hashed, role: data.role, bio: data.bio });
      res.json({ updated: changes });
    } catch (err) {
      handleError(err, res);
    }
  }

  static async updateMe(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const id = req.user.id;

      const name = String(req.body.fullName || req.body.name || '').trim();
      const email = String(req.body.email || '').trim();
      const bio = String(req.body.bio || '').trim();

      const currentPassword = req.body.currentPassword || '';
      const newPassword = req.body.newPassword || '';
      const confirmPassword = req.body.confirmPassword || '';

      if (!name) return res.status(400).json({ error: 'Invalid name' });
      if (!email) return res.status(400).json({ error: 'Invalid email' });

      const existing = getUserByEmail(email);
      if (existing && existing.id !== id) return res.status(400).json({ error: 'Email already in use' });

      let hashed = null;

      if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
        if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

        const dbUser = getUserById(id);
        if (!dbUser) return res.status(404).json({ error: 'User not found' });

        const ok = await bcrypt.compare(currentPassword, dbUser.password);
        if (!ok) return res.status(400).json({ error: 'Current password incorrect' });

        hashed = await bcrypt.hash(newPassword, 10);
      }

      const changes = updateUser(id, { name, email, bio, password: hashed });
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
