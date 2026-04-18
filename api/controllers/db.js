const { DatabaseSync } = require("node:sqlite");

/** @type {DatabaseSync} */
let db;

async function createSchema() {
    db.exec(`
        CREATE TABLE users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `);

    return db;
}

async function initDB() {
    db = new DatabaseSync("./data.sqlite");

    return db;
}

function getDB() {
    if (!db) {
        throw new Error("Database not initialized. Call initDB() first.");
    }
    return db;
}

module.exports = { initDB, getDB, createSchema };