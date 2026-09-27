require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

connectToDB()

const server = app.listen(3000, () => {
    console.log("Server is running on port 3000")
})

server.on("error", (err) => {
    console.error("Server listen error:", err)
})