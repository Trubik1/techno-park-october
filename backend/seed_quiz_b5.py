"""
Idempotent seed script: creates quiz "Борьба с крестоносцами. Культура БССР 1940-1980-е" (7 questions).

Based on Билет №5, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 5. Борьба с крестоносцами. Культура БССР 1940-1980-е"

QUESTIONS_DATA = [
    {
        "text": "В каком году крестоносцами была основана Рига, ставшая форпостом для завоевания Прибалтики?",
        "opt_a": "1187 г.",
        "opt_b": "1201 г.",
        "opt_c": "1237 г.",
        "opt_d": "1301 г.",
        "correct": "b",
        "explanation": "В 1201 г. крестоносцами была основана Рига, которая стала крупным форпостом для дальнейшего завоевания прибалтийских земель."
    },
    {
        "text": "Какой полоцкий князь в начале XIII в. успешно отбивал атаки крестоносцев на Полоцк?",
        "opt_a": "Всеслав Чародей",
        "opt_b": "Гедимин",
        "opt_c": "Владимир Полоцкий",
        "opt_d": "Кейстут",
        "correct": "c",
        "explanation": "Владимир Полоцкий в начале XIII в. возглавлял оборону Полоцка и успешно отбивал атаки крестоносцев."
    },
    {
        "text": "Кто из перечисленных государственных деятелей ВКЛ оборонял Гродно от крестоносцев в 1314 г.?",
        "opt_a": "Гедимин",
        "opt_b": "Ольгерд",
        "opt_c": "Давыд Городенский",
        "opt_d": "Андрей Полоцкий",
        "correct": "c",
        "explanation": "Давыд Городенский, будучи старостой Гродно, оборонял город в 1314 г. от нападения крестоносцев."
    },
    {
        "text": "В каком году состоялась Грюнвальдская битва, в которой объединённые силы ВКЛ и Польши разгромили Тевтонский орден?",
        "opt_a": "1385 г.",
        "opt_b": "1392 г.",
        "opt_c": "1409 г.",
        "opt_d": "1410 г.",
        "correct": "d",
        "explanation": "15 июля 1410 г. произошла Грюнвальдская битва, в которой объединённые силы ВКЛ (Ягайло и Витовт, 40 хоругвей) и Польши (51 хоругвь) разгромили Тевтонский орден. Магистр ордена Ульрих фон Юнгинген погиб, особую стойкость проявили смоленские полки."
    },
    {
        "text": "Какое произведение написал Кузьма Чорный?",
        "opt_a": "«Глубокое течение»",
        "opt_b": "«Млечный путь»",
        "opt_c": "«Люди на болоте»",
        "opt_d": "«Знак беды»",
        "correct": "b",
        "explanation": "Кузьма Чорный — автор романа «Млечный путь». Иван Шамякин написал «Глубокое течение», Иван Мележ — «Люди на болоте» и «Минское направление»."
    },
    {
        "text": "Кто является автором романа «Чёрный замок Ольшанский» и повести «Дикая охота короля Стаха»?",
        "opt_a": "Василий Быков",
        "opt_b": "Иван Мележ",
        "opt_c": "Владимир Короткевич",
        "opt_d": "Михаил Савицкий",
        "correct": "c",
        "explanation": "Владимир Короткевич написал романы «Колосья под серпом твоим», «Чёрный замок Ольшанский» и повесть «Дикая охота короля Стаха». Василий Быков известен произведениями «Журавлиный крик», «Альпийская баллада», «Знак беды»."
    },
    {
        "text": "Кто был руководителем легендарного ВИА «Песняры»?",
        "opt_a": "Иван Шамякин",
        "opt_b": "Виктор Туров",
        "opt_c": "Михаил Савицкий",
        "opt_d": "Владимир Мулявин",
        "correct": "d",
        "explanation": "Владимир Мулявин был руководителем вокально-инструментального ансамбля «Песняры». Виктор Туров — известный режиссёр, снявший фильмы «Через кладбище», «Я родом из детства». Михаил Савицкий — художник, автор картин «Цифры на сердце», «Узник 32815», «Партизанская мадонна»."
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
    csv_filename = 'borba_s_krestonoskami_kultura_bssr.csv'
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
