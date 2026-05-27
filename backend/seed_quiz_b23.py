"""
Idempotent seed script: creates quiz "Государственный суверенитет РБ. Хозяйство XIV-XVIII вв." (7 questions).

Based on Билет №23, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 23. Государственный суверенитет РБ. Хозяйство XIV-XVIII вв."

QUESTIONS_DATA = [
    {
        "text": "Когда была принята Декларация о государственном суверенитете БССР?",
        "opt_a": "27 июля 1990 г.",
        "opt_b": "25 августа 1991 г.",
        "opt_c": "19 сентября 1991 г.",
        "opt_d": "8 декабря 1991 г.",
        "correct": "a",
        "explanation": "27 июля 1990 г. Верховный Совет БССР принял Декларацию о государственном суверенитете БССР, провозгласившую верховенство республиканских законов над союзными."
    },
    {
        "text": "25 августа 1991 г. произошло событие, связанное с КПСС-КПБ. Что именно?",
        "opt_a": "Принятие Декларации о суверенитете",
        "opt_b": "Приостановление деятельности КПСС-КПБ на территории Беларуси",
        "opt_c": "Переименование КПБ в новую партию",
        "opt_d": "Проведение съезда КПСС в Минске",
        "correct": "b",
        "explanation": "25 августа 1991 г. Верховный Совет БССР принял постановление о приостановлении деятельности КПСС-КПБ на территории республики."
    },
    {
        "text": "Когда БССР была переименована в Республику Беларусь?",
        "opt_a": "27 июля 1990 г.",
        "opt_b": "25 августа 1991 г.",
        "opt_c": "19 сентября 1991 г.",
        "opt_d": "8 декабря 1991 г.",
        "correct": "c",
        "explanation": "19 сентября 1991 г. Верховный Совет принял закон о переименовании БССР в Республику Беларусь, а также утвердил новый герб «Погоня» и бело-красно-белый флаг."
    },
    {
        "text": "Какое событие произошло 8 декабря 1991 г.?",
        "opt_a": "Принятие Конституции Республики Беларусь",
        "opt_b": "Подписание Беловежских соглашений и распад СССР",
        "opt_c": "Первый республиканский референдум",
        "opt_d": "Выборы первого Президента Беларуси",
        "correct": "b",
        "explanation": "8 декабря 1991 г. руководители Беларуси, России и Украины подписали Беловежские соглашения, которые констатировали распад СССР и создание СНГ."
    },
    {
        "text": "Когда была принята Конституция Республики Беларусь?",
        "opt_a": "27 июля 1990 г.",
        "opt_b": "15 марта 1994 г.",
        "opt_c": "19 сентября 1991 г.",
        "opt_d": "8 декабря 1991 г.",
        "correct": "b",
        "explanation": "Конституция Республики Беларусь была принята 15 марта 1994 г. Верховным Советом. Она закрепила основы государственного строя и статус Президента."
    },
    {
        "text": "Какая аграрная реформа XVI в. предусматривала измерение земли волоками и создание фольварков?",
        "opt_a": "Реформа Изяслава",
        "opt_b": "«Волочная помера» Сигизмунда II Августа",
        "opt_c": "Столыпинская реформа",
        "opt_d": "Реформа Ивана III",
        "correct": "b",
        "explanation": "«Волочная помера» (1557 г.) — аграрная реформа великого князя Сигизмунда II Августа, которая ввела единицу земли «волока» (около 21,36 га) и способствовала развитию фольварков — товарных хозяйств, работавших на рынок."
    },
    {
        "text": "Что такое Магдебургское право, которое получали белорусские города?",
        "opt_a": "Право на создание цехов",
        "opt_b": "Право на самоуправление города, освобождение от власти воевод и ряд экономических привилегий",
        "opt_c": "Право на торговлю с Западной Европой",
        "opt_d": "Право на освобождение от налогов",
        "correct": "b",
        "explanation": "Магдебургское право давало городу самоуправление (собственный магистрат), освобождение от власти воевод и княжеских наместников, а также льготы в торговле и ремесле."
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
    csv_filename = 'gosudarstvennyj_suverenitet_rb_hozyajstvo.csv'
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
