"""
Idempotent seed script: creates quiz "Геноцид населения Беларуси в ВОВ. Культура XIV-XVIII вв." (7 questions).

Based on Билет №20, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 20. Геноцид населения Беларуси в ВОВ. Культура XIV-XVIII вв."

QUESTIONS_DATA = [
    {
        "text": "Какие цели преследовал план «Ост» в отношении белорусского населения?",
        "opt_a": "Переселение белорусов в Сибирь",
        "opt_b": "Уничтожение 75% белорусов и превращение оставшихся в рабов",
        "opt_c": "Ассимиляция белорусов с немецким населением",
        "opt_d": "Создание независимого белорусского государства под протекторатом Германии",
        "correct": "b",
        "explanation": "План «Ост» предусматривал уничтожение 75% белорусского народа, а оставшиеся 25% должны были быть онемечены и использованы в качестве рабов."
    },
    {
        "text": "Что такое «Новый порядок», установленный нацистами на оккупированной территории Беларуси?",
        "opt_a": "Восстановление советской власти под контролем Германии",
        "opt_b": "Предоставление Беларуси независимости в границах 1939 г.",
        "opt_c": "Ликвидация советского строя, установление жёсткого военно-полицейского режима",
        "opt_d": "Создание белорусского коллаборационистского правительства",
        "correct": "c",
        "explanation": "«Новый порядок» означал полную ликвидацию советского строя и установление жестокого военно-полицейского режима с системой массового террора."
    },
    {
        "text": "Сколько лагерей смерти было создано нацистами на территории Беларуси, и какое место среди них занимает Тростенец?",
        "opt_a": "Около 100 лагерей; Тростенец — 10-й по величине",
        "opt_b": "Более 260 лагерей; Тростенец — 4-й по величине в Европе (206 500 жертв)",
        "opt_c": "Около 50 лагерей; Тростенец — крупнейший в Европе",
        "opt_d": "Более 500 лагерей; Тростенец — 2-й по величине",
        "correct": "b",
        "explanation": "На территории Беларуси было создано более 260 лагерей смерти. Тростенец — 4-й по величине лагерь смерти в Европе после Освенцима, Майданека и Треблинки, где погибло 206 500 человек."
    },
    {
        "text": "Когда произошла трагедия в Хатыни и сколько человек погибло?",
        "opt_a": "22 марта 1943 г.; 149 человек, из них 75 детей",
        "opt_b": "22 июня 1941 г.; 200 человек",
        "opt_c": "3 марта 1944 г.; 100 человек",
        "opt_d": "9 мая 1945 г.; 50 человек",
        "correct": "a",
        "explanation": "Хатынь была сожжена 22 марта 1943 г. карателями 118-го полицейского батальона. Погибло 149 человек, из которых 75 — дети. Всего на территории Беларуси сожжено с жителями 628 деревень."
    },
    {
        "text": "Сколько гетто существовало на территории Беларуси, и сколько евреев погибло в Минском гетто?",
        "opt_a": "Около 50 гетто; 50 тыс. евреев",
        "opt_b": "Более 110 гетто; около 100 тыс. евреев",
        "opt_c": "Более 200 гетто; 200 тыс. евреев",
        "opt_d": "Около 30 гетто; 30 тыс. евреев",
        "correct": "b",
        "explanation": "На территории Беларуси было создано более 110 гетто. В Минском гетто погибло около 100 тыс. евреев. Всего жертвами Холокоста в Беларуси стало более 600 тыс. евреев."
    },
    {
        "text": "Какие архитектурные стили получили распространение на белорусских землях в XIV–XVIII вв.?",
        "opt_a": "Только готика",
        "opt_b": "Готика, ренессанс и барокко",
        "opt_c": "Только барокко и классицизм",
        "opt_d": "Только романский стиль",
        "correct": "b",
        "explanation": "В XIV–XVIII вв. на белорусских землях последовательно развивались готика (церковь-крепость в Сынковичах), ренессанс (Мирский замок) и барокко (костёл Тела Господня в Несвиже — первая барочная базилика на территории Речи Посполитой, арх. Ф. Форти)."
    },
    {
        "text": "Кто из перечисленных деятелей был меценатом и покровителем культуры в ВКЛ?",
        "opt_a": "Франциск Скорина",
        "opt_b": "Сымон Будный",
        "opt_c": "Василий Тяпинский",
        "opt_d": "Радзивиллы (Николай Чёрный, Николай Рыжий)",
        "correct": "d",
        "explanation": "Радзивиллы были крупнейшими меценатами и покровителями культуры в ВКЛ. Скорина, Будный и Тяпинский были просветителями и книгопечатниками, но меценатами (покровителями, финансировавшими культуру) являлись именно Радзивиллы."
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
    csv_filename = 'genocid_belarusi_vov_kultura_xiv_xviii.csv'
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
