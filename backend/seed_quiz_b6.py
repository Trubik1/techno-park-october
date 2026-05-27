"""
Idempotent seed script: creates quiz "Франциск Скорина. Общественно-политическая жизнь в БССР" (7 questions).

Based on Билет №6, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 6. Франциск Скорина. Общественно-политическая жизнь в БССР"

QUESTIONS_DATA = [
    {
        "text": "Уроженцем какого города был Франциск Скорина (1490–1551)?",
        "opt_a": "Полоцка",
        "opt_b": "Витебска",
        "opt_c": "Минска",
        "opt_d": "Слуцка",
        "correct": "a",
        "explanation": "Франциск Скорина родился в 1490 г. в Полоцке, где получил начальное образование, после чего отправился учиться в Краковский университет."
    },
    {
        "text": "В каком университете Франциск Скорина учился на факультете вольных искусств?",
        "opt_a": "Падуанском университете",
        "opt_b": "Краковском университете",
        "opt_c": "Пражском университете",
        "opt_d": "Виленском университете",
        "correct": "b",
        "explanation": "Франциск Скорина учился в Краковском университете на факультете вольных искусств. Позже, 9 ноября 1512 г., он получил степень доктора медицины в Падуанском университете."
    },
    {
        "text": "В каком году и где Франциск Скорина издал первую печатную книгу — «Псалтырь»?",
        "opt_a": "1512 г., Падуя",
        "opt_b": "1517 г., Прага",
        "opt_c": "1522 г., Вильно",
        "opt_d": "1525 г., Вильно",
        "correct": "b",
        "explanation": "В 1517 г. в Праге Франциск Скорина издал «Псалтырь» — первую печатную книгу. В 1517–1519 гг. он издал 23 книги Библии на старобелорусском языке."
    },
    {
        "text": "Какое издательство основал Скорина в Вильно в 1520 г.?",
        "opt_a": "Краковскую типографию",
        "opt_b": "Несвижскую типографию",
        "opt_c": "Виленскую типографию",
        "opt_d": "Пражскую типографию",
        "correct": "c",
        "explanation": "В 1520 г. Франциск Скорина основал типографию в Вильно, где в 1522 г. издал «Малую подорожную книжку», а в 1525 г. — «Апостол»."
    },
    {
        "text": "Кто из последователей Скорины издал «Катехизис» в Несвижской типографии в 1562 г.?",
        "opt_a": "Василий Тяпинский",
        "opt_b": "Иван Фёдоров",
        "opt_c": "Пётр Мстиславец",
        "opt_d": "Сымон Будный",
        "correct": "d",
        "explanation": "Сымон Будный организовал Несвижскую типографию, где в 1562 г. издал «Катехизис». Василий Тяпинский в 1570-х гг. издал «Евангелие» на двух языках, а Иван Фёдоров и Пётр Мстиславец — «Апостол» в 1564 г."
    },
    {
        "text": "Когда была принята Декларация о государственном суверенитете БССР?",
        "opt_a": "25 августа 1991 г.",
        "opt_b": "27 июля 1990 г.",
        "opt_c": "19 сентября 1991 г.",
        "opt_d": "8 декабря 1991 г.",
        "correct": "b",
        "explanation": "27 июля 1990 г. Верховный Совет БССР принял Декларацию о государственном суверенитете. 25 августа 1991 г. была приостановлена деятельность КПСС-КПБ, а 19 сентября 1991 г. республика переименована в Республику Беларусь."
    },
    {
        "text": "Какое событие произошло 8 декабря 1991 г.?",
        "opt_a": "Приостановление КПСС-КПБ",
        "opt_b": "Принятие Декларации о суверенитете",
        "opt_c": "Беловежские соглашения и распад СССР",
        "opt_d": "Переименование БССР в Республику Беларусь",
        "correct": "c",
        "explanation": "8 декабря 1991 г. руководители Беларуси, Украины и России подписали Беловежские соглашения, которые констатировали прекращение существования СССР как субъекта международного права."
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
    csv_filename = 'francisk_skorina_public_political_life_bssr.csv'
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
