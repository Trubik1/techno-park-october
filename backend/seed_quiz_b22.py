"""
Idempotent seed script: creates quiz "БССР 1940-1980-е: образование, наука, культура. Хозяйство XIX - нач. XX в." (7 questions).

Based on Билет №22, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 22. БССР 1940-1980-е: образование, наука, культура. Хозяйство XIX - нач. XX в."

QUESTIONS_DATA = [
    {
        "text": "Что произошло в Академии наук БССР в послевоенный период?",
        "opt_a": "Она была закрыта из-за нехватки финансирования",
        "opt_b": "Она была объединена с АН СССР",
        "opt_c": "Были созданы новые научные институты и сформировались научные школы в математике (Громыко), физике (Степанов), биологии (Жебрак)",
        "opt_d": "Она была перенесена в Могилёв",
        "correct": "c",
        "explanation": "В послевоенный период в Академии наук БССР активно развивались научные школы: математическая школа И. С. Громыко, физическая школа Б. И. Степанова, биологическая школа А. Р. Жебрака."
    },
    {
        "text": "Какие белорусские писатели получили известность во второй половине XX в.?",
        "opt_a": "Якуб Колас, Янка Купала",
        "opt_b": "Василь Быков, Иван Мележ, Иван Шамякин",
        "opt_c": "Максим Богданович, Адам Мицкевич",
        "opt_d": "Франциск Скорина, Сымон Будный",
        "correct": "b",
        "explanation": "Во второй половине XX в. широкую известность получили писатели-фронтовик Василь Быков, а также Иван Мележ и Иван Шамякин. Якуб Колас и Янка Купала — классики более раннего периода."
    },
    {
        "text": "Какие достижения характерны для театра, кино и музыки БССР в 1940–1980-е гг.?",
        "opt_a": "Создание киностудии «Беларусьфильм» и деятельность ансамбля «Песняры» под руководством Владимира Мулявина",
        "opt_b": "Запрет на белорусскоязычные спектакли",
        "opt_c": "Отказ от развития кинематографа",
        "opt_d": "Закрытие всех театров",
        "correct": "a",
        "explanation": "В этот период активно работала киностудия «Беларусьфильм», а также большую популярность приобрёл ансамбль «Песняры» под руководством Владимира Мулявина, получивший всесоюзное признание."
    },
    {
        "text": "Назовите известных белорусских художников второй половины XX в.",
        "opt_a": "Илья Репин, Иван Айвазовский",
        "opt_b": "Михаил Савицкий, Гавриил Ващенко",
        "opt_c": "Василий Васнецов, Иван Шишкин",
        "opt_d": "Андрей Рублёв, Дионисий",
        "correct": "b",
        "explanation": "В изобразительном искусстве БССР второй половины XX в. значительный вклад внесли Михаил Савицкий (автор цикла «Цифры на сердце») и Гавриил Ващенко (мастер пейзажа и портрета)."
    },
    {
        "text": "Какое событие в истории железнодорожного строительства произошло на территории Беларуси в 1862 г.?",
        "opt_a": "Построена Московско-Брестская железная дорога",
        "opt_b": "Построена Санкт-Петербург-Варшавская железная дорога",
        "opt_c": "Построена первая узкоколейная дорога",
        "opt_d": "Началось строительство Транссибирской магистрали",
        "correct": "b",
        "explanation": "Санкт-Петербург-Варшавская железная дорога прошла через территорию Беларуси в 1862 г., соединив западные губернии с двумя столицами Российской империи."
    },
    {
        "text": "В чём заключалась суть Столыпинской аграрной реформы 1906–1911 гг.?",
        "opt_a": "Передача всей земли крестьянам бесплатно",
        "opt_b": "Разрушение общины, создание хуторов и отрубов, переселение крестьян на свободные земли",
        "opt_c": "Национализация помещичьих земель",
        "opt_d": "Ликвидация частной собственности на землю",
        "correct": "b",
        "explanation": "Реформа П. А. Столыпина предусматривала выход крестьян из общины и создание хуторов (перенос усадьбы) и отрубов (компактный участок без переноса усадьбы), а также переселение малоземельных крестьян в Сибирь и другие регионы."
    },
    {
        "text": "Какие явления характеризовали развитие хозяйства белорусских земель в XIX — начале XX в.?",
        "opt_a": "Господство помещичьего землевладения при крестьянском малоземелье, развитие суконных мануфактур и винокуренных заводов, начало промышленного переворота и формирование буржуазии с пролетариатом",
        "opt_b": "Отсутствие промышленности и полное господство натурального хозяйства",
        "opt_c": "Равное распределение земли между помещиками и крестьянами",
        "opt_d": "Полное уничтожение помещичьего землевладения",
        "correct": "a",
        "explanation": "В XIX — начале XX в. в белорусских землях сохранялось помещичье землевладение и крестьянское малоземелье. Развивались суконные мануфактуры и винокуренные заводы, начался промышленный переворот, шло формирование буржуазии и пролетариата."
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
    csv_filename = 'bssr_1940_1980_khozyaystvo_xix.csv'
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
