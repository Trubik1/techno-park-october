"""
Idempotent seed script: creates quiz "Политика белорусизации. Начало Великой Отечественной войны" (7 questions).

Based on Билет №16, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 16. Политика белорусизации. Начало Великой Отечественной войны"

QUESTIONS_DATA = [
    {
        "text": "В какие годы проводилась политика белорусизации в БССР, и какова была её главная цель?",
        "opt_a": "1910-е гг., цель — индустриализация республики",
        "opt_b": "1920-е гг., цель — развитие белорусской культуры и языка",
        "opt_c": "1930-е гг., цель — коллективизация сельского хозяйства",
        "opt_d": "1940-е гг., цель — восстановление экономики после войны",
        "correct": "b",
        "explanation": "Политика белорусизации проводилась в 1920-е гг. и была направлена на развитие белорусской культуры, языка и национального самосознания."
    },
    {
        "text": "Какие меры включала белорусизация системы образования в БССР?",
        "opt_a": "Открытие только русскоязычных школ и университетов",
        "opt_b": "Перевод школ на белорусский язык обучения и развитие национальной системы образования",
        "opt_c": "Закрытие всех белорусских школ и замена их польскими",
        "opt_d": "Обучение исключительно на латинском языке",
        "correct": "b",
        "explanation": "В рамках белорусизации проводился перевод школ на белорусский язык обучения, что способствовало развитию национальной системы образования."
    },
    {
        "text": "Какая организация была создана в 1922 г. и стала предшественником Академии наук БССР?",
        "opt_a": "Народный комиссариат просвещения",
        "opt_b": "Институт белорусской культуры (Инбелкульт)",
        "opt_c": "Белорусский государственный университет",
        "opt_d": "Центральное бюро краеведения",
        "correct": "b",
        "explanation": "Инбелкульт (Институт белорусской культуры) был создан в 1922 г. и стал предшественником Академии наук БССР, основанной в 1929 г."
    },
    {
        "text": "Какое учреждение было основано в БССР в 1921 году, и какие деятели культуры творили в этот период?",
        "opt_a": "Витебское художественное училище; Марк Шагал, Казимир Малевич",
        "opt_b": "Белорусский государственный университет; Янка Купала, Якуб Колас",
        "opt_c": "Минская консерватория; Михаил Громыко, Евгений Тикоцкий",
        "opt_d": "Академия наук БССР; Янка Купала, Якуб Колас",
        "correct": "b",
        "explanation": "БГУ был основан в 1921 г. В этот период творили Янка Купала (поэма «Магила льва») и Якуб Колас (поэмы «Новая зямля», «Сымон-музыка»). Также среди известных деятелей — математик Михаил Громыко."
    },
    {
        "text": "Когда началась Великая Отечественная война и какой была героическая оборона Брестской крепости?",
        "opt_a": "22 июня 1941 г.; крепость оборонялась в июне-июле 1941 г.",
        "opt_b": "1 сентября 1939 г.; крепость оборонялась в сентябре 1939 г.",
        "opt_c": "22 июня 1941 г.; крепость оборонялась в августе-сентябре 1941 г.",
        "opt_d": "5 июля 1941 г.; крепость оборонялась в июле-августе 1941 г.",
        "correct": "a",
        "explanation": "Великая Отечественная война началась 22 июня 1941 г. Брестская крепость героически оборонялась в июне-июле 1941 г., сковывая значительные силы противника."
    },
    {
        "text": "Сколько дней длилась оборона Могилёва, и какие ещё города Беларуси героически оборонялись летом 1941 г.?",
        "opt_a": "7 дней; Минск, Витебск, Гродно",
        "opt_b": "14 дней; Гомель, Бобруйск, Пинск",
        "opt_c": "23 дня; Гомель (14–19 августа), Полоцк и Лепель",
        "opt_d": "30 дней; Орша, Речица, Лида",
        "correct": "c",
        "explanation": "Оборона Могилёва длилась 23 дня (июль 1941 г.). Гомель оборонялся с 14 по 19 августа 1941 г. Также героически оборонялись Полоцк и Лепель."
    },
    {
        "text": "Когда произошло полное освобождение Беларуси, и каково значение оборонительных боёв 1941 г.?",
        "opt_a": "28 июля 1944 г.; срыв плана «Барбаросса» и оттягивание сил вермахта",
        "opt_b": "9 мая 1945 г.; освобождение всей Европы",
        "opt_c": "3 июля 1944 г.; разгром основных сил вермахта в Беларуси",
        "opt_d": "28 июля 1944 г.; захват стратегической инициативы вермахтом",
        "correct": "a",
        "explanation": "28 июля 1944 г. — дата полного освобождения Беларуси. Значение оборонительных боёв 1941 г.: срыв плана «Барбаросса», оттягивание сил вермахта с главных направлений."
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
    csv_filename = 'belorusizaciya_nachalo_vov.csv'
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
