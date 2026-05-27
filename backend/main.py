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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаём таблицы БД при старте
Base.metadata.create_all(bind=engine)

# Авто-сидирование базового теста при пустой БД
from app.db.database import SessionLocal
from app.crud import BASE_QUIZ_TITLE
from app import models

def _ensure_seed(title, module_name):
    _db = SessionLocal()
    try:
        exists = _db.query(models.Quiz).filter(models.Quiz.title == title).first()
        if not exists:
            import importlib
            mod = importlib.import_module(module_name)
            mod.seed()
            print(f"Quiz auto-seeded on startup: {title}")
        else:
            qc = _db.query(models.Question).filter(models.Question.quiz_id == exists.id).count()
            print(f"Quiz already present: {title} ({qc} questions)")
    finally:
        _db.close()

_ensure_seed(BASE_QUIZ_TITLE, "seed_quiz_b1v1")
_ensure_seed("Полоцкое и Туровское княжества", "seed_quiz_b2")

# Включаем API роутер
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ClassQuiz API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)