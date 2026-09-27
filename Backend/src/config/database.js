const sql = require("mssql")

const config = {
    user: process.env.DB_USER || "genai_user",
    password: process.env.DB_PASSWORD || "GenaiPassword123!",
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_NAME || "genai_db",
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_INSTANCE || "SQLEXPRESS"
    }
}

let pool = null

async function connectToDB() {
    try {
        if (!pool) {
            pool = await sql.connect(config)
            console.log("Connected to Microsoft SQL Server (SQLEXPRESS: genai_db)")
        }
        return pool
    } catch (err) {
        console.error("SQL Server Connection Error:", err.message)
    }
}

function getPool() {
    return pool || sql
}

module.exports = connectToDB
module.exports.getPool = getPool
module.exports.sql = sql