"""
Idempotent seed script: creates quiz "Польско-советская война 1919-1921. НЭП в БССР" (7 questions).

Based on Билет №15, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 15. Польско-советская война 1919-1921. НЭП в БССР"

QUESTIONS_DATA = [
    {
        "text": "Когда началась советско-польская война 1919-1921 гг.?",
        "opt_a": "декабрь 1918 г.",
        "opt_b": "февраль 1919 г.",
        "opt_c": "апрель 1920 г.",
        "opt_d": "март 1921 г.",
        "correct": "b",
        "explanation": "Советско-польская война началась в феврале 1919 г. Польша стремилась восстановить границы 1772 г. (Речь Посполитая). Буферное государство ЛитБел стало ареной боевых действий."
    },
    {
        "text": "Какое буферное советское государство стало ареной боевых действий в ходе советско-польской войны?",
        "opt_a": "ССРБ",
        "opt_b": "ЛитБел",
        "opt_c": "Рудобельская республика",
        "opt_d": "БНР",
        "correct": "b",
        "explanation": "ЛитБел (Литовско-Белорусская ССР) было создано как буферное государство. К лету 1919 г. польские войска заняли Вильно, Брест и Минск. Фронт стабилизировался на реке Березина."
    },
    {
        "text": "Как называлась территория в Бобруйском районе, сохранявшая советскую власть в 1919-1920 гг.?",
        "opt_a": "ЛитБел",
        "opt_b": "Рудобельская республика",
        "opt_c": "ССРБ",
        "opt_d": "Белорусская рада",
        "correct": "b",
        "explanation": "Рудобельская республика (Бобруйский район) сохраняла советскую власть. Её возглавил В.И. Талаш (дед Талаш) — в возрасте 74 лет он командовал партизанским отрядом около 300 человек."
    },
    {
        "text": "Кто в возрасте 74 лет возглавил партизанский отряд (около 300 человек) в Рудобельской республике?",
        "opt_a": "Д.Ф. Прищепов",
        "opt_b": "В.И. Талаш (дед Талаш)",
        "opt_c": "М.В. Тухачевский",
        "opt_d": "К.П. Орловский",
        "correct": "b",
        "explanation": "Василий Исаакович Талаш, известный как «дед Талаш», в возрасте 74 лет возглавил партизанский отряд численностью около 300 человек в Рудобельской республике."
    },
    {
        "text": "Когда и где произошло второе провозглашение ССРБ?",
        "opt_a": "1 января 1919 г. в Смоленске",
        "opt_b": "25 марта 1918 г. в Минске",
        "opt_c": "31 июля 1920 г. в Минске",
        "opt_d": "18 марта 1921 г. в Риге",
        "correct": "c",
        "explanation": "31 июля 1920 г. в Минске было вторично провозглашена ССРБ. Этому предшествовало весеннее контрнаступление Красной Армии под командованием Тухачевского. Однако после «Чуда на Висле» Красная Армия потерпела поражение под Варшавой."
    },
    {
        "text": "Какой мирный договор завершил советско-польскую войну, и когда он был подписан?",
        "opt_a": "Брестский мир, 3 марта 1918 г.",
        "opt_b": "Рижский мир, 18 марта 1921 г.",
        "opt_c": "Московский договор, 1920 г.",
        "opt_d": "Версальский договор, 1919 г.",
        "correct": "b",
        "explanation": "18 марта 1921 г. был подписан Рижский мир. Западная Беларусь (113 тыс. км², 4 млн человек) отошла к Польше."
    },
    {
        "text": "Какая реформа заменила продразвёрстку в рамках НЭПа?",
        "opt_a": "введение советского червонца",
        "opt_b": "продналог",
        "opt_c": "план ГОЭЛРО",
        "opt_d": "трудовая повинность",
        "correct": "b",
        "explanation": "В рамках НЭПа продразвёрстка была заменена продналогом. Также была проведена денежная реформа — введён советский червонец. Д.Ф. Прищепов стал наркомом земледелия БССР, развивал хутора и кооперацию. План ГОЭЛРО предусматривал строительство электростанций, в т.ч. в Беларуси. К 1927 г. был достигнут довоенный уровень сельского хозяйства."
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
    csv_filename = 'polsko_sovetskaya_voina_nep.csv'
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
