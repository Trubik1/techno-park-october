"""
Idempotent seed script: creates quiz "Октябрьская революция 1917 г. Партизанское движение в годы ВОВ" (7 questions).

Based on Билет №13, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 13. Октябрьская революция 1917 г. Партизанское движение в годы ВОВ"

QUESTIONS_DATA = [
    {
        "text": "Какое событие произошло 27 февраля 1917 г.?",
        "opt_a": "Вооружённое восстание в Петрограде — начало Февральской революции",
        "opt_b": "Отречение Николая II от престола",
        "opt_c": "Создание Минского Совета рабочих депутатов",
        "opt_d": "Октябрьская революция",
        "correct": "a",
        "explanation": "27 февраля 1917 г. в Петрограде началось вооружённое восстание солдат и рабочих, положившее начало Февральской революции. 2 марта 1917 г. Николай II отрёкся от престола."
    },
    {
        "text": "Когда был создан Минский Совет рабочих депутатов и что такое «двоевластие»?",
        "opt_a": "4 марта 1917 г.; сосуществование Временного правительства и Советов",
        "opt_b": "27 февраля 1917 г.; власть императора и Думы",
        "opt_c": "2 марта 1917 г.; власть большевиков и эсеров",
        "opt_d": "7 ноября 1917 г.; власть Советов и профсоюзов",
        "correct": "a",
        "explanation": "4 марта 1917 г. был создан Минский Совет рабочих депутатов. После Февральской революции в стране установилось двоевластие: Временное правительство и Советы рабочих и солдатских депутатов."
    },
    {
        "text": "Когда произошла Октябрьская революция и какие декреты были приняты в первые дни?",
        "opt_a": "7 ноября (25 октября) 1917 г.; «Декрет о мире» и «Декрет о земле»",
        "opt_b": "27 февраля 1917 г.; «Декрет о власти» и «Декрет о земле»",
        "opt_c": "2 марта 1917 г.; «Декрет о мире» и «Декрет о хлебе»",
        "opt_d": "4 марта 1917 г.; «Декрет о земле» и «Декрет о фабриках»",
        "correct": "a",
        "explanation": "Октябрьская революция произошла 7 ноября (25 октября по старому стилю) 1917 г. В результате было свергнуто Временное правительство. II Всероссийский съезд Советов принял «Декрет о мире» и «Декрет о земле»."
    },
    {
        "text": "Когда большевики установили власть в Минске и кто возглавил первые органы советской власти?",
        "opt_a": "2 ноября 1917 г. (ВРК); Облискомзап — А.Ф. Мясников, СНК — К.И. Ландер",
        "opt_b": "7 ноября 1917 г.; Облискомзап — К.И. Ландер, СНК — А.Ф. Мясников",
        "opt_c": "27 февраля 1917 г.; ВРК — П.К. Понамаренко",
        "opt_d": "4 марта 1917 г.; СНК — П.З. Калинин",
        "correct": "a",
        "explanation": "2 ноября 1917 г. Военно-революционный комитет (ВРК) установил советскую власть в Минске. Первыми органами власти стали Облискомзап (А.Ф. Мясников) и СНК Западной области (К.И. Ландер)."
    },
    {
        "text": "Что включала в себя политика «военного коммунизма» (1918–1920 гг.)?",
        "opt_a": "Национализация промышленности, продразверстка, 8-часовой рабочий день",
        "opt_b": "Свободная торговля, аренда земли, концессии",
        "opt_c": "Коллективизация сельского хозяйства",
        "opt_d": "Развитие частного предпринимательства",
        "correct": "a",
        "explanation": "Политика «военного коммунизма» включала национализацию промышленности, продовольственную разверстку (изъятие излишков продовольствия у крестьян), введение 8-часового рабочего дня и всеобщей трудовой повинности."
    },
    {
        "text": "Кто из перечисленных являлся организатором партизанского движения в Беларуси в годы ВОВ?",
        "opt_a": "В.З. Корж (Пинский р-н), Т.П. Бумажков (Октябрьский р-н), М.Ф. Шмырёв (Суражские ворота)",
        "opt_b": "П.К. Понамаренко (Центральный штаб), П.З. Калинин (Белорусский штаб)",
        "opt_c": "П.М. Машеров (командир бригады, Герой СССР)",
        "opt_d": "Все перечисленные",
        "correct": "d",
        "explanation": "В.З. Корж — отряд в Пинском р-не, Т.П. Бумажков — в Октябрьском р-не, М.Ф. Шмырёв (Батька Минай) — Суражские (Витебские) ворота (февраль–сентябрь 1942). 30 мая 1942 — Центральный штаб (П.К. Понамаренко), сентябрь 1942 — Белорусский штаб (П.З. Калинин). П.М. Машеров — Герой СССР."
    },
    {
        "text": "Какие события связаны с деятельностью Минского подполья в годы ВОВ?",
        "opt_a": "Уничтожение генерального комиссара Беларуси В. Кубе (Е. Мазаник, М. Осипова, Н. Троян)",
        "opt_b": "Диверсии К. Заслонова на станции Орша (мины в угле)",
        "opt_c": "Подвиг Марата Казея (подорвал себя гранатой)",
        "opt_d": "Все перечисленные",
        "correct": "d",
        "explanation": "Минское подполье организовало уничтожение В. Кубе. К. Заслонов совершал диверсии на ст. Орша. Марат Казей — юный разведчик, подорвал себя гранатой. Минск — «стреляющий город», город-герой с 1974 г."
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
    csv_filename = 'oktyabrskaya_revolutsiya_1917_partizanskoe_dvizhenie.csv'
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
