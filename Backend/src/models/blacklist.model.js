const { getPool, sql } = require("../config/database")

const tokenBlacklistModel = {
    async create({ token }) {
        const pool = getPool()
        const request = pool.request()
        request.input("token", sql.NVarChar, token)
        await request.query(`
            INSERT INTO blacklist_tokens (token, createdAt)
            VALUES (@token, GETDATE())
        `)
        return { token }
    },

    async findOne(query) {
        if (!query.token) return null
        const pool = getPool()
        const request = pool.request()
        request.input("token", sql.NVarChar, query.token)
        const result = await request.query(`SELECT TOP 1 * FROM blacklist_tokens WHERE token = @token`)
        return result.recordset[0] || null
    }
}

module.exports = tokenBlacklistModel