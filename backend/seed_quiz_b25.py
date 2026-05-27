"""
Idempotent seed script: creates quiz "Соцэкономразвитие РБ. Восточные славяне на территории Беларуси" (7 questions).

Based on Билет №25, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 25. Соцэкономразвитие РБ. Восточные славяне на территории Беларуси"

QUESTIONS_DATA = [
    {
        "text": "Каковы основные приоритеты социально-экономического развития Республики Беларусь?",
        "opt_a": "Социальная направленность экономики, модернизация, инновации",
        "opt_b": "Приватизация всех государственных предприятий",
        "opt_c": "Развитие исключительно сырьевого сектора экономики",
        "opt_d": "Переход к плановой экономике советского образца",
        "correct": "a",
        "explanation": "Основные приоритеты РБ: социальная направленность экономики, модернизация производства и внедрение инноваций. Это обеспечивает рост благосостояния граждан и конкурентоспособность страны."
    },
    {
        "text": "Какие предприятия являются ведущими в промышленности Беларуси?",
        "opt_a": "Только предприятия машиностроения (МАЗ, МТЗ, БелАЗ)",
        "opt_b": "Только предприятия нефтехимии («Нафтан», Мозырский НПЗ)",
        "opt_c": "МАЗ, МТЗ, БелАЗ, «Нафтан», Мозырский НПЗ, «Беларуськалий»",
        "opt_d": "Только «Беларуськалий» в Солигорске",
        "correct": "c",
        "explanation": "Промышленность Беларуси представлена машиностроением (МАЗ, МТЗ, БелАЗ — мировой лидер карьерных самосвалов), нефтехимией («Нафтан» в Новополоцке, Мозырский НПЗ) и калийной промышленностью («Беларуськалий» в Солигорске — один из крупнейших производителей калийных удобрений в мире)."
    },
    {
        "text": "Чем представлены IT-сектор, сельское хозяйство и строительство в Республике Беларусь?",
        "opt_a": "Парк высоких технологий; молочное и мясное животноводство, лён, картофель; жильё и социальные объекты",
        "opt_b": "Только IT-сектор — Парк высоких технологий",
        "opt_c": "Только сельское хозяйство — выращивание зерновых",
        "opt_d": "Только строительство промышленных объектов",
        "correct": "a",
        "explanation": "IT-сектор представлен Парком высоких технологий. Сельское хозяйство специализируется на молочном и мясном животноводстве, выращивании льна и картофеля. Строительство включает возведение жилья и социальных объектов (школы, больницы, детские сады)."
    },
    {
        "text": "Какие племенные союзы восточных славян проживали на территории Беларуси и как они расселялись?",
        "opt_a": "Кривичи (север), дреговичи (юг), радимичи (восток)",
        "opt_b": "Поляне (центр), северяне (восток), древляне (запад)",
        "opt_c": "Вятичи (север), ильменские словене (юг), кривичи (восток)",
        "opt_d": "Дреговичи (север), радимичи (юг), кривичи (запад)",
        "correct": "a",
        "explanation": "На территории Беларуси жили три крупных племенных союза восточных славян: кривичи (на севере), дреговичи (на юге), радимичи (на востоке)."
    },
    {
        "text": "Каковы были основные занятия и система управления у восточных славян на территории Беларуси?",
        "opt_a": "Земледелие, скотоводство, ремёсла; управление: вече, князь, дружина",
        "opt_b": "Только охота и рыболовство; управление отсутствовало",
        "opt_c": "Торговля и мореплавание; управление: совет старейшин",
        "opt_d": "Кочевое скотоводство; управление: хан и орда",
        "correct": "a",
        "explanation": "Основными занятиями восточных славян были земледелие, скотоводство и ремёсла (кузнечное, гончарное, ткацкое). Управление осуществлялось через вече (народное собрание), князя и дружину."
    },
    {
        "text": "Какие племенные княжества существовали на территории Беларуси и кто были их первыми князьями?",
        "opt_a": "Полоцкое княжество (кривичи) — Рогволод; Туровское княжество (дреговичи) — Тур",
        "opt_b": "Киевское княжество — Аскольд; Новгородское — Рюрик",
        "opt_c": "Смоленское княжество — Глеб; Черниговское — Мстислав",
        "opt_d": "Полоцкое княжество — Изяслав; Туровское — Святополк",
        "correct": "a",
        "explanation": "Племенные княжества: Полоцкое (у кривичей) — первым известным князем был Рогволод; Туровское (у дреговичей) — первым князем был Тур."
    },
    {
        "text": "Какие боги входили в пантеон восточных славян и какие обряды у них существовали?",
        "opt_a": "Перун, Велес, Сварог, Даждьбог; обряды: тризны, курганы",
        "opt_b": "Зевс, Афина, Аполлон; обряды: олимпийские игры",
        "opt_c": "Один, Тор, Локи; обряды: погребальные ладьи",
        "opt_d": "Ра, Гор, Осирис; обряды: мумификация",
        "correct": "a",
        "explanation": "Религия восточных славян — язычество. Почитались боги: Перун (бог грома и молнии), Велес (бог скота и богатства), Сварог (бог огня и неба), Даждьбог (бог солнца). Языческие обряды включали тризны (поминки по умершим) и насыпание курганов."
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
    csv_filename = 'soceconomrazvitie_vostochnye_slavyane.csv'
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
