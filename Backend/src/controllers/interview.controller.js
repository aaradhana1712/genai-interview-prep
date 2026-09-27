const pdfParse = require("pdf-parse")
const {
    generateInterviewReport,
    generateResumePdf,
    evaluateMockAnswer,
    generateOutreachMessages
} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""
        if (req.file && req.file.buffer) {
            try {
                const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = resumeContent.text || ""
            } catch (pdfErr) {
                console.warn("PDF parser error, falling back to raw text:", pdfErr.message)
                resumeText = req.file.buffer.toString("utf-8").replace(/[^\x20-\x7E\t\r\n]/g, " ").trim()
            }
        }

        const { selfDescription, jobDescription } = req.body

        if (!jobDescription) {
            return res.status(400).json({
                message: "Target job description is required."
            })
        }

        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please upload a resume or provide a self-description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error generating interview report:", err)
        let friendlyMessage = err.message || "Failed to generate interview report. Please try again."
        if (friendlyMessage.includes("503") || friendlyMessage.includes("demand") || friendlyMessage.includes("UNAVAILABLE")) {
            friendlyMessage = "The AI service is momentarily busy with high traffic. Please wait a few seconds and try clicking Generate again."
        }
        res.status(500).json({
            message: friendlyMessage
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
  * @description Controller to evaluate a user's answer to an interview question
  */
async function evaluateMockAnswerController(req, res) {
    try {
        const { question, intention, answer, jobDescription } = req.body
        if (!question || !answer) {
            return res.status(400).json({ message: "Question and answer are required." })
        }
        const evaluation = await evaluateMockAnswer({ question, intention, answer, jobDescription })
        res.status(200).json({ message: "Answer evaluated successfully.", evaluation })
    } catch (err) {
        console.error("Evaluation error:", err)
        res.status(500).json({ message: err.message || "Failed to evaluate answer." })
    }
}

/**
  * @description Controller to generate cold email and LinkedIn outreach messages
  */
async function generateOutreachController(req, res) {
    try {
        const { interviewReportId } = req.params
        const interviewReport = await interviewReportModel.findById(interviewReportId)
        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }
        const { jobDescription, resume, selfDescription } = interviewReport
        const outreach = await generateOutreachMessages({ jobDescription, resume, selfDescription })
        res.status(200).json({ message: "Outreach messages generated successfully.", outreach })
    } catch (err) {
        console.error("Outreach generation error:", err)
        res.status(500).json({ message: err.message || "Failed to generate outreach messages." })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    evaluateMockAnswerController,
    generateOutreachController
}