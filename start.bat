@echo off
chcp 65001 >nul
echo ClassQuiz - Docker запуск
echo ===========================
echo.
echo Собираю и запускаю контейнеры...
echo.
docker-compose up --build
if %ERRORLEVEL% neq 0 (
    echo.
    echo Ошибка Docker. Убедитесь, что Docker Desktop запущен.
    pause
)
