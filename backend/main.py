import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.db.database import engine, Base, SessionLocal

app = FastAPI(title="ClassQuiz API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Авто-сидирование общих тестов по истории (is_public=True)
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

_titles_and_modules = [
    (BASE_QUIZ_TITLE, "seed_quiz_b1v1"),
    ("Билет 2. Полоцкое и Туровское княжества", "seed_quiz_b2"),
    ("Билет 3. Христианизация белорусских земель. Внешняя политика Республики Беларусь", "seed_quiz_b3"),
    ("Билет 4. Образование ВКЛ. Наука, образование, культура и спорт в РБ", "seed_quiz_b4"),
    ("Билет 5. Борьба с крестоносцами. Культура БССР 1940-1980-е", "seed_quiz_b5"),
    ("Билет 6. Франциск Скорина. Общественно-политическая жизнь в БССР", "seed_quiz_b6"),
    ("Билет 7. Отечественная война 1812 г. Социально-экономическое развитие БССР", "seed_quiz_b7"),
    ("Билет 8. Люблинская уния. Наш край в годы ВОВ (г. Гомель)", "seed_quiz_b8"),
    ("Билет 9. Формирование белорусской народности. Вклад в победу над нацизмом", "seed_quiz_b9"),
    ("Билет 10. Аграрные реформы XIX-XX вв. ВОВ в памяти народа", "seed_quiz_b10"),
    ("Билет 11. Революции 1905-1907 и 1917 гг. Освобождение Беларуси", "seed_quiz_b11"),
    ("Билет 12. Беларусь в годы Первой мировой войны. Воссоединение Западной Беларуси с БССР", "seed_quiz_b12"),
    ("Билет 13. Октябрьская революция 1917 г. Партизанское движение в годы ВОВ", "seed_quiz_b13"),
    ("Билет 14. Создание ССРБ. Германский оккупационный режим 1941-1944", "seed_quiz_b14"),
    ("Билет 15. Польско-советская война 1919-1921. НЭП в БССР", "seed_quiz_b15"),
    ("Билет 16. Политика белорусизации. Начало Великой Отечественной войны", "seed_quiz_b16"),
    ("Билет 17. Индустриализация и коллективизация в БССР. Становление национальной государственности", "seed_quiz_b17"),
    ("Билет 18. Западная Беларусь в составе Польши. Культура Беларуси XIX — начала XX в.", "seed_quiz_b18"),
    ("Билет 19. Подвиг народа в ВОВ. Наш край в XIII-XVIII вв.", "seed_quiz_b19"),
    ("Билет 20. Геноцид населения Беларуси в ВОВ. Культура XIV-XVIII вв.", "seed_quiz_b20"),
    ("Билет 21. БССР 1940-1980-е: соцэкономразвитие. Разделы Речи Посполитой", "seed_quiz_b21"),
    ("Билет 22. БССР 1940-1980-е: образование, наука, культура. Хозяйство XIX - нач. XX в.", "seed_quiz_b22"),
    ("Билет 23. Государственный суверенитет РБ. Хозяйство XIV-XVIII вв.", "seed_quiz_b23"),
    ("Билет 24. Внешняя политика РБ. Хозяйственная жизнь IX-XIII вв.", "seed_quiz_b24"),
    ("Билет 25. Соцэкономразвитие РБ. Восточные славяне на территории Беларуси", "seed_quiz_b25"),
]

for title, module in _titles_and_modules:
    _ensure_seed(title, module)

# Включаем API роутер
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ClassQuiz API is running"}

@app.get("/api/debug")
async def debug():
    import os
    url = os.getenv("DATABASE_URL", "NOT SET")
    masked = url.replace(url.split("@")[0].split(":")[-1], "***") if "@" in url else url
    return {"database_url_preview": masked, "vercel": os.getenv("VERCEL", "not set")}

# Для Vercel serverless
handler = None
if os.getenv("VERCEL"):
    from mangum import Mangum
    handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)