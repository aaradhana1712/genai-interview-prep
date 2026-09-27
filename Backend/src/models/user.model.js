const { getDB } = require("../config/database")
const crypto = require("crypto")

const userModel = {
    async create({ username, email, password }) {
        const db = await getDB()
        const _id = crypto.randomUUID()
        const cleanEmail = email.toLowerCase().trim()
        const now = new Date().toISOString()

        await db.run(
            `INSERT INTO users (_id, username, email, password, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [_id, username, cleanEmail, password, now, now]
        )

        return { _id, username, email: cleanEmail, password, createdAt: now, updatedAt: now }
    },

    async findOne(query) {
        const db = await getDB()

        if (query.$or && Array.isArray(query.$or)) {
            const conditions = []
            const params = []
            for (const cond of query.$or) {
                if (cond.username) {
                    conditions.push("username = ?")
                    params.push(cond.username)
                }
                if (cond.email) {
                    conditions.push("email = ?")
                    params.push(cond.email.toLowerCase().trim())
                }
            }
            if (conditions.length === 0) return null
            const sql = `SELECT * FROM users WHERE ${conditions.join(" OR ")} LIMIT 1`
            const row = await db.get(sql, params)
            return row || null
        } else if (query.email) {
            const row = await db.get("SELECT * FROM users WHERE email = ? LIMIT 1", [query.email.toLowerCase().trim()])
            return row || null
        } else if (query.username) {
            const row = await db.get("SELECT * FROM users WHERE username = ? LIMIT 1", [query.username])
            return row || null
        } else if (query._id || query.id) {
            const row = await db.get("SELECT * FROM users WHERE _id = ? LIMIT 1", [query._id || query.id])
            return row || null
        }

        return null
    },

    async findById(id) {
        return this.findOne({ _id: id })
    }
}

module.exports = userModel