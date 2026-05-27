"""
Idempotent seed script: creates quiz "Индустриализация и коллективизация в БССР. Становление национальной государственности" (7 questions).

Based on Билет №17, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 17. Индустриализация и коллективизация в БССР. Становление национальной государственности"

QUESTIONS_DATA = [
    {
        "text": "С какого времени началась индустриализация в БССР?",
        "opt_a": "С начала 1920-х гг.",
        "opt_b": "С середины 1920-х гг.",
        "opt_c": "С начала 1930-х гг.",
        "opt_d": "С конца 1910-х гг.",
        "correct": "b",
        "explanation": "Индустриализация в БССР началась с середины 1920-х гг. Курс на индустриализацию был провозглашён на XIV съезде ВКП(б) в 1925 г."
    },
    {
        "text": "В какие годы проходила первая пятилетка в СССР и БССР, в ходе которой началось строительство крупных заводов и фабрик?",
        "opt_a": "1925-1929 гг.",
        "opt_b": "1928-1932 гг.",
        "opt_c": "1933-1937 гг.",
        "opt_d": "1926-1930 гг.",
        "correct": "b",
        "explanation": "Первая пятилетка проходила в 1928-1932 гг. В БССР в этот период началось строительство таких предприятий, как Гомсельмаш, Минский радиозавод и Минская ТЭЦ."
    },
    {
        "text": "Какие крупные предприятия были построены в БССР в годы первых пятилеток?",
        "opt_a": "Гомсельмаш, Минский радиозавод, Минская ТЭЦ",
        "opt_b": "МАЗ, БелАЗ, Минский тракторный завод",
        "opt_c": "Гродненский химический завод, Мозырский НПЗ",
        "opt_d": "Белорусский металлургический завод, Брестский электромеханический завод",
        "correct": "a",
        "explanation": "В годы первых пятилеток в БССР были построены Гомсельмаш (1930), Минский радиозавод и Минская ТЭЦ. МАЗ и БелАЗ были построены позднее."
    },
    {
        "text": "Что стало причиной кризиса хлебозаготовок 1927-1928 гг. и применения чрезвычайных мер, включая насильственное изъятие зерна?",
        "opt_a": "Неурожай из-за засухи",
        "opt_b": "Отказ крестьян сдавать хлеб государству по низким ценам",
        "opt_c": "Наводнение в южных регионах БССР",
        "opt_d": "Экономическая блокада со стороны западных стран",
        "correct": "b",
        "explanation": "Кризис хлебозаготовок 1927-1928 гг. был вызван тем, что крестьяне отказывались сдавать хлеб государству по низким закупочным ценам. В ответ власти применили чрезвычайные меры — насильственное изъятие зерна."
    },
    {
        "text": "Что предусматривала политика коллективизации в БССР, начавшаяся в конце 1920-х гг.?",
        "opt_a": "Передачу земли в частную собственность крестьян",
        "opt_b": "Объединение единоличных крестьянских хозяйств в колхозы и раскулачивание зажиточных крестьян",
        "opt_c": "Создание крупных фермерских хозяйств",
        "opt_d": "Раздел помещичьих земель между крестьянами",
        "correct": "b",
        "explanation": "Коллективизация предусматривала объединение единоличных крестьянских хозяйств в колхозы (коллективные хозяйства). Она сопровождалась раскулачиванием — насильственным изъятием имущества и высылкой зажиточных крестьян."
    },
    {
        "text": "Когда завершилась коллективизация в Западной Беларуси и какой трагический период предшествовал этому в БССР?",
        "opt_a": "1939-1940 гг.; в 1932-1933 гг. в БССР был голод",
        "opt_b": "1944-1945 гг.; в 1941-1942 гг. была оккупация",
        "opt_c": "1930-1931 гг.; в 1933-1934 гг. был массовый голод",
        "opt_d": "1937-1938 гг.; в 1935-1936 гг. были репрессии",
        "correct": "a",
        "explanation": "Коллективизация в Западной Беларуси, вошедшей в состав БССР в 1939 г., проводилась в 1939-1940 гг. В 1932-1933 гг. в БССР, как и в других регионах СССР, разразился голод, вызванный насильственным изъятием хлеба и неурожаем."
    },
    {
        "text": "Какие важные события произошли в процессе становления национальной государственности БССР в 1924, 1926 и 1936 гг.?",
        "opt_a": "1924 г. — первое укрупнение БССР; 1926 г. — второе укрупнение; 1936 г. — принятие новой Конституции БССР",
        "opt_b": "1924 г. — принятие Конституции БССР; 1926 г. — вступление в СССР; 1936 г. — перенос столицы",
        "opt_c": "1924 г. — создание коммунистической партии БССР; 1926 г. — начало индустриализации; 1936 г. — проведение выборов",
        "opt_d": "1924 г. — вхождение в состав СССР; 1926 г. — принятие герба; 1936 г. — утверждение границ",
        "correct": "a",
        "explanation": "В 1924 г. произошло первое укрупнение БССР — в её состав вошли Витебская, Могилёвская и Гомельская губернии. В 1926 г. — второе укрупнение (Гомельский и Речицкий уезды). В 1936 г. была принята новая Конституция БССР. К 1939 г. территория БССР выросла до 226 тыс. км²."
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
    csv_filename = 'industrializaciya_kollektivizaciya_bssr.csv'
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
