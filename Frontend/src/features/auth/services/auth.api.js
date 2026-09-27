import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true
})

// Attach Bearer token if present in localStorage (ensures cross-domain auth works on Vercel)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("genai_token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({ username, email, password }) {
    const response = await api.post('/api/auth/register', {
        username, email, password
    })
    if (response.data?.token) {
        localStorage.setItem("genai_token", response.data.token)
    }
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", {
        email, password
    })
    if (response.data?.token) {
        localStorage.setItem("genai_token", response.data.token)
    }
    return response.data
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        localStorage.removeItem("genai_token")
        return response.data
    } catch (err) {
        localStorage.removeItem("genai_token")
        throw err
    }
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}