@echo off
chcp 65001 >nul
REM Launch ClassQuiz (QuizFlow) backend and frontend
REM Backend: FastAPI on http://localhost:8000
REM Frontend: Vite React on http://localhost:5173
REM Docker:  docker-compose up --build

echo.
echo ╔════════════════════════════════════════╗
echo ║        ClassQuiz (QuizFlow)            ║
echo ╚════════════════════════════════════════╝
echo.
echo Выберите способ запуска:
echo.
echo  [1] Native (отдельные окна cmd)
echo  [2] Docker (docker-compose)
echo  [0] Выход
echo.

choice /c 120 /n /m "Ваш выбор (1/2/0): "
if errorlevel 3 exit /b 0
if errorlevel 2 goto docker
if errorlevel 1 goto native

:native
echo.
echo [1/4] Setting up backend...
cd /d "%~dp0backend"
if not exist venv python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt >nul

echo [2/4] Seeding database...
python seed_quiz_b1v1.py
if %ERRORLEVEL% neq 0 echo Seed done

echo [3/4] Starting backend (http://localhost:8000)...
start "" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && uvicorn main:app --reload"

echo [4/4] Starting frontend (http://localhost:5173)...
start "" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo Both servers are launching.
echo Backend (API): http://localhost:8000
echo Frontend:       http://localhost:5173
echo.
echo To stop, close the respective command windows or press Ctrl+C in each.
pause
exit /b

:docker
echo.
echo Starting with Docker...
docker-compose up --build
pause
exit /b