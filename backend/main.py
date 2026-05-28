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
    # Помечаем сидированные тесты (билеты) как публичные
    conn.execute(text("UPDATE quizzes SET is_public = 1 WHERE title LIKE 'Билет %' AND (is_public IS NULL OR is_public = 0)"))
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
_ensure_seed("Билет 2. Полоцкое и Туровское княжества", "seed_quiz_b2")
_ensure_seed("Билет 3. Христианизация белорусских земель. Внешняя политика Республики Беларусь", "seed_quiz_b3")
_ensure_seed("Билет 4. Образование ВКЛ. Наука, образование, культура и спорт в РБ", "seed_quiz_b4")
_ensure_seed("Билет 5. Борьба с крестоносцами. Культура БССР 1940-1980-е", "seed_quiz_b5")
_ensure_seed("Билет 6. Франциск Скорина. Общественно-политическая жизнь в БССР", "seed_quiz_b6")
_ensure_seed("Билет 7. Отечественная война 1812 г. Социально-экономическое развитие БССР", "seed_quiz_b7")
_ensure_seed("Билет 8. Люблинская уния. Наш край в годы ВОВ (г. Гомель)", "seed_quiz_b8")
_ensure_seed("Билет 9. Формирование белорусской народности. Вклад в победу над нацизмом", "seed_quiz_b9")
_ensure_seed("Билет 10. Аграрные реформы XIX-XX вв. ВОВ в памяти народа", "seed_quiz_b10")
_ensure_seed("Билет 11. Революции 1905-1907 и 1917 гг. Освобождение Беларуси", "seed_quiz_b11")
_ensure_seed("Билет 12. Беларусь в годы Первой мировой войны. Воссоединение Западной Беларуси с БССР", "seed_quiz_b12")
_ensure_seed("Билет 13. Октябрьская революция 1917 г. Партизанское движение в годы ВОВ", "seed_quiz_b13")
_ensure_seed("Билет 14. Создание ССРБ. Германский оккупационный режим 1941-1944", "seed_quiz_b14")
_ensure_seed("Билет 15. Польско-советская война 1919-1921. НЭП в БССР", "seed_quiz_b15")
_ensure_seed("Билет 16. Политика белорусизации. Начало Великой Отечественной войны", "seed_quiz_b16")
_ensure_seed("Билет 17. Индустриализация и коллективизация в БССР. Становление национальной государственности", "seed_quiz_b17")
_ensure_seed("Билет 18. Западная Беларусь в составе Польши. Культура Беларуси XIX — начала XX в.", "seed_quiz_b18")
_ensure_seed("Билет 19. Подвиг народа в ВОВ. Наш край в XIII-XVIII вв.", "seed_quiz_b19")
_ensure_seed("Билет 20. Геноцид населения Беларуси в ВОВ. Культура XIV-XVIII вв.", "seed_quiz_b20")
_ensure_seed("Билет 21. БССР 1940-1980-е: соцэкономразвитие. Разделы Речи Посполитой", "seed_quiz_b21")
_ensure_seed("Билет 22. БССР 1940-1980-е: образование, наука, культура. Хозяйство XIX - нач. XX в.", "seed_quiz_b22")
_ensure_seed("Билет 23. Государственный суверенитет РБ. Хозяйство XIV-XVIII вв.", "seed_quiz_b23")
_ensure_seed("Билет 24. Внешняя политика РБ. Хозяйственная жизнь IX-XIII вв.", "seed_quiz_b24")
_ensure_seed("Билет 25. Соцэкономразвитие РБ. Восточные славяне на территории Беларуси", "seed_quiz_b25")

# Включаем API роутер
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ClassQuiz API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)