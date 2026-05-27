"""
Idempotent seed script: creates quiz "Западная Беларусь в составе Польши. Культура Беларуси XIX — начала XX в." (7 questions).

Based on Билет №18, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 18. Западная Беларусь в составе Польши. Культура Беларуси XIX — начала XX в."

QUESTIONS_DATA = [
    {
        "text": "Какое событие закрепило Западную Беларусь в составе Польши?",
        "opt_a": "Брестский мир 1918 г.",
        "opt_b": "Рижский мир 1921 г.",
        "opt_c": "Версальский договор 1919 г.",
        "opt_d": "Парижский мир 1920 г.",
        "correct": "b",
        "explanation": "По Рижскому мирному договору 1921 г. Западная Беларусь отошла к Польше. На её территории проводилась политика полонизации: закрывались белорусские школы, насаждался польский язык, ограничивалось православие и преследовалось униатство."
    },
    {
        "text": "Какая партия действовала в Западной Беларуси в 1925–1927 гг. и выступала за воссоединение с БССР?",
        "opt_a": "Партия социалистов-революционеров",
        "opt_b": "Белорусская крестьянско-рабочая громада (БКРГ)",
        "opt_c": "Польская социалистическая партия",
        "opt_d": "Белорусская народная партия",
        "correct": "b",
        "explanation": "Белорусская крестьянско-рабочая громада (БКРГ) — массовая революционно-демократическая организация, действовавшая в Западной Беларуси в 1925–1927 гг. и выступавшая за воссоединение с БССР. В 1927 г. партия была разгромлена польскими властями."
    },
    {
        "text": "Что такое «тарашкевица»?",
        "opt_a": "Белорусский язык, записанный латиницей",
        "opt_b": "Первый белорусский букварь",
        "opt_c": "Название белорусского театра",
        "opt_d": "Польско-белорусский словарь",
        "correct": "a",
        "explanation": "Тарашкевица — вариант белорусского языка с использованием латинского алфавита. Название происходит от фамилии Бронислава Тарашкевича, который создал первый белорусский букварь. Латиница использовалась наряду с кириллицей для записи белорусского языка."
    },
    {
        "text": "Какие белорусские писатели творили в конце XIX — начале XX в.?",
        "opt_a": "Адам Мицкевич, Элиза Ожешко, Владислав Сырокомля",
        "opt_b": "Янка Купала, Якуб Колас, Максим Богданович",
        "opt_c": "Франциск Скорина, Симеон Полоцкий, Ефросинья Полоцкая",
        "opt_d": "Николай Гоголь, Лев Толстой, Антон Чехов",
        "correct": "b",
        "explanation": "Янка Купала, Якуб Колас и Максим Богданович — классики белорусской литературы, чьё творчество пришлось на конец XIX — начало XX в. В этот период происходило формирование белорусской нации и национальное возрождение."
    },
    {
        "text": "Когда вышли первые номера газеты «Наша Ніва»?",
        "opt_a": "1884 г.",
        "opt_b": "1891 г.",
        "opt_c": "1906 г.",
        "opt_d": "1917 г.",
        "correct": "c",
        "explanation": "Первые номера газеты «Наша Ніва» вышли в 1906 г. Это было первое легальное белорусскоязычное издание, которое сыграло ключевую роль в национальном возрождении Беларуси и объединении белорусских деятелей культуры."
    },
    {
        "text": "Кто создал первый белорусский профессиональный театр?",
        "opt_a": "Владислав Голубок",
        "opt_b": "Игнат Буйницкий",
        "opt_c": "Янка Купала",
        "opt_d": "Франтишек Богушевич",
        "correct": "b",
        "explanation": "Игнат Буйницкий создал первый белорусский профессиональный театр. Его труппа ставила спектакли на белорусском языке, способствуя развитию национальной культуры и сценического искусства."
    },
    {
        "text": "Какое восстание произошло в 1863–1864 гг. на территории Беларуси, и кто был его руководителем?",
        "opt_a": "Восстание Костюшко 1794 г., руководитель Тадеуш Костюшко",
        "opt_b": "Польское восстание 1863–1864 гг., руководитель Кастусь Калиновский",
        "opt_c": "Восстание декабристов 1825 г., руководитель Пестель",
        "opt_d": "Январское восстание 1918 г., руководитель Скирмунт",
        "correct": "b",
        "explanation": "Польское восстание 1863–1864 гг. охватило и территорию Беларуси. Кастусь Калиновский был одним из руководителей восстания, выступал за отмену крепостного права и социальную справедливость. После подавления восстания активизировался процесс национального возрождения Беларуси."
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
    csv_filename = 'zapadnaya_belarus_v_sostave_polshi_kultura.csv'
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
