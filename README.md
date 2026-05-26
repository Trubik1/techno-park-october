# ClassQuiz (QuizFlow)

Интерактивная квиз-платформа для повышения вовлечённости и качества усвоения материала учащимися 8–11 классов.

## Описание проекта

ClassQuiz — это веб-приложение для проведения интерактивных викторин в образовательной среде. Платформа позволяет учителям создавать и проводить квизы, а ученикам — участвовать в них, получая мгновенную обратную связь.

## Технологический стек

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- React Router

### Backend
- Python + FastAPI
- SQLite (SQLAlchemy ORM)
- Pydantic для валидации данных

### Развёртывание
- Frontend: Vercel
- Backend: Render

## Особенности

### Для учителей:
- Вход по простому PIN-коду
- Создание тестов вручную (вопрос, 4 варианта ответа, правильный ответ, объяснение)
- Импорт тестов из CSV/Excel файлов с валидацией
- Генерация 4-значного кода для сессии
- Мониторинг результатов в реальном времени
- Экспорт результатов в CSV

### Для учеников:
- Вход без пароля (имя и класс → UUID, сохраняется в localStorage)
- Подключение к сессии по 4-значному коду
- Мгновенная обратная связь после каждого ответа
- Личный кабинет с историей тестов и прогрессом
- Анонимность (отображаются только имя и класс)

## Архитектура базы данных

См. `backend/app/models.py` для полной схемы.

## API эндпоинты

### Регистрация ученика
```
POST /api/students/register
```

### Вход учителя
```
POST /api/teachers/login
```

### Управление тестами
```
POST /api/quizzes/
GET /api/quizzes/
GET /api/quizzes/{quiz_id}
```

### Управление вопросами
```
POST /api/questions/
GET /api/questions/?quiz_id={uuid}
GET /api/questions/{question_id}
```

### Управление сессиями
```
POST /api/sessions/
GET /api/sessions/{code}
POST /api/sessions/{session_id}/close
```

### Результаты
```
POST /api/results/
GET /api/results/session/{session_id}
GET /api/results/student/{student_id}
```

### Импорт тестов
```
POST /api/quizzes/import/preview
POST /api/quizzes/import/confirm
```

## Установка и запуск

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Лицензия

MIT