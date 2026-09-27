const path = require("path")
const fs = require("fs")
const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

let dbPromise = null

async function initDB() {
    // Database stored in Backend/data/genai.db
    const dataDir = path.resolve(__dirname, "../../data")
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
    }
    const dbPath = path.join(dataDir, "genai.db")

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    })

    // Enable Write-Ahead Logging for speed & concurrent reads/writes
    await db.exec("PRAGMA journal_mode = WAL;")

    // Create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            _id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS interview_reports (
            _id TEXT PRIMARY KEY,
            title TEXT,
            jobDescription TEXT,
            resume TEXT,
            selfDescription TEXT,
            matchScore INTEGER,
            technicalQuestions TEXT,
            behavioralQuestions TEXT,
            skillGaps TEXT,
            preparationPlan TEXT,
            atsKeywords TEXT,
            user TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS blacklist_tokens (
            token TEXT PRIMARY KEY,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `)

    console.log(`Connected to SQLite Database (Zero-Password Engine at ${dbPath})`)
    return db
}

function getDB() {
    if (!dbPromise) {
        dbPromise = initDB().catch(err => {
            console.error("SQLite Connection Error:", err.message)
            dbPromise = null
            throw err
        })
    }
    return dbPromise
}

async function connectToDB() {
    return getDB()
}

module.exports = connectToDB
module.exports.getDB = getDB