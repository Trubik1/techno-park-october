"""
Idempotent seed script: creates teacher (PIN 123456) and
quiz "Древние люди на территории Беларуси" (14 questions).

Safe to re-run — skips if both teacher and quiz already exist.
Also exports CSV to ../quizzes/ on first creation.
"""
import uuid, csv, os
from datetime import datetime, timezone
from passlib.context import CryptContext
from app.db.database import SessionLocal, engine, Base
from app import models

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

PIN = "123456"
TITLE = "Древние люди на территории Беларуси"

QUESTIONS_DATA = [
    {
        "text": "На сколько периодов делится история первобытного общества? Названия периодов связаны с...",
        "opt_a": "Материалом для изготовления орудий труда",
        "opt_b": "Местом обитания древних людей",
        "opt_c": "Количеством найденных стоянок",
        "opt_d": "Видом хозяйственной деятельности",
        "correct": "a",
        "explanation": "Каменный век, бронзовый век, железный век — названия связаны с материалом для орудий труда."
    },
    {
        "text": "Какой период является самым древним в истории первобытного общества на территории Беларуси?",
        "opt_a": "Палеолит",
        "opt_b": "Мезолит",
        "opt_c": "Неолит",
        "opt_d": "Железный век",
        "correct": "a",
        "explanation": "Палеолит (древнекаменный век) — самый длительный период каменного века."
    },
    {
        "text": "Какая стоянка является самой древней на территории Беларуси?",
        "opt_a": "У деревни Юровичи (24 тыс. лет до н.э.)",
        "opt_b": "У деревни Бердыж (21 тыс. лет до н.э.)",
        "opt_c": "Красносельские шахты",
        "opt_d": "Городища балтов",
        "correct": "a",
        "explanation": "Самая древняя стоянка (24 тыс. лет до н.э.) находится у деревни Юровичи (Гомельская область)."
    },
    {
        "text": "Каким было основное занятие кроманьонцев на территории Беларуси?",
        "opt_a": "Земледелие",
        "opt_b": "Охота и собирательство",
        "opt_c": "Ремесло и торговля",
        "opt_d": "Скотоводство",
        "correct": "b",
        "explanation": "Основным занятием кроманьонцев являлись охота и собирательство (присваивающее хозяйство)."
    },
    {
        "text": "Какое важное изобретение было сделано в позднеледниковый период?",
        "opt_a": "Бронзовый топор",
        "opt_b": "Лук и стрелы",
        "opt_c": "Глиняная посуда",
        "opt_d": "Железный плуг",
        "correct": "b",
        "explanation": "В позднеледниковый период были изобретены лук и стрелы, что позволило более эффективно охотиться."
    },
    {
        "text": "Что принесли с собой индоевропейцы в бронзовом веке?",
        "opt_a": "Лук и стрелы",
        "opt_b": "Производящие виды хозяйства и бронзовые изделия",
        "opt_c": "Глиняную посуду",
        "opt_d": "Религиозные верования",
        "correct": "b",
        "explanation": "Индоевропейцы принесли производящие виды хозяйства (животноводство и земледелие), а также бронзовые и медные изделия."
    },
    {
        "text": "Какие уникальные исторические шахты по добыче кремня находятся на территории Беларуси?",
        "opt_a": "Солигорские шахты",
        "opt_b": "Красносельские шахты",
        "opt_c": "Березовские шахты",
        "opt_d": "Житковичские шахты",
        "correct": "b",
        "explanation": "Красносельские шахты — уникальный исторический объект, где древние люди массово добывали кремень."
    },
    {
        "text": "В каком веке начался железный век на территории Беларуси?",
        "opt_a": "VII в. до н.э.",
        "opt_b": "III в. до н.э.",
        "opt_c": "I в. н.э.",
        "opt_d": "V в. н.э.",
        "correct": "a",
        "explanation": "Железный век начался в VII в. до н.э. с открытия способа выплавки железа из болотной руды."
    },
    {
        "text": "Какие три вида земледелия сложились на территории Беларуси в бронзовом и железном веках?",
        "opt_a": "Мотыжное, подсечно-огневое, пашенное",
        "opt_b": "Ирригационное, террасное, поливное",
        "opt_c": "Парниковое, тепличное, полевое",
        "opt_d": "Огородное, садовое, лесное",
        "correct": "a",
        "explanation": "Три основных вида: мотыжное, подсечно-огневое (лядное) и пашенное земледелие."
    },
    {
        "text": "Какая форма религии связана с верой в существование особой мистической связи между группой людей и определённым видом животных или растений?",
        "opt_a": "Анимизм",
        "opt_b": "Тотемизм",
        "opt_c": "Фетишизм",
        "opt_d": "Магия",
        "correct": "b",
        "explanation": "Тотемизм — вера в мистическую связь между группой людей и определённым видом животных или растений."
    },
    {
        "text": "Что такое «крица» в железном веке?",
        "opt_a": "Древнее орудие труда",
        "opt_b": "Пористая масса железа, полученная в домнице",
        "opt_c": "Укреплённое поселение",
        "opt_d": "Земляная насыпь над могилой",
        "correct": "b",
        "explanation": "Крица — пористая масса железа, получаемая при выплавке из болотной руды в домнице."
    },
    {
        "text": "Что такое «соседская община»?",
        "opt_a": "Объединение только по кровному принципу",
        "opt_b": "Объединение людей по кровному и соседскому принципу",
        "opt_c": "Временный союз племён",
        "opt_d": "Религиозная группа",
        "correct": "b",
        "explanation": "Соседская община — объединение людей не только по кровному, но и по соседскому принципу."
    },
    {
        "text": "Какой торговый путь проходил через территорию Беларуси?",
        "opt_a": "Великий шёлковый путь",
        "opt_b": "Янтарный путь",
        "opt_c": "Путь из варяг в греки",
        "opt_d": "Соляной путь",
        "correct": "b",
        "explanation": "Через территорию Беларуси проходил «янтарный путь», связывавший Прибалтику и Средиземноморье."
    },
    {
        "text": "Как называется обычай насыпать земляную насыпь над могилой?",
        "opt_a": "Дольмен",
        "opt_b": "Курган",
        "opt_c": "Менгир",
        "opt_d": "Кромлех",
        "correct": "b",
        "explanation": "Курган — земляная насыпь над могилой, часть похоронного обряда древних людей."
    },
]

def seed(destructive=False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # --- Find or create teacher ---
    teacher = db.query(models.Teacher).filter(
        models.Teacher.name == "Учитель истории"
    ).first()

    if not teacher:
        teacher = models.Teacher(
            id=uuid.uuid4(),
            name="Учитель истории",
            pin_hash=pwd.hash(PIN),
            created_at=datetime.now(timezone.utc)
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
    else:
        teacher.pin_hash = pwd.hash(PIN)
        db.commit()

    # --- Find or create quiz ---
    quiz = db.query(models.Quiz).filter(
        models.Quiz.title == TITLE,
        models.Quiz.teacher_id == teacher.id,
    ).first()

    if quiz and db.query(models.Question).filter(models.Question.quiz_id == quiz.id).count() == 14:
        if not destructive:
            qc = db.query(models.Question).filter(models.Question.quiz_id == quiz.id).count()
            db.close()
            return False  # already exists

        # Recreate
        db.query(models.Question).filter(models.Question.quiz_id == quiz.id).delete()
        db.delete(quiz)
        db.commit()

    # Delete partial quiz if exists
    if quiz:
        db.query(models.Question).filter(models.Question.quiz_id == quiz.id).delete()
        db.delete(quiz)
        db.commit()

    quiz = models.Quiz(
        id=uuid.uuid4(),
        title=TITLE,
        subject="История Беларуси",
        grade="9",
        teacher_id=teacher.id,
        created_at=datetime.now(timezone.utc),
        is_public=True,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q_data in QUESTIONS_DATA:
        question = models.Question(
            id=uuid.uuid4(),
            quiz_id=quiz.id,
            text=q_data["text"],
            opt_a=q_data["opt_a"],
            opt_b=q_data["opt_b"],
            opt_c=q_data["opt_c"],
            opt_d=q_data["opt_d"],
            correct=q_data["correct"],
            explanation=q_data.get("explanation", ""),
        )
        db.add(question)

    db.commit()

    # --- Export CSV to quizzes/ folder ---
    quizzes_dir = os.path.join(os.path.dirname(__file__), '..', 'quizzes')
    csv_path = os.path.join(quizzes_dir, 'drevnie_lyudi_belarus.csv')
    if not os.path.exists(quizzes_dir):
        os.makedirs(quizzes_dir, exist_ok=True)

    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(["question", "opt_a", "opt_b", "opt_c", "opt_d", "correct", "explanation"])
        for qd in QUESTIONS_DATA:
            writer.writerow([qd["text"], qd["opt_a"], qd["opt_b"], qd["opt_c"], qd["opt_d"], qd["correct"], qd.get("explanation", "")])

    t_name = teacher.name
    db.close()
    print(f"Quiz created: '{TITLE}' ({len(QUESTIONS_DATA)} questions)")
    print(f"Teacher: {t_name} (PIN: {PIN})")
    print(f"CSV exported: {csv_path}")
    return True

if __name__ == "__main__":
    seed()
