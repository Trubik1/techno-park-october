"""
Idempotent seed script: creates quiz "Христианизация белорусских земель. Внешняя политика Республики Беларусь" (7 questions).

Based on Билет №3, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 3. Христианизация белорусских земель. Внешняя политика Республики Беларусь"

QUESTIONS_DATA = [
    {
        "text": "В каком году князь Владимир принял христианство?",
        "opt_a": "988 г.",
        "opt_b": "992 г.",
        "opt_c": "980 г.",
        "opt_d": "862 г.",
        "correct": "a",
        "explanation": "В 988 г. киевский князь Владимир Святославич принял христианство, после чего началась христианизация восточнославянских земель, в том числе и белорусских."
    },
    {
        "text": "В каком году в Полоцке была основана первая епархия на белорусских землях?",
        "opt_a": "988 г.",
        "opt_b": "992 г.",
        "opt_c": "1003 г.",
        "opt_d": "1067 г.",
        "correct": "b",
        "explanation": "В 992 г. в Полоцке была основана первая епархия на белорусских землях, что стало важным этапом распространения христианства в регионе."
    },
    {
        "text": "Какая просветительница XII в. (в миру Предслава) основала женский и мужской монастыри, открыла школу и заказала напрестольный крест?",
        "opt_a": "Кирилл Туровский",
        "opt_b": "Ефросинья Полоцкая",
        "opt_c": "Рогнеда",
        "opt_d": "Анна Киевская",
        "correct": "b",
        "explanation": "Преподобная Ефросинья Полоцкая (в миру Предслава) основала женский и мужской монастыри, открыла школу и заказала знаменитый крест для Спасской церкви."
    },
    {
        "text": "Кого из белорусских просветителей XII в. современники называли «Златоустом»?",
        "opt_a": "Кирилла Туровского",
        "opt_b": "Ефросинью Полоцкую",
        "opt_c": "Климента Смолятича",
        "opt_d": "Всеслава Чародея",
        "correct": "a",
        "explanation": "Кирилла Туровского называли «Златоустом» за его высокое проповедническое и литературное мастерство."
    },
    {
        "text": "Какая древняя церковь XII в., сложенная из плинфы и валунов, находится в Гродно?",
        "opt_a": "Спасская церковь",
        "opt_b": "Софийский собор",
        "opt_c": "Коложская (Борисо-Глебская) церковь",
        "opt_d": "Каменецкая башня",
        "correct": "c",
        "explanation": "Коложская (Борисо-Глебская) церковь в Гродно — уникальный памятник древнего зодчества XII в., сложенный из плинфы (тонкого кирпича) и валунов."
    },
    {
        "text": "Какое интеграционное объединение было создано Беларусью и Россией в декабре 1999 г.?",
        "opt_a": "Содружество Независимых Государств (СНГ)",
        "opt_b": "Союзное государство",
        "opt_c": "Евразийский экономический союз (ЕАЭС)",
        "opt_d": "Организация Договора о коллективной безопасности (ОДКБ)",
        "correct": "b",
        "explanation": "В декабре 1999 г. был подписан Договор о создании Союзного государства Беларуси и России, который предусматривал углублённую политическую и экономическую интеграцию."
    },
    {
        "text": "В каком году вступил в силу Евразийский экономический союз (ЕАЭС)?",
        "opt_a": "1999 г.",
        "opt_b": "2010 г.",
        "opt_c": "2015 г.",
        "opt_d": "2018 г.",
        "correct": "c",
        "explanation": "Евразийский экономический союз (ЕАЭС) вступил в силу 1 января 2015 г. В его состав вошли Беларусь, Россия, Казахстан, Армения и Кыргызстан."
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
    csv_filename = 'hristianizacia_vneshnyaya_politika.csv'
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
