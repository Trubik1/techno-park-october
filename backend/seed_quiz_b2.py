"""
Idempotent seed script: creates quiz "Полоцкое и Туровское княжества" (14 questions).

Based on Билет №2, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Полоцкое и Туровское княжества"

QUESTIONS_DATA = [
    {
        "text": "В каком году Полоцк впервые упоминается в летописи «Повесть временных лет»?",
        "opt_a": "862 г.",
        "opt_b": "882 г.",
        "opt_c": "980 г.",
        "opt_d": "988 г.",
        "correct": "a",
        "explanation": "Полоцк впервые упоминается в летописи «Повесть временных лет» в 862 г. К тому моменту город уже был крупным поселением и играл важную роль в регионе."
    },
    {
        "text": "Как звали первого достоверно известного полоцкого князя?",
        "opt_a": "Изяслав",
        "opt_b": "Брячислав",
        "opt_c": "Рогволод",
        "opt_d": "Всеслав",
        "correct": "c",
        "explanation": "Первым достоверно известным полоцким князем был Рогволод, имевший балтское или варяжское происхождение."
    },
    {
        "text": "Почему Владимир напал на Полоцк в конце X в.?",
        "opt_a": "Полоцк отказался платить дань Киеву",
        "opt_b": "Князь Рогволод отказался выдать Рогнеду за Владимира, отдав её предпочтение Ярополку",
        "opt_c": "Полоцк напал на Новгород",
        "opt_d": "Владимир хотел захватить торговый путь",
        "correct": "b",
        "explanation": "Рогволод согласился отдать дочь Рогнеду за киевского князя Ярополка, отказав новгородскому князю Владимиру, что послужило поводом для войны."
    },
    {
        "text": "Кто заступился за Рогнеду, когда Владимир хотел её казнить за попытку покушения?",
        "opt_a": "Изяслав",
        "opt_b": "Брячислав",
        "opt_c": "Ярослав Мудрый",
        "opt_d": "Всеслав Чародей",
        "correct": "a",
        "explanation": "Малолетний сын Изяслав заступился за мать с мечом в руках, что впечатлило Владимира. Владимир выслал Рогнеду с сыном в Полоцкую землю и основал город Изяславль."
    },
    {
        "text": "При каком князе произошло усиление Полоцкого княжества в первой половине XI в.?",
        "opt_a": "Рогволоде",
        "opt_b": "Изяславе",
        "opt_c": "Брячиславе",
        "opt_d": "Всеславе Чародее",
        "correct": "c",
        "explanation": "При сыне Изяслава — Брячиславе (правил в 1003–1044 гг.) — Полоцкое княжество расширило территорию и усилило контроль за торговым путём «Из варяг в греки»."
    },
    {
        "text": "В каком году произошла битва на реке Немига?",
        "opt_a": "980 г.",
        "opt_b": "1067 г.",
        "opt_c": "1101 г.",
        "opt_d": "1044 г.",
        "correct": "b",
        "explanation": "Битва на реке Немига (современный Минск) произошла 3 марта 1067 г. между войсками Всеслава Чародея и тремя сыновьями Ярослава Мудрого."
    },
    {
        "text": "Кто такой Всеслав Чародей?",
        "opt_a": "Киевский князь, разгромивший Полоцк",
        "opt_b": "Полоцкий князь, правивший более 50 лет (1044–1101 гг.)",
        "opt_c": "Новгородский князь, захвативший Полоцк",
        "opt_d": "Сын Ярослава Мудрого",
        "correct": "b",
        "explanation": "Всеслав, прозванный Чародеем, правил в Полоцке с 1044 по 1101 г. Он расширил территорию княжества, захватил Новгород, а после освобождения из киевской тюрьмы 7 месяцев был Великим Князем Киевским."
    },
    {
        "text": "Что такое «вече» в Полоцком княжестве?",
        "opt_a": "Народное собрание взрослых мужчин, решавшее важные государственные вопросы",
        "opt_b": "Княжеский совет из бояр",
        "opt_c": "Религиозный обряд",
        "opt_d": "Налоговый сбор",
        "correct": "a",
        "explanation": "Вече — общее собрание взрослых мужчин, которое могло назначать или снимать князя, заключать договоры и объявлять войны. Решение принималось по силе крика сторонников."
    },
    {
        "text": "Какой сборник законов действовал в Полоцком княжестве?",
        "opt_a": "Статут ВКЛ",
        "opt_b": "Русская Правда",
        "opt_c": "Судебник",
        "opt_d": "Соборное уложение",
        "correct": "b",
        "explanation": "Наиболее известным сборником законов того времени являлась «Русская Правда» Ярослава Мудрого, которая действовала и в Полоцком княжестве."
    },
    {
        "text": "В каком году впервые упоминается Туров?",
        "opt_a": "862 г.",
        "opt_b": "882 г.",
        "opt_c": "980 г.",
        "opt_d": "988 г.",
        "correct": "c",
        "explanation": "Туров впервые упоминается в 980 г. Туровское княжество располагалось на территории современного белорусского Полесья."
    },
    {
        "text": "Чем Туровское княжество отличалось от Полоцкого в отношениях с Киевом?",
        "opt_a": "Туров всегда был независим от Киева",
        "opt_b": "Туровское княжество находилось в серьёзной зависимости от Киева и подчинялось наследнику киевского престола",
        "opt_c": "Туров платил дань Полоцку",
        "opt_d": "Туров воевал с Киевом за независимость",
        "correct": "b",
        "explanation": "Туровская земля являлась волостью киевских князей — зачастую она подчинялась старшему сыну киевского князя. Это отличало её от Полоцка, который оставался более самостоятельным."
    },
    {
        "text": "Какой город Туровского княжества возвысился над Туровом в период феодальной раздробленности?",
        "opt_a": "Минск",
        "opt_b": "Пинск",
        "opt_c": "Витебск",
        "opt_d": "Гродно",
        "correct": "b",
        "explanation": "Пинск располагался на важном водном пути из Киева в Польшу. С течением времени Пинск возвысился над Туровом и стал играть важную роль в экономической и политической жизни княжества."
    },
    {
        "text": "Когда в Турове установилась самостоятельная княжеская династия?",
        "opt_a": "В начале X в.",
        "opt_b": "В середине XII в.",
        "opt_c": "В конце XI в.",
        "opt_d": "В XIII в.",
        "correct": "b",
        "explanation": "Только в середине XII в. в Турове установилась самостоятельная княжеская династия, до этого княжество находилось в зависимости от Киева."
    },
    {
        "text": "Что произошло с Полоцким княжеством при сыновьях Всеслава Чародея?",
        "opt_a": "Оно достигло наивысшего расцвета",
        "opt_b": "Оно распалось на более мелкие княжества (Минское, Витебское, Изяславское)",
        "opt_c": "Оно объединилось с Туровским княжеством",
        "opt_d": "Оно было завоёвано Киевом",
        "correct": "b",
        "explanation": "При сыновьях Всеслава Полоцкое княжество потеряло былое могущество и начало приходить в упадок, распавшись на более мелкие княжества — начался период феодальной раздробленности."
    },
]

def seed(destructive=False):
    SessionLocal().close()
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
    csv_filename = 'polockoe_turovskoe_knyazhestva.csv'
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
