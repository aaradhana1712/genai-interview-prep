const { getDB } = require("../config/database")

const tokenBlacklistModel = {
    async create({ token }) {
        const db = await getDB()
        const now = new Date().toISOString()
        await db.run(
            `INSERT OR IGNORE INTO blacklist_tokens (token, createdAt) VALUES (?, ?)`,
            [token, now]
        )
        return { token, createdAt: now }
    },

    async findOne(query) {
        if (!query.token) return null
        const db = await getDB()
        const row = await db.get("SELECT * FROM blacklist_tokens WHERE token = ? LIMIT 1", [query.token])
        return row || null
    }
}

module.exports = tokenBlacklistModel