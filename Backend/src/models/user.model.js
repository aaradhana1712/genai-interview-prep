const { getPool, sql } = require("../config/database")
const crypto = require("crypto")

const userModel = {
    async create({ username, email, password }) {
        const pool = getPool()
        const _id = crypto.randomUUID()
        const request = pool.request()
        request.input("_id", sql.NVarChar, _id)
        request.input("username", sql.NVarChar, username)
        request.input("email", sql.NVarChar, email.toLowerCase().trim())
        request.input("password", sql.NVarChar, password)

        await request.query(`
            INSERT INTO users (_id, username, email, password, createdAt, updatedAt)
            VALUES (@_id, @username, @email, @password, GETDATE(), GETDATE())
        `)

        return { _id, username, email: email.toLowerCase().trim(), password }
    },

    async findOne(query) {
        const pool = getPool()
        const request = pool.request()

        let whereClause = ""
        if (query.$or) {
            const orConditions = []
            query.$or.forEach((cond, idx) => {
                if (cond.username) {
                    request.input(`u_${idx}`, sql.NVarChar, cond.username)
                    orConditions.push(`username = @u_${idx}`)
                }
                if (cond.email) {
                    request.input(`e_${idx}`, sql.NVarChar, cond.email.toLowerCase().trim())
                    orConditions.push(`email = @e_${idx}`)
                }
            })
            whereClause = orConditions.length > 0 ? `WHERE ${orConditions.join(" OR ")}` : ""
        } else if (query.email) {
            request.input("email", sql.NVarChar, query.email.toLowerCase().trim())
            whereClause = "WHERE email = @email"
        } else if (query.username) {
            request.input("username", sql.NVarChar, query.username)
            whereClause = "WHERE username = @username"
        } else if (query._id || query.id) {
            request.input("_id", sql.NVarChar, query._id || query.id)
            whereClause = "WHERE _id = @_id"
        }

        const result = await request.query(`SELECT TOP 1 * FROM users ${whereClause}`)
        return result.recordset[0] || null
    },

    async findById(id) {
        return this.findOne({ _id: id })
    }
}

module.exports = userModel