"""
Idempotent seed script: creates quiz "Подвиг народа в ВОВ. Наш край в XIII-XVIII вв." (7 questions).

Based on Билет №19, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 19. Подвиг народа в ВОВ. Наш край в XIII-XVIII вв."

QUESTIONS_DATA = [
    {
        "text": "Какие оборонительные бои лета 1941 г. стали символом мужества советского народа?",
        "opt_a": "Оборона Брестской крепости и оборона Могилёва (23 дня)",
        "opt_b": "Оборона Киева и Одессы",
        "opt_c": "Оборона Смоленска и Вязьмы",
        "opt_d": "Оборона Ленинграда и Севастополя",
        "correct": "a",
        "explanation": "Символами мужества стали оборона Брестской крепости и героическая оборона Могилёва, длившаяся 23 дня. Также героически оборонялись Полоцк, Лепель, Гомель и Орша."
    },
    {
        "text": "Сколько партизан насчитывалось в 1255 отрядах на территории Беларуси в годы ВОВ?",
        "opt_a": "Свыше 100 тыс.",
        "opt_b": "Свыше 374 тыс.",
        "opt_c": "Свыше 500 тыс.",
        "opt_d": "Свыше 200 тыс.",
        "correct": "b",
        "explanation": "В годы Великой Отечественной войны на территории Беларуси действовало свыше 374 тыс. партизан, объединённых в 1255 отрядов, 213 партизанских бригад, и около 70 тыс. подпольщиков."
    },
    {
        "text": "Какое важное событие связано с деятельностью Минского подполья?",
        "opt_a": "Освобождение Минска в 1944 г.",
        "opt_b": "Уничтожение генерального комиссара Беларуси В. Кубе",
        "opt_c": "Создание подпольной типографии",
        "opt_d": "Организация побега военнопленных",
        "correct": "b",
        "explanation": "Минское подполье известно уничтожением генерального комиссара Беларуси Вильгельма Кубе в результате операции, проведённой подпольщицей Еленой Мазаник."
    },
    {
        "text": "Сколько этапов включала «Рельсовая война» — операция по массовому уничтожению железнодорожных коммуникаций врага?",
        "opt_a": "Один этап",
        "opt_b": "Два этапа",
        "opt_c": "Три этапа",
        "opt_d": "Четыре этапа",
        "correct": "c",
        "explanation": "«Рельсовая война» включала три этапа: первый — август–сентябрь 1943 г., второй — «Концерт» (сентябрь–октябрь 1943 г.), третий — лето 1944 г. в ходе операции «Багратион»."
    },
    {
        "text": "Что такое партизанские зоны на территории Беларуси?",
        "opt_a": "Территории, оккупированные немецкими войсками",
        "opt_b": "Освобождённые территории в тылу врага, где восстанавливалась советская власть",
        "opt_c": "Зоны, где проходили крупные сражения",
        "opt_d": "Территории, контролируемые польскими партизанами",
        "correct": "b",
        "explanation": "Партизанские зоны — освобождённые территории в тылу врага, где восстанавливались органы советской власти, работали школы и больницы, велась хозяйственная деятельность."
    },
    {
        "text": "В составе какого государства находился Гомель в XIV в.?",
        "opt_a": "Киевской Руси",
        "opt_b": "Великого Княжества Литовского",
        "opt_c": "Речи Посполитой",
        "opt_d": "Московского государства",
        "correct": "b",
        "explanation": "В XIV в. Гомель являлся центром Гомельского княжества в составе Великого Княжества Литовского. После Люблинской унии 1569 г. вошёл в состав Речи Посполитой."
    },
    {
        "text": "Что произошло с Гомелем в 1772 г.?",
        "opt_a": "Основание Гомеля",
        "opt_b": "Гомель вошёл в состав Российской империи по первому разделу Речи Посполитой и был передан фельдмаршалу П.А. Румянцеву-Задунайскому",
        "opt_c": "Построен дворец Румянцевых-Паскевичей",
        "opt_d": "Гомель получил Магдебургское право",
        "correct": "b",
        "explanation": "В 1772 г. по первому разделу Речи Посполитой Гомель вошёл в состав Российской империи и был передан фельдмаршалу П.А. Румянцеву-Задунайскому. В городе активно развивались торговля и ремесло, началось строительство дворца Румянцевых-Паскевичей."
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
    csv_filename = 'podvig_naroda_v_vov_nash_krai_xiii_xviii.csv'
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
