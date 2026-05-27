"""
Idempotent seed script: creates quiz "Образование ВКЛ. Наука, образование, культура и спорт в РБ" (7 questions).

Based on Билет №4, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 4. Образование ВКЛ. Наука, образование, культура и спорт в РБ"

QUESTIONS_DATA = [
    {
        "text": "Какие из перечисленных причин способствовали образованию Великого Княжества Литовского?",
        "opt_a": "Угроза крестоносцев, монгольское нашествие, экономические причины",
        "opt_b": "Только монгольское нашествие",
        "opt_c": "Желание создать единое славянское государство",
        "opt_d": "Нападение шведов и поляков",
        "correct": "a",
        "explanation": "Образованию ВКЛ способствовали угроза со стороны крестоносцев, монгольское нашествие на восточнославянские земли, а также экономические причины — потребность в объединении для защиты торговых путей."
    },
    {
        "text": "Какие племена составили основу белорусской народности?",
        "opt_a": "Поляне, северяне, древляне",
        "opt_b": "Дреговичи, кривичи, радимичи",
        "opt_c": "Вятичи, словене, уличи",
        "opt_d": "Бужане, волыняне, тиверцы",
        "correct": "b",
        "explanation": "Дреговичи, кривичи и радимичи являются восточнославянскими племенами, которые составили основу формирования белорусской народности."
    },
    {
        "text": "Какой город стал центром образования ВКЛ и кто был первым князем?",
        "opt_a": "Вильна, князь Гедимин",
        "opt_b": "Новогрудок, князь Миндовг",
        "opt_c": "Полоцк, князь Всеслав",
        "opt_d": "Троки, князь Ольгерд",
        "correct": "b",
        "explanation": "Центром образования ВКЛ стал Новогрудок. Первым великим князем был Миндовг, коронованный в 1253 году."
    },
    {
        "text": "Какие концепции образования ВКЛ существуют в исторической науке?",
        "opt_a": "Только «Литовского завоевания»",
        "opt_b": "«Литовского завоевания», «Белорусской державы», «Полиэтнического государства»",
        "opt_c": "«Польского влияния» и «Русского протектората»",
        "opt_d": "«Шведской интервенции» и «Немецкой колонизации»",
        "correct": "b",
        "explanation": "Историки выделяют три основные концепции: «Литовского завоевания» (захват литовцами белорусских земель), «Белорусской державы» (ВКЛ как белорусское государство) и «Полиэтнического государства» (равноправный союз литовцев и белорусов)."
    },
    {
        "text": "Какими путями земли входили в состав ВКЛ?",
        "opt_a": "Только путём завоевания",
        "opt_b": "Только через династические браки",
        "opt_c": "Договоры (Полоцк), династические браки (Витебск), завоевания (Гедимин, Ольгерд)",
        "opt_d": "Через церковную унию",
        "correct": "c",
        "explanation": "Земли входили в состав ВКЛ разными путями: Полоцк присоединился по договору, Витебск — через династический брак, а Гедимин и Ольгерд проводили завоевательные походы."
    },
    {
        "text": "Какие достижения характеризуют развитие науки в Республике Беларусь?",
        "opt_a": "Отсутствие собственной академии наук",
        "opt_b": "Запуск спутника в 2012 году, создание белорусского электромобиля, полёт Олега Новицкого",
        "opt_c": "Строительство ядерного реактора мощностью 5 ГВт",
        "opt_d": "Первое место в мире по количеству научных открытий",
        "correct": "b",
        "explanation": "В РБ действует Академия Наук, создан белорусский электромобиль, в 2012 году запущен спутник, а уроженец Беларуси Олег Новицкий совершил космический полёт."
    },
    {
        "text": "Какие деятели культуры и спорта прославили Республику Беларусь?",
        "opt_a": "Михаил Савицкий («Черная быль»), Дарья Домрачева (3-кратная олимпийская чемпионка), Виктория Азаренко",
        "opt_b": "Лев Толстой, Мария Шарапова, Александр Пушкин",
        "opt_c": "Илья Репин, Лариса Латынина, Пётр Чайковский",
        "opt_d": "Фёдор Достоевский, Евгений Плющенко, Иван Айвазовский",
        "correct": "a",
        "explanation": "Михаил Савицкий — известный белорусский художник (картины «Черная быль», «Чернобыльская мадонна»). Дарья Домрачева — трёхкратная олимпийская чемпионка по биатлону. Виктория Азаренко — известная белорусская теннисистка. Первые ОИ для Беларуси — 1996 год (Атланта)."
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
    csv_filename = 'obrazovanie_vkl_nauka_kultura_sport.csv'
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
