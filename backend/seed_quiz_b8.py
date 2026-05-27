"""
Idempotent seed script: creates quiz "Люблинская уния. Наш край в годы ВОВ (г. Гомель)" (7 questions).

Based on Билет №8, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 8. Люблинская уния. Наш край в годы ВОВ (г. Гомель)"

QUESTIONS_DATA = [
    {
        "text": "В каком году была заключена Кревская уния между Великим Княжеством Литовским и Польским королевством?",
        "opt_a": "1385 г.",
        "opt_b": "1410 г.",
        "opt_c": "1569 г.",
        "opt_d": "1558 г.",
        "correct": "a",
        "explanation": "Кревская уния была заключена в 1385 г. между великим князем литовским Ягайло и Польшей. Ягайло обязался принять католичество и крестить язычников ВКЛ в обмен на брак с польской королевой Ядвигой."
    },
    {
        "text": "В каком году была подписана Люблинская уния, в результате которой образовалась Речь Посполитая?",
        "opt_a": "1385 г.",
        "opt_b": "1558 г.",
        "opt_c": "1569 г.",
        "opt_d": "1588 г.",
        "correct": "c",
        "explanation": "Люблинская уния была подписана в 1569 году, в результате чего было создано объединённое государство — Речь Посполитая. Ливонская война (1558 г.) между ВКЛ и Московским государством ускорила этот процесс."
    },
    {
        "text": "Кто возглавлял делегацию Великого Княжества Литовского на Люблинском сейме, который длился около 6 месяцев?",
        "opt_a": "Лев Сапега",
        "opt_b": "Николай Радзивилл Рыжий",
        "opt_c": "Ягайло",
        "opt_d": "Сигизмунд II Август",
        "correct": "b",
        "explanation": "Делегацию ВКЛ на Люблинском сейме, продолжавшемся около 6 месяцев, возглавлял Николай Радзивилл Рыжий."
    },
    {
        "text": "Какие сферы оставались отдельными для Великого Княжества Литовского после Люблинской унии?",
        "opt_a": "Только армия и титул",
        "opt_b": "Администрация, законодательство, суд, армия, титул, печать, старобелорусский язык",
        "opt_c": "Только администрация и суд",
        "opt_d": "Все сферы были объединены с Польшей",
        "correct": "b",
        "explanation": "После Люблинской унии ВКЛ сохранило отдельными: администрацию, законодательство, суд, армию, титул великого князя, печать и старобелорусский язык."
    },
    {
        "text": "Кто был разработчиком III Статута ВКЛ 1588 г. и занимал должность канцлера Великого Княжества Литовского?",
        "opt_a": "Николай Радзивилл Рыжий",
        "opt_b": "М. Васильев",
        "opt_c": "Лев Сапега",
        "opt_d": "Ягайло",
        "correct": "c",
        "explanation": "Лев Сапега — канцлер Великого Княжества Литовского и разработчик III Статута ВКЛ 1588 года. Статут провозглашал равенство всех перед законом и запрещал назначать на должности «чужаков»."
    },
    {
        "text": "Когда началась оккупация Гомеля немецко-фашистскими захватчиками и сколько дней она продолжалась?",
        "opt_a": "22 июня 1941 г., 112 дней",
        "opt_b": "14 августа 1941 г., 500 дней",
        "opt_c": "19 августа 1941 г., 838 дней",
        "opt_d": "26 ноября 1941 г., 900 дней",
        "correct": "c",
        "explanation": "22 июня 1941 г. началась Великая Отечественная война. 14 августа 1941 г. была проведена массированная бомбардировка Гомеля, а 19 августа 1941 г. город был оккупирован. Оккупация продолжалась 838 дней — до 26 ноября 1943 г."
    },
    {
        "text": "Сколько процентов жилого фонда Гомеля было разрушено в годы Великой Отечественной войны и сколько жителей осталось в городе? (до войны — 140 тыс.)",
        "opt_a": "50%, осталось около 70 тыс.",
        "opt_b": "80%, осталось менее 15 тыс.",
        "opt_c": "60%, осталось около 30 тыс.",
        "opt_d": "90%, осталось менее 5 тыс.",
        "correct": "b",
        "explanation": "В годы войны было разрушено 80% жилого фонда Гомеля. До войны в городе проживало 140 тысяч человек, после освобождения 26 ноября 1943 г. (Гомельско-Речицкая операция) осталось менее 15 тысяч. М. Васильев водрузил знамя на здании электростанции."
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
    csv_filename = 'lyublinskaya_uniya_gomel_vov.csv'
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
