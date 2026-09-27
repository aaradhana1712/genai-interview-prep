const { getPool, sql } = require("../config/database")
const crypto = require("crypto")

function parseReport(row) {
    if (!row) return null
    return {
        ...row,
        technicalQuestions: row.technicalQuestions ? (typeof row.technicalQuestions === "string" ? JSON.parse(row.technicalQuestions) : row.technicalQuestions) : [],
        behavioralQuestions: row.behavioralQuestions ? (typeof row.behavioralQuestions === "string" ? JSON.parse(row.behavioralQuestions) : row.behavioralQuestions) : [],
        skillGaps: row.skillGaps ? (typeof row.skillGaps === "string" ? JSON.parse(row.skillGaps) : row.skillGaps) : [],
        preparationPlan: row.preparationPlan ? (typeof row.preparationPlan === "string" ? JSON.parse(row.preparationPlan) : row.preparationPlan) : [],
        atsKeywords: row.atsKeywords ? (typeof row.atsKeywords === "string" ? JSON.parse(row.atsKeywords) : row.atsKeywords) : null
    }
}

const interviewReportModel = {
    async create(data) {
        const pool = getPool()
        const _id = crypto.randomUUID()
        const request = pool.request()

        request.input("_id", sql.NVarChar, _id)
        request.input("title", sql.NVarChar, data.title || "Interview Preparation Report")
        request.input("jobDescription", sql.NVarChar, data.jobDescription || "")
        request.input("resume", sql.NVarChar, data.resume || "")
        request.input("selfDescription", sql.NVarChar, data.selfDescription || "")
        request.input("matchScore", sql.Int, typeof data.matchScore === "number" ? data.matchScore : null)
        request.input("technicalQuestions", sql.NVarChar, JSON.stringify(data.technicalQuestions || []))
        request.input("behavioralQuestions", sql.NVarChar, JSON.stringify(data.behavioralQuestions || []))
        request.input("skillGaps", sql.NVarChar, JSON.stringify(data.skillGaps || []))
        request.input("preparationPlan", sql.NVarChar, JSON.stringify(data.preparationPlan || []))
        request.input("atsKeywords", sql.NVarChar, JSON.stringify(data.atsKeywords || null))
        request.input("user", sql.NVarChar, String(data.user))

        await request.query(`
            INSERT INTO interview_reports (
                _id, title, jobDescription, resume, selfDescription, matchScore,
                technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, atsKeywords, [user],
                createdAt, updatedAt
            )
            VALUES (
                @_id, @title, @jobDescription, @resume, @selfDescription, @matchScore,
                @technicalQuestions, @behavioralQuestions, @skillGaps, @preparationPlan, @atsKeywords, @user,
                GETDATE(), GETDATE()
            )
        `)

        return {
            _id,
            ...data,
            technicalQuestions: data.technicalQuestions || [],
            behavioralQuestions: data.behavioralQuestions || [],
            skillGaps: data.skillGaps || [],
            preparationPlan: data.preparationPlan || [],
            createdAt: new Date(),
            updatedAt: new Date()
        }
    },

    async findOne(query) {
        const pool = getPool()
        const request = pool.request()

        const where = []
        if (query._id) {
            request.input("_id", sql.NVarChar, String(query._id))
            where.push("_id = @_id")
        }
        if (query.user) {
            request.input("user", sql.NVarChar, String(query.user))
            where.push("[user] = @user")
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""
        const result = await request.query(`SELECT TOP 1 * FROM interview_reports ${whereClause}`)
        return parseReport(result.recordset[0])
    },

    async findById(id) {
        return this.findOne({ _id: id })
    },

    find(query = {}) {
        const pool = getPool()
        const request = pool.request()

        const where = []
        if (query.user) {
            request.input("user", sql.NVarChar, String(query.user))
            where.push("[user] = @user")
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""

        const queryObj = {
            _sortOrder: "DESC",
            _fields: "*",
            sort(options) {
                if (options && options.createdAt === 1) {
                    this._sortOrder = "ASC"
                } else {
                    this._sortOrder = "DESC"
                }
                return this
            },
            select(fields) {
                this._fields = "_id, title, matchScore, [user], createdAt, updatedAt"
                return this
            },
            async then(resolve, reject) {
                try {
                    const result = await request.query(`
                        SELECT ${this._fields} FROM interview_reports ${whereClause} ORDER BY createdAt ${this._sortOrder}
                    `)
                    const list = result.recordset.map(r => parseReport(r))
                    resolve(list)
                } catch (err) {
                    reject(err)
                }
            }
        }

        return queryObj
    }
}

module.exports = interviewReportModel