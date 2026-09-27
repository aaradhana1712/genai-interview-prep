import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

// Attach Bearer token if present in localStorage (ensures cross-domain auth works on Vercel)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("genai_token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

/**
 * @description Service to evaluate user mock interview answer
 */
export const evaluateAnswer = async ({ question, intention, answer, jobDescription }) => {
    const response = await api.post("/api/interview/evaluate-answer", {
        question, intention, answer, jobDescription
    })
    return response.data
}

/**
 * @description Service to get cold email & LinkedIn outreach for report
 */
export const getOutreach = async (interviewReportId) => {
    const response = await api.get(`/api/interview/outreach/${interviewReportId}`)
    return response.data
}