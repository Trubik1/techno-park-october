from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.v1.api import api_router
from app.db.database import engine, Base

app = FastAPI(title="ClassQuiz API", version="1.0.0")

# CORS middleware для разрешения запросов с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на конкретные домены
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаём таблицы БД при старте
Base.metadata.create_all(bind=engine)

# Простая миграция для добавления колонок, которых может не быть в старой БД
from sqlalchemy import text
with engine.connect() as conn:
    # Добавляем is_public в quizzes, если нет
    cursor = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='quizzes'"))
    row = cursor.fetchone()
    if row and 'is_public' not in row[0]:
        conn.execute(text("ALTER TABLE quizzes ADD COLUMN is_public BOOLEAN DEFAULT 0"))
        conn.commit()
    # Добавляем total_questions в results, если нет
    cursor2 = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='results'"))
    row2 = cursor2.fetchone()
    if row2 and 'total_questions' not in row2[0]:
        conn.execute(text("ALTER TABLE results ADD COLUMN total_questions INTEGER DEFAULT 0"))
        conn.commit()
    # Добавляем time_limit_quiz в quizzes, если нет
    cursor3 = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='quizzes'"))
    row3 = cursor3.fetchone()
    if row3 and 'time_limit_quiz' not in row3[0]:
        conn.execute(text("ALTER TABLE quizzes ADD COLUMN time_limit_quiz INTEGER DEFAULT 2700"))
        conn.execute(text("ALTER TABLE quizzes ADD COLUMN time_limit_question INTEGER DEFAULT 30"))
        conn.commit()
    # Добавляем sort_order в questions, если нет
    cursor4 = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'"))
    row4 = cursor4.fetchone()
    if row4 and 'sort_order' not in row4[0]:
        conn.execute(text("ALTER TABLE questions ADD COLUMN sort_order INTEGER DEFAULT 0"))
        conn.commit()

# Авто-сидирование временно отключено для чистой БД
# from app.db.database import SessionLocal
# from app.crud import BASE_QUIZ_TITLE
# from app import models

# def _ensure_seed(title, module_name):
#     _db = SessionLocal()
#     try:
#         exists = _db.query(models.Quiz).filter(models.Quiz.title == title).first()
#         if not exists:
#             import importlib
#             mod = importlib.import_module(module_name)
#             mod.seed()
#             print(f"Quiz auto-seeded on startup: {title}")
#         else:
#             qc = _db.query(models.Question).filter(models.Question.quiz_id == exists.id).count()
#             print(f"Quiz already present: {title} ({qc} questions)")
#     finally:
#         _db.close()

# _ensure_seed(BASE_QUIZ_TITLE, "seed_quiz_b1v1")
# _ensure_seed("Билет 2. Полоцкое и Туровское княжества", "seed_quiz_b2")
# ... (остальные сиды отключены)

# # Удаляем клоны сидированных тестов
# with engine.connect() as conn:
#     from app.crud import verify_pin
#     first_teacher = conn.execute(text("SELECT id FROM teachers ORDER BY created_at ASC LIMIT 1")).fetchone()
#     if first_teacher:
#         _seed_tid = str(first_teacher[0])
#         conn.execute(text("DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE title LIKE 'Билет %' AND teacher_id != :tid)"), {"tid": _seed_tid})
#         conn.execute(text("DELETE FROM results WHERE session_id IN (SELECT id FROM sessions WHERE quiz_id IN (SELECT id FROM quizzes WHERE title LIKE 'Билет %' AND teacher_id != :tid))"), {"tid": _seed_tid})
#         conn.execute(text("DELETE FROM sessions WHERE quiz_id IN (SELECT id FROM quizzes WHERE title LIKE 'Билет %' AND teacher_id != :tid)"), {"tid": _seed_tid})
#         conn.execute(text("DELETE FROM session_participants WHERE session_id IN (SELECT id FROM sessions WHERE quiz_id IN (SELECT id FROM quizzes WHERE title LIKE 'Билет %' AND teacher_id != :tid))"), {"tid": _seed_tid})
#         conn.execute(text("DELETE FROM quizzes WHERE title LIKE 'Билет %' AND teacher_id != :tid"), {"tid": _seed_tid})
#         conn.commit()

# Включаем API роутер
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ClassQuiz API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)