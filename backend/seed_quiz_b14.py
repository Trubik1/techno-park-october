"""
Idempotent seed script: creates quiz "Создание ССРБ. Германский оккупационный режим 1941-1944" (7 questions).

Based on Билет №14, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 14. Создание ССРБ. Германский оккупационный режим 1941-1944"

QUESTIONS_DATA = [
    {
        "text": "Когда проходил Всебелорусский съезд, и кто возглавлял Белнацком?",
        "opt_a": "5-18 декабря 1917 г., Белнацком во главе с А.Г. Червяковым",
        "opt_b": "1-15 января 1918 г., Белнацком во главе с Д.Ф. Жилуновичем",
        "opt_c": "10-20 ноября 1917 г., Белнацком во главе с В.М. Игнатовским",
        "opt_d": "25-30 декабря 1917 г., Белнацком во главе с А.Ф. Мясниковым",
        "correct": "a",
        "explanation": "Всебелорусский съезд проходил 5-18 декабря 1917 г. в Минске. Белнацком (Белорусский национальный комиссариат) возглавлял А.Г. Червяков."
    },
    {
        "text": "Когда состоялся I съезд КП(б)Б и когда была провозглашена ССРБ?",
        "opt_a": "I съезд КП(б)Б — 30 декабря 1918 г. в Смоленске, ССРБ провозглашена 1 января 1919 г.",
        "opt_b": "I съезд КП(б)Б — 25 декабря 1918 г. в Минске, ССРБ провозглашена 3 января 1919 г.",
        "opt_c": "I съезд КП(б)Б — 30 декабря 1918 г. в Витебске, ССРБ провозглашена 1 февраля 1919 г.",
        "opt_d": "I съезд КП(б)Б — 1 января 1919 г. в Смоленске, ССРБ провозглашена 30 декабря 1918 г.",
        "correct": "a",
        "explanation": "I съезд Коммунистической партии (большевиков) Беларуси прошёл 30 декабря 1918 г. в Смоленске. Манифест о провозглашении ССРБ был принят 1 января 1919 г."
    },
    {
        "text": "Какие территории были переданы РСФСР 16 января 1919 г., и какое буферное государство было создано?",
        "opt_a": "Могилёвская и Минская губернии переданы РСФСР, создано ЛитБел",
        "opt_b": "Витебская, Могилёвская и Смоленская губернии переданы РСФСР, создано ЛитБел",
        "opt_c": "Гродненская и Брестская губернии переданы РСФСР, создана Литовская Республика",
        "opt_d": "Минская и Гродненская губернии переданы РСФСР, создана Белорусско-Литовская ССР",
        "correct": "b",
        "explanation": "16 января 1919 г. часть земель ССРБ (Витебская, Могилёвская, Смоленская губернии) была передана РСФСР. В феврале 1919 г. создано буферное государство — ЛитБел (Литовско-Белорусская ССР)."
    },
    {
        "text": "Когда произошло второе провозглашение ССРБ и где?",
        "opt_a": "31 июля 1920 г. в Минске",
        "opt_b": "1 августа 1920 г. в Смоленске",
        "opt_c": "30 июля 1920 г. в Витебске",
        "opt_d": "15 августа 1920 г. в Минске",
        "correct": "a",
        "explanation": "31 июля 1920 г. в Минске была вторично провозглашена ССРБ. Это произошло после освобождения территории Беларуси от польских войск."
    },
    {
        "text": "Что предусматривал план «Ост» в отношении белорусского населения?",
        "opt_a": "Уничтожить 75% белорусов, остальных онемечить",
        "opt_b": "Переселить всех белорусов в Сибирь",
        "opt_c": "Уничтожить 50% белорусов, остальных сделать рабами",
        "opt_d": "Ассимилировать белорусов с немецким населением",
        "correct": "a",
        "explanation": "План «Ост» предусматривал уничтожение 75% белорусского населения, а оставшихся 25% — онемечить (германизировать). На территории Беларуси был установлен «новый порядок»: создавались концлагеря, гетто, проводились облавы."
    },
    {
        "text": "Сколько лагерей смерти и гетто действовало на территории Беларуси, и крупнейший из них?",
        "opt_a": "Более 260 лагерей смерти, Тростенец (206 500 жертв); более 110 гетто, Минское гетто (100 тыс. убитых)",
        "opt_b": "Более 150 лагерей смерти, Малый Тростенец (100 000 жертв); более 80 гетто",
        "opt_c": "Более 300 лагерей смерти, Колдычево (150 000 жертв); более 200 гетто",
        "opt_d": "Более 200 лагерей смерти, Тростенец (300 000 жертв); более 150 гетто",
        "correct": "a",
        "explanation": "На территории Беларуси действовало более 260 лагерей смерти. Крупнейший — Тростенец (206 500 жертв). Создано более 110 гетто, в Минском гетто убито около 100 тыс. человек. Более 800 белорусов признаны Праведниками мира."
    },
    {
        "text": "Какие трагедии произошли в Хатыни (22 марта 1943) и в Оле (14 января 1944)?",
        "opt_a": "Хатынь — 149 чел. (75 детей), Ола — 1758 чел. (950 детей)",
        "opt_b": "Хатынь — 200 чел. (100 детей), Ола — 1000 чел. (500 детей)",
        "opt_c": "Хатынь — 149 чел. (50 детей), Ола — 1500 чел. (800 детей)",
        "opt_d": "Хатынь — 180 чел. (90 детей), Ола — 2000 чел. (1000 детей)",
        "correct": "a",
        "explanation": "22 марта 1943 г. фашисты сожгли Хатынь — погибло 149 человек, из них 75 детей. 14 января 1944 г. сожжена деревня Ола — погибло 1758 человек, из них 950 детей. Всего 628 деревень разделили судьбу Хатыни, 186 из них не восстановлены."
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
    csv_filename = 'sozdanie_ssrb_germanskij_okkupacionnyj_rezhim.csv'
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
