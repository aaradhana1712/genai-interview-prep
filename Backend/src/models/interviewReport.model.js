const { getDB } = require("../config/database")
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
        const db = await getDB()
        const _id = crypto.randomUUID()
        const now = new Date().toISOString()

        const title = data.title || "Interview Preparation Report"
        const jobDescription = data.jobDescription || ""
        const resume = data.resume || ""
        const selfDescription = data.selfDescription || ""
        const matchScore = typeof data.matchScore === "number" ? data.matchScore : null
        const technicalQuestions = JSON.stringify(data.technicalQuestions || [])
        const behavioralQuestions = JSON.stringify(data.behavioralQuestions || [])
        const skillGaps = JSON.stringify(data.skillGaps || [])
        const preparationPlan = JSON.stringify(data.preparationPlan || [])
        const atsKeywords = JSON.stringify(data.atsKeywords || null)
        const user = String(data.user)

        await db.run(
            `INSERT INTO interview_reports (
                _id, title, jobDescription, resume, selfDescription, matchScore,
                technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, atsKeywords, user,
                createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                _id, title, jobDescription, resume, selfDescription, matchScore,
                technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, atsKeywords, user,
                now, now
            ]
        )

        return {
            _id,
            ...data,
            technicalQuestions: data.technicalQuestions || [],
            behavioralQuestions: data.behavioralQuestions || [],
            skillGaps: data.skillGaps || [],
            preparationPlan: data.preparationPlan || [],
            createdAt: now,
            updatedAt: now
        }
    },

    async findOne(query) {
        const db = await getDB()
        const conditions = []
        const params = []

        if (query._id) {
            conditions.push("_id = ?")
            params.push(String(query._id))
        }
        if (query.user) {
            conditions.push("user = ?")
            params.push(String(query.user))
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
        const row = await db.get(`SELECT * FROM interview_reports ${whereClause} LIMIT 1`, params)
        return parseReport(row)
    },

    async findById(id) {
        return this.findOne({ _id: id })
    },

    find(query = {}) {
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
                this._fields = "_id, title, matchScore, user, createdAt, updatedAt"
                return this
            },
            async then(resolve, reject) {
                try {
                    const db = await getDB()
                    const conditions = []
                    const params = []

                    if (query.user) {
                        conditions.push("user = ?")
                        params.push(String(query.user))
                    }

                    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
                    const rows = await db.all(
                        `SELECT ${this._fields} FROM interview_reports ${whereClause} ORDER BY createdAt ${this._sortOrder}`,
                        params
                    )
                    const parsed = rows.map(r => parseReport(r))
                    resolve(parsed)
                } catch (err) {
                    reject(err)
                }
            }
        }

        return queryObj
    }
}

module.exports = interviewReportModel