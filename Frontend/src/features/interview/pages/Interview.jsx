import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'
import { evaluateAnswer, getOutreach } from '../services/interview.api.js'

const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical Q&A',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>)
    },
    {
        id: 'behavioral',
        label: 'Behavioral Q&A',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>)
    },
    {
        id: 'mock',
        label: 'Live AI Mock Test',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>)
    },
    {
        id: 'ats',
        label: 'ATS Keyword Match',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>)
    },
    {
        id: 'outreach',
        label: 'HR Cold Outreach',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>)
    },
    {
        id: 'roadmap',
        label: 'Study Roadmap',
        icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>)
    },
]

// ── Sub-component: Question Card ─────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Sub-component: Live Mock Interview ───────────────────────────────────────
const MockInterviewSection = ({ questions, jobDescription }) => {
    const [ selectedIdx, setSelectedIdx ] = useState(0)
    const [ userAnswer, setUserAnswer ] = useState("")
    const [ isListening, setIsListening ] = useState(false)
    const [ evaluating, setEvaluating ] = useState(false)
    const [ evaluation, setEvaluation ] = useState(null)
    const [ evalError, setEvalError ] = useState("")

    const currentQ = questions[ selectedIdx ] || questions[ 0 ]

    const handleSpeech = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.")
            return
        }

        if (isListening) {
            setIsListening(false)
            return
        }

        try {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)
            recognition.onerror = () => setIsListening(false)

            recognition.onresult = (event) => {
                let speechText = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    speechText += event.results[ i ][ 0 ].transcript + ' '
                }
                setUserAnswer(prev => prev + ' ' + speechText)
            }

            recognition.start()
        } catch (e) {
            setIsListening(false)
        }
    }

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) {
            setEvalError("Please enter or speak your answer first.")
            return
        }
        setEvalError("")
        setEvaluating(true)
        try {
            const res = await evaluateAnswer({
                question: currentQ.question,
                intention: currentQ.intention,
                answer: userAnswer,
                jobDescription
            })
            setEvaluation(res.evaluation)
        } catch (err) {
            setEvalError(err.response?.data?.message || "Failed to evaluate answer. Please try again.")
        } finally {
            setEvaluating(false)
        }
    }

    return (
        <section className='mock-container'>
            <div className='content-header'>
                <div>
                    <h2>🎙️ Live AI Mock Interviewer</h2>
                    <p style={{ color: "#7d8590", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        Practice speaking or typing your answer. AI will evaluate technical depth, clarity, and score your response.
                    </p>
                </div>
                <span className='feature-badge'>Interactive Practice</span>
            </div>

            <div className='mock-card'>
                {/* Question Selector Pills */}
                <div className='mock-selector'>
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            className={`mock-pill ${selectedIdx === idx ? 'mock-pill--active' : ''}`}
                            onClick={() => {
                                setSelectedIdx(idx)
                                setUserAnswer("")
                                setEvaluation(null)
                                setEvalError("")
                            }}
                        >
                            Question {idx + 1}
                        </button>
                    ))}
                </div>

                {/* Question Box */}
                <div className='mock-question-box'>
                    <div className='mock-q-title'>{currentQ?.question}</div>
                    <div className='mock-q-hint'>💡 Interviewer Intent: {currentQ?.intention}</div>
                </div>

                {/* Input Area */}
                <div className='mock-input-area'>
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here or click 'Speak' to answer by voice as if you're in the real interview..."
                    />
                    <button
                        type="button"
                        onClick={handleSpeech}
                        className={`mock-mic-btn ${isListening ? 'mock-mic-btn--listening' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                        {isListening ? 'Listening...' : 'Speak Answer'}
                    </button>
                </div>

                {evalError && (
                    <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                        ⚠️ {evalError}
                    </div>
                )}

                <div className='mock-actions'>
                    <button
                        onClick={handleEvaluate}
                        disabled={evaluating}
                        className='button primary-button'
                        style={{ padding: "0.6rem 1.25rem", borderRadius: "0.5rem" }}
                    >
                        {evaluating ? 'AI Evaluating...' : 'Evaluate My Answer'}
                    </button>
                </div>

                {/* Evaluation Results Card */}
                {evaluation && (
                    <div className='mock-result'>
                        <div className='mock-score-header'>
                            <div className='mock-score-badge'>
                                {evaluation.score} <span>/ 10 Rating</span>
                            </div>
                            <span className='feature-badge'>AI Assessment</span>
                        </div>

                        <p className='mock-feedback'>{evaluation.feedback}</p>

                        <div className='mock-points-grid'>
                            <div className='mock-column mock-column--strengths'>
                                <h4>✅ What You Did Well</h4>
                                <ul>
                                    {evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className='mock-column mock-column--improvements'>
                                <h4>⚡ Areas for Improvement</h4>
                                <ul>
                                    {evaluation.improvements?.map((im, i) => <li key={i}>{im}</li>)}
                                </ul>
                            </div>
                        </div>

                        <div className='mock-ideal-answer'>
                            <h4>🌟 Professional Model Answer:</h4>
                            <p>{evaluation.idealAnswer}</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

// ── Sub-component: ATS Keyword Analyzer ──────────────────────────────────────
const AtsAnalyzerSection = ({ report }) => {
    // Generate fallback keyword lists if report was created before schema update
    const matchedKeywords = report.atsKeywords?.matched?.length ? report.atsKeywords.matched : [
        "Core Development", "REST APIs", "Problem Solving", "Debugging", "Team Collaboration"
    ]

    const missingKeywords = report.atsKeywords?.missing?.length ? report.atsKeywords.missing : (
        report.skillGaps?.map(g => g.skill) || [ "Cloud Deployment", "CI/CD Pipelines", "System Design" ]
    )

    const atsScore = report.atsKeywords?.atsScore || report.matchScore || 78

    return (
        <section className='ats-container'>
            <div className='content-header'>
                <div>
                    <h2>📊 ATS Resume & Keyword Match Analyzer</h2>
                    <p style={{ color: "#7d8590", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        Applicant Tracking Systems (ATS) scan for exact keywords in your resume before an interview call is scheduled.
                    </p>
                </div>
            </div>

            {/* ATS Score Banner */}
            <div className='ats-banner'>
                <div className='ats-score-display'>
                    <div className='ats-circle'>
                        {atsScore}%
                    </div>
                    <div>
                        <h3>ATS Compatibility Match</h3>
                        <p>{atsScore >= 75 ? "Excellent keyword alignment with this job description!" : "Good foundation, but adding the missing keywords will boost your shortlist chances."}</p>
                    </div>
                </div>
            </div>

            {/* Keyword Comparison Grid */}
            <div className='ats-keywords-grid'>
                {/* Matched Keywords */}
                <div className='keyword-card'>
                    <div className='keyword-card__header'>
                        <h3>✅ Keywords Matched in Your Resume</h3>
                        <span className='count-badge count-badge--green'>{matchedKeywords.length} Found</span>
                    </div>
                    <div className='chip-container'>
                        {matchedKeywords.map((kw, i) => (
                            <span key={i} className='ats-chip ats-chip--matched'>✔ {kw}</span>
                        ))}
                    </div>
                </div>

                {/* Missing Keywords */}
                <div className='keyword-card'>
                    <div className='keyword-card__header'>
                        <h3>⚠️ Crucial Keywords Missing from Resume</h3>
                        <span className='count-badge count-badge--red'>{missingKeywords.length} Missing</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#7d8590", marginBottom: "0.75rem" }}>
                        Add these terms to your experience bullets or skills section to beat the ATS filter:
                    </p>
                    <div className='chip-container'>
                        {missingKeywords.map((kw, i) => (
                            <span key={i} className='ats-chip ats-chip--missing'>+ {kw}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

// ── Sub-component: Cold Outreach Generator ───────────────────────────────────
const OutreachSection = ({ interviewId }) => {
    const [ outreach, setOutreach ] = useState(null)
    const [ loading, setLoading ] = useState(false)
    const [ copiedField, setCopiedField ] = useState("")

    useEffect(() => {
        const fetchOutreach = async () => {
            setLoading(true)
            try {
                const res = await getOutreach(interviewId)
                setOutreach(res.outreach)
            } catch (err) {
                console.error("Outreach fetch error:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchOutreach()
    }, [ interviewId ])

    const handleCopy = (text, fieldName) => {
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(""), 2000)
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem" }}>
                <h3>Generating tailored outreach messages with AI...</h3>
            </div>
        )
    }

    return (
        <section className='outreach-container'>
            <div className='content-header'>
                <div>
                    <h2>✉️ 1-Click HR & Recruiter Outreach Generator</h2>
                    <p style={{ color: "#7d8590", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        Direct outreach to recruiters or engineering managers increases your interview call rate by 3x.
                    </p>
                </div>
            </div>

            {/* Cold Email */}
            <div className='outreach-box'>
                <div className='outreach-box__header'>
                    <h3>📧 Cold Email to Hiring Manager / Recruiter</h3>
                    <button
                        className={`copy-btn ${copiedField === 'email' ? 'copy-btn--copied' : ''}`}
                        onClick={() => handleCopy(`${outreach?.coldEmailSubject}\n\n${outreach?.coldEmailBody}`, 'email')}
                    >
                        {copiedField === 'email' ? '✔ Copied to Clipboard!' : 'Copy Email'}
                    </button>
                </div>
                <div className='outreach-subject'>
                    <strong>Subject:</strong> {outreach?.coldEmailSubject || "Application for Software Engineer Role"}
                </div>
                <div className='outreach-content'>
                    {outreach?.coldEmailBody}
                </div>
            </div>

            {/* LinkedIn Note */}
            <div className='outreach-box'>
                <div className='outreach-box__header'>
                    <h3>💼 LinkedIn Connection Request Note (&lt;300 Chars)</h3>
                    <button
                        className={`copy-btn ${copiedField === 'linkedin' ? 'copy-btn--copied' : ''}`}
                        onClick={() => handleCopy(outreach?.linkedInNote, 'linkedin')}
                    >
                        {copiedField === 'linkedin' ? '✔ Copied to Clipboard!' : 'Copy LinkedIn Note'}
                    </button>
                </div>
                <div className='outreach-content' style={{ fontSize: "0.9rem" }}>
                    {outreach?.linkedInNote}
                </div>
            </div>
        </section>
    )
}

// ── Sub-component: Interactive Roadmap Checklist ─────────────────────────────
const InteractiveRoadmap = ({ preparationPlan, interviewId }) => {
    const storageKey = `roadmap_tasks_${interviewId}`

    const [ checkedTasks, setCheckedTasks ] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            return saved ? JSON.parse(saved) : {}
        } catch {
            return {}
        }
    })

    const toggleTask = (taskId) => {
        setCheckedTasks(prev => {
            const updated = { ...prev, [ taskId ]: !prev[ taskId ] }
            localStorage.setItem(storageKey, JSON.stringify(updated))
            return updated
        })
    }

    const totalTasks = preparationPlan.reduce((acc, day) => acc + (day.tasks?.length || 0), 0)
    const completedTasks = Object.values(checkedTasks).filter(Boolean).length
    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <section>
            <div className='content-header'>
                <div>
                    <h2>🗺️ Interactive Day-by-Day Preparation Tracker</h2>
                    <p style={{ color: "#7d8590", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                        Track your daily progress. Tasks are saved automatically in your browser.
                    </p>
                </div>
                <span className='content-header__count'>{preparationPlan.length}-day plan</span>
            </div>

            {/* Progress Card */}
            <div className='progress-card'>
                <div className='progress-info'>
                    <span><strong>Overall Readiness Progress:</strong> {completedTasks} of {totalTasks} tasks completed</span>
                    <span className='progress-pct'>{progressPct}% Ready</span>
                </div>
                <div className='progress-bar-bg'>
                    <div className='progress-bar-fill' style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* Roadmap Days */}
            <div className='roadmap-list'>
                {preparationPlan.map((day) => (
                    <div key={day.day} className='roadmap-day'>
                        <div className='roadmap-day__header'>
                            <span className='roadmap-day__badge'>Day {day.day}</span>
                            <h3 className='roadmap-day__focus'>{day.focus}</h3>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.5rem 0" }}>
                            {day.tasks.map((task, i) => {
                                const taskId = `d${day.day}_t${i}`
                                const isDone = !!checkedTasks[ taskId ]
                                return (
                                    <label key={i} className='interactive-task' onClick={() => toggleTask(taskId)}>
                                        <input
                                            type="checkbox"
                                            checked={isDone}
                                            onChange={() => {}}
                                        />
                                        <span className={isDone ? 'task--completed' : ''}>
                                            {task}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ── Main Page Component ───────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ])

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Workspace</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                        <button
                            onClick={() => window.print()}
                            className='button'
                            style={{
                                background: "#1e293b",
                                border: "1px solid #334155",
                                color: "#cbd5e1",
                                padding: "0.6rem 0.8rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.825rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.4rem"
                            }}
                        >
                            🖨️ Print / Save Report
                        </button>
                        <button
                            onClick={() => { getResumePdf(interviewId) }}
                            className='button primary-button'
                        >
                            <svg height={"0.8rem"} style={{ marginRight: "0.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            Download Resume
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'mock' && (
                        <MockInterviewSection
                            questions={[ ...(report.technicalQuestions || []), ...(report.behavioralQuestions || []) ]}
                            jobDescription={report.jobDescription}
                        />
                    )}

                    {activeNav === 'ats' && (
                        <AtsAnalyzerSection report={report} />
                    )}

                    {activeNav === 'outreach' && (
                        <OutreachSection interviewId={interviewId} />
                    )}

                    {activeNav === 'roadmap' && (
                        <InteractiveRoadmap
                            preparationPlan={report.preparationPlan}
                            interviewId={interviewId}
                        />
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Profile Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>
                            {report.matchScore >= 80 ? "Top Candidate Match" : report.matchScore >= 60 ? "Moderate Match - Bridge Gaps" : "Needs Skill Preparation"}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Identified Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview