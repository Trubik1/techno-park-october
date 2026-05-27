"""
Idempotent seed script: creates quiz "Формирование белорусской народности. Вклад в победу над нацизмом" (7 questions).

Based on Билет №9, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 9. Формирование белорусской народности. Вклад в победу над нацизмом"

QUESTIONS_DATA = [
    {
        "text": "Что такое «народность»?",
        "opt_a": "Группа людей, объединённых общим языком, территорией и культурой",
        "opt_b": "Группа людей, проживающих в одном городе",
        "opt_c": "Военный союз племён",
        "opt_d": "Люди, говорящие на одном диалекте",
        "correct": "a",
        "explanation": "Народность — это исторически сложившаяся общность людей, имеющих общий язык, территорию и культуру."
    },
    {
        "text": "В какой период и в границах какого государства происходило формирование белорусской народности?",
        "opt_a": "IX–X вв. в границах Киевской Руси",
        "opt_b": "XIII–XVI вв. в границах Великого Княжества Литовского",
        "opt_c": "XVII–XVIII вв. в границах Речи Посполитой",
        "opt_d": "XIV–XV вв. в границах Московского княжества",
        "correct": "b",
        "explanation": "Формирование белорусской народности происходило в XIII–XVI вв. в границах Великого Княжества Литовского."
    },
    {
        "text": "Какие племена составили этническую основу белорусской народности?",
        "opt_a": "Поляне, северяне, древляне",
        "opt_b": "Дреговичи, кривичи, радимичи, а также балтские племена",
        "opt_c": "Вятичи, словене, полочане",
        "opt_d": "Уличи, тиверцы, волыняне",
        "correct": "b",
        "explanation": "Этническую основу белорусской народности составили восточнославянские племена дреговичей, кривичей, радимичей, а также балтские племена."
    },
    {
        "text": "Какая особенность характерна для старобелорусского языка — языка делопроизводства ВКЛ?",
        "opt_a": "Носовые гласные и падение редуцированных",
        "opt_b": "Дзеканье, цеканье, аканье",
        "opt_c": "Твёрдое произношение согласных перед «е»",
        "opt_d": "Отсутствие шипящих звуков",
        "correct": "b",
        "explanation": "Старобелорусский язык, на котором велось делопроизводство в ВКЛ, характеризовался такими особенностями, как дзеканье, цеканье и аканье."
    },
    {
        "text": "Какие версии происхождения названия «Белая Русь» существуют?",
        "opt_a": "От названия реки, от имени князя, от цвета знамени",
        "opt_b": "По сторонам света, по белой одежде, по православной вере, по свободе от захватчиков",
        "opt_c": "От цвета волос жителей, от названия леса, от имени богини",
        "opt_d": "По снежному покрову, по берёзовым рощам, по белым камням",
        "correct": "b",
        "explanation": "Существует 4 основные версии происхождения названия «Белая Русь»: по сторонам света, по белой одежде, по православной вере и по свободе от захватчиков."
    },
    {
        "text": "Каков вклад белорусского народа в победу над нацизмом?",
        "opt_a": "Около 200 тыс. белорусов участвовало в войне",
        "opt_b": "Около 3 млн белорусов погибло, более 1,3 млн воевало на фронтах, 374 тыс. было партизанами, 408 уроженцев Беларуси стали Героями Советского Союза",
        "opt_c": "Беларусь не участвовала в Великой Отечественной войне",
        "opt_d": "Около 500 тыс. погибших, 100 тыс. партизан",
        "correct": "b",
        "explanation": "Вклад белорусского народа в Победу огромен: около 3 млн погибших, более 1,3 млн на фронтах, 374 тыс. партизан и 70 тыс. подпольщиков, 408 уроженцев Беларуси — Герои Советского Союза."
    },
    {
        "text": "Кто из этих уроженцев Беларуси, повторив подвиг Александра Матросова, закрыл собой амбразуру вражеского дзота?",
        "opt_a": "Лев Доватор",
        "opt_b": "Борис Ковзан",
        "opt_c": "Пётр Куприянов",
        "opt_d": "Алексей Антоненко",
        "correct": "c",
        "explanation": "Пётр Куприянов повторил подвиг Александра Матросова, закрыв собой амбразуру вражеского дзота."
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
    csv_filename = 'formirovanie_belorusskoi_narodnosti_vklad_v_pobedu.csv'
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
