"""
Idempotent seed script: creates quiz "Отечественная война 1812 г. Социально-экономическое развитие БССР" (7 questions).

Based on Билет №7, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 7. Отечественная война 1812 г. Социально-экономическое развитие БССР"

QUESTIONS_DATA = [
    {
        "text": "В каком месяце 1812 г. 600-тысячная армия Наполеона вторглась в пределы Российской империи?",
        "opt_a": "Июнь 1812 г.",
        "opt_b": "Июль 1812 г.",
        "opt_c": "Август 1812 г.",
        "opt_d": "Сентябрь 1812 г.",
        "correct": "a",
        "explanation": "Вторжение 600-тысячной армии Наполеона произошло в июне 1812 г. Это стало началом Отечественной войны 1812 года."
    },
    {
        "text": "Кто разработал план восстановления Великого Княжества Литовского под протекторатом Франции в 1812 г.?",
        "opt_a": "Наполеон Бонапарт",
        "opt_b": "Михаил Клеофас Огинский",
        "opt_c": "Барклай де Толли",
        "opt_d": "Николай Раевский",
        "correct": "b",
        "explanation": "Михаил Клеофас Огинский разработал план восстановления ВКЛ под протекторатом Франции. Наполеоном было создано Временное правительство ВКЛ."
    },
    {
        "text": "Какая тактика применялась русскими войсками при отступлении Барклая де Толли и Багратиона в 1812 г.?",
        "opt_a": "Позиционная война",
        "opt_b": "Тактика «выжженной земли»",
        "opt_c": "Генеральное сражение",
        "opt_d": "Оборона крепостей",
        "correct": "b",
        "explanation": "Русские армии под командованием Барклая де Толли и Багратиона отступали, применяя тактику «выжженной земли» — уничтожение всего, что могло бы пригодиться противнику."
    },
    {
        "text": "Какая крепость на территории Беларуси выдержала 4-месячную осаду французских войск в 1812 г.?",
        "opt_a": "Брестская крепость",
        "opt_b": "Полоцкая крепость",
        "opt_c": "Бобруйская крепость",
        "opt_d": "Гродненская крепость",
        "correct": "c",
        "explanation": "Бобруйская крепость выдержала 4-месячную осаду французских войск в 1812 году, так и не покорившись захватчикам."
    },
    {
        "text": "Сколько солдат из 600-тысячной армии Наполеона вернулось из похода в Россию?",
        "opt_a": "Около 300 тысяч",
        "opt_b": "Около 60 тысяч",
        "opt_c": "Около 150 тысяч",
        "opt_d": "Около 10 тысяч",
        "correct": "b",
        "explanation": "Из 600-тысячной армии Наполеона обратно вернулось лишь около 60 тысяч человек, что свидетельствует о катастрофических потерях французов в ходе войны."
    },
    {
        "text": "В каком году был принят Закон «О собственности» в БССР?",
        "opt_a": "1985 г.",
        "opt_b": "1988 г.",
        "opt_c": "1986 г.",
        "opt_d": "1990 г.",
        "correct": "d",
        "explanation": "Закон «О собственности» в БССР был принят в 1990 году. Это был важный шаг в переходе к рыночной экономике."
    },
    {
        "text": "Какая крупная техника производилась на БелАЗе в Жодино в советский период?",
        "opt_a": "Карьерные самосвалы",
        "opt_b": "Тракторы",
        "opt_c": "Холодильники",
        "opt_d": "ЭВМ",
        "correct": "a",
        "explanation": "БелАЗ в Жодино специализировался на производстве карьерных самосвалов. МАЗ и МТЗ работали в Минске, холодильники «Атлант» выпускались в Минске, а ЭВМ «Минск-1» — на минском заводе ЭВМ."
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
    csv_filename = 'otechestvennaya_voyna_1812_soc_ekon_bssr.csv'
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
