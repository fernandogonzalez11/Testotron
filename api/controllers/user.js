const { request, response } = require("express");
const { User } = require("../models/user");
const { getDB } = require("./db");
const { handleError } = require("./utils");

class UserController {
    /**
     * @param {request} req 
     * @param {response} res 
     */
    static async create(req, res) {
        try {
            const db = getDB();
            const user = new User(req.body, "c");

            const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
            const result = stmt.run(user.username, user.password);

            res.status(201).json({ id: result.lastInsertRowid });
        } catch (err) {
            handleError(err, res);
        }
    }

    /**
     * @param {request} req 
     * @param {response} res 
     */
    static async get(req, res) {
        try {
            const db = getDB();
            const user = new User(req.params, "r");

            const stmt = db.prepare("SELECT username, password FROM users WHERE id = ?");
            const result = stmt.get(user.id);

            res.status(200).json({ result });
        } catch (err) {
            handleError(err, res);
        }
    }

    /**
     * @param {request} req 
     * @param {response} res 
     */
    static async update(req, res) {
        try {
            const db = getDB();
            const user = new User({ ...req.params, ...req.body }, "u");

            const stmt = db.prepare("UPDATE users SET username = ?, password = ? WHERE id = ?");
            const result = stmt.run(user.username, user.password, user.id);

            res.status(200).json({ result });
        } catch (err) {
            handleError(err, res);
        }
    }

    /**
     * @param {request} req 
     * @param {response} res 
     */
    static async delete(req, res) {
        try {
            const db = getDB();
            const user = new User(req.params, "d");

            const stmt = db.prepare("DELETE FROM users WHERE id = ?");
            const result = stmt.run(user.id);

            res.status(200).json({ result });
        } catch (err) {
            handleError(err, res);
        }
    }
}

module.exports = { UserController };