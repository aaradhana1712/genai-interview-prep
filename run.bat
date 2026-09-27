@echo off
echo Starting GenAI Project...

start "Backend Server (Port 3000)" cmd /k "cd Backend && npm run dev"
start "Frontend Server (Port 5173)" cmd /k "cd Frontend && npm run dev"

echo Both Backend and Frontend have been launched in separate windows!
echo Frontend will be accessible at: http://localhost:5173
pause
