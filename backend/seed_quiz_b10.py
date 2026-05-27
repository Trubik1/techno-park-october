"""
Idempotent seed script: creates quiz "Аграрные реформы XIX-XX вв. ВОВ в памяти народа" (7 questions).

Based on Билет №10, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 10. Аграрные реформы XIX-XX вв. ВОВ в памяти народа"

QUESTIONS_DATA = [
    {
        "text": "Когда была проведена реформа государственной деревни П.Д. Киселева?",
        "opt_a": "1800–1810-е гг.",
        "opt_b": "1830–1840-е гг.",
        "opt_c": "1850–1860-е гг.",
        "opt_d": "1905–1907 гг.",
        "correct": "b",
        "explanation": "Реформа П.Д. Киселева (инвентарная реформа) проводилась в 1830–1840-е гг. и была направлена на реформирование государственной деревни."
    },
    {
        "text": "В каком году Александр II подписал Манифест об отмене крепостного права?",
        "opt_a": "19 февраля 1855 г.",
        "opt_b": "19 февраля 1861 г.",
        "opt_c": "19 февраля 1863 г.",
        "opt_d": "19 февраля 1881 г.",
        "correct": "b",
        "explanation": "Манифест об отмене крепостного права был подписан Александром II 19 февраля 1861 г. Крестьяне получили личную свободу, но выкуп земли проводился по завышенной цене."
    },
    {
        "text": "Как распределялась выкупная сумма за землю по реформе 1861 г.?",
        "opt_a": "100% платил крестьянин сразу",
        "opt_b": "50% — крестьянин, 50% — государство",
        "opt_c": "20% — крестьянин, 80% — государство, выплаты на 49 лет",
        "opt_d": "80% — крестьянин, 20% — государство",
        "correct": "c",
        "explanation": "Крестьянин платил 20% стоимости земли, а 80% вносило государство. Выплаты растягивались на 49 лет. До завершения выкупа крестьяне считались временнообязанными."
    },
    {
        "text": "Какие формы землепользования вводились по Столыпинской аграрной реформе (с 9 ноября 1906 г.)?",
        "opt_a": "Колхозы и совхозы",
        "opt_b": "Отруба и хутора",
        "opt_c": "Помещичьи имения",
        "opt_d": "Общинные наделы",
        "correct": "b",
        "explanation": "Столыпинская реформа, начатая 9 ноября 1906 г., была направлена на разрушение общины и введение отрубов и хуторов. Также поощрялось переселение крестьян за Урал и в Сибирь."
    },
    {
        "text": "Где находится мемориальный комплекс «Хатынь»?",
        "opt_a": "Брестский район",
        "opt_b": "Логойский район",
        "opt_c": "Мозырский район",
        "opt_d": "Гродненский район",
        "correct": "b",
        "explanation": "Хатынь находится в Логойском районе. В центре мемориала — скульптура «Непокоренный человек», а также Кладбище деревень с 185 урнами, символизирующими сожжённые деревни."
    },
    {
        "text": "Сколько жителей погибло в сожжённой деревне Ола, и сколько среди них было детей?",
        "opt_a": "1758 жителей, 950 детей",
        "opt_b": "950 жителей, 500 детей",
        "opt_c": "2000 жителей, 1000 детей",
        "opt_d": "1495 жителей, 800 детей",
        "correct": "a",
        "explanation": "В мемориале «Ола» увековечена память 1758 жителей, погибших от рук нацистов, из которых 950 — дети."
    },
    {
        "text": "Сколько томов насчитывает книга «Память» — издание, посвящённое истории белорусских сёл и городов в годы ВОВ?",
        "opt_a": "146 томов",
        "opt_b": "100 томов",
        "opt_c": "120 томов",
        "opt_d": "200 томов",
        "correct": "a",
        "explanation": "Книга «Память» насчитывает 146 томов. Это масштабное издание, посвящённое истории населённых пунктов Беларуси в годы Великой Отечественной войны."
    },
]

def seed(destructive=False):
    db = SessionLocal()

    teacher = db.query(models.Teacher).filter(
        models.Teacher.name == "Учитель истории"
    ).first()
    if not teacher:
        db.close()
        print("No teacher found. Run seed_quiz_b1v1 first.")
        return False

    quiz = db.query(models.Quiz).filter(
        models.Quiz.title == TITLE,
        models.Quiz.teacher_id == teacher.id,
    ).first()

    expected = len(QUESTIONS_DATA)

    if quiz and db.query(models.Question).filter(models.Question.quiz_id == quiz.id).count() == expected:
        if not destructive:
            db.close()
            return False

        db.query(models.Question).filter(models.Question.quiz_id == quiz.id).delete()
        db.delete(quiz)
        db.commit()
        quiz = None

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
        time_limit_quiz=2700,
        time_limit_question=30,
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

    quizzes_dir = os.path.join(os.path.dirname(__file__), '..', 'quizzes')
    csv_filename = 'agrarnye_reformy_vov_pamyat.csv'
    csv_path = os.path.join(quizzes_dir, csv_filename)
    if not os.path.exists(quizzes_dir):
        os.makedirs(quizzes_dir, exist_ok=True)

    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(["question", "opt_a", "opt_b", "opt_c", "opt_d", "correct", "explanation"])
        for qd in QUESTIONS_DATA:
            writer.writerow([qd["text"], qd["opt_a"], qd["opt_b"], qd["opt_c"], qd["opt_d"], qd["correct"], qd.get("explanation", "")])

    db.close()
    print(f"Quiz created: '{TITLE}' ({expected} questions)")
    print(f"CSV exported: {csv_path}")
    return True

if __name__ == "__main__":
    seed()
