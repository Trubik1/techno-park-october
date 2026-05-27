"""
Idempotent seed script: creates quiz "Революции 1905-1907 и 1917 гг. Освобождение Беларуси" (7 questions).

Based on Билет №11, экзамен по Истории Беларуси, 9 класс.
"""
import uuid, csv, os
from datetime import datetime, timezone
from app.db.database import SessionLocal
from app import models

TITLE = "Билет 11. Революции 1905-1907 и 1917 гг. Освобождение Беларуси"

QUESTIONS_DATA = [
    {
        "text": "Какие причины послужили началом революции 1905-1907 гг. в России?",
        "opt_a": "Аграрный вопрос, сохранение самодержавия и национальный вопрос",
        "opt_b": "Только аграрный вопрос и отсутствие железных дорог",
        "opt_c": "Только национальный вопрос и русско-японская война",
        "opt_d": "Только рабочий вопрос и рост цен на хлеб",
        "correct": "a",
        "explanation": "Главными причинами революции 1905-1907 гг. стали нерешённый аграрный вопрос (малоземелье крестьян), сохранение самодержавия (отсутствие политических свобод и парламента) и национальный вопрос (угнетение народов Российской империи)."
    },
    {
        "text": "Какое событие 9 января 1905 г. получило название «Кровавое воскресенье»?",
        "opt_a": "Издание Манифеста 17 октября",
        "opt_b": "Расстрел мирного шествия рабочих к Зимнему дворцу в Петербурге",
        "opt_c": "Курловский расстрел в Минске",
        "opt_d": "Роспуск II Государственной думы",
        "correct": "b",
        "explanation": "9 января 1905 г. в Петербурге была расстреляна мирная демонстрация рабочих, направлявшихся к Зимнему дворцу с петицией к Николаю II. Это событие получило название «Кровавое воскресенье» и послужило толчком к началу революции."
    },
    {
        "text": "Какие положения содержались в Манифесте 17 октября 1905 г.?",
        "opt_a": "Создание Государственной думы и дарование демократических свобод (слова, собраний, союзов)",
        "opt_b": "Отмена крестьянской общины и переселение крестьян в Сибирь",
        "opt_c": "Предоставление автономии Беларуси",
        "opt_d": "Отречение Николая II от престола",
        "correct": "a",
        "explanation": "17 октября 1905 г. Николай II подписал Манифест, который учреждал Государственную думу как законодательный орган и даровал населению демократические свободы: слова, собраний, союзов и неприкосновенность личности."
    },
    {
        "text": "Какое трагическое событие произошло в Минске 18 октября 1905 г.?",
        "opt_a": "Провозглашение Белорусской Народной Республики",
        "opt_b": "Курловский расстрел — расстрел многотысячного митинга по приказу губернатора П. Курлова",
        "opt_c": "Основание Белорусской социалистической громады",
        "opt_d": "Захват города немецкими войсками",
        "correct": "b",
        "explanation": "18 октября 1905 г. в Минске на Привокзальной площади был расстрелян многотысячный митинг, организованный по приказу минского губернатора Павла Курлова. Это событие вошло в историю как «Курловский расстрел»."
    },
    {
        "text": "Какие политические силы преобладали в I Государственной думе (1906 г.), и кто представлял белорусские губернии?",
        "opt_a": "Большинство — кадеты; от белорусских губерний — автономисты во главе с Романом Скирмунтом",
        "opt_b": "Большинство — эсеры; от Беларуси — большевики",
        "opt_c": "Большинство — октябристы; от Беларуси — монархисты",
        "opt_d": "Большинство — трудовики; от Беларуси — кадеты",
        "correct": "a",
        "explanation": "В I Государственной думе большинство мест получили кадеты (конституционные демократы). Депутаты от белорусских губерний объединились в группу автономистов, лидером которой был Роман Скирмунт. Они добивались автономии Беларуси."
    },
    {
        "text": "Какое событие произошло 3 июня 1907 г. и считается окончанием революции 1905-1907 гг.?",
        "opt_a": "Свержение самодержавия в феврале 1917 г.",
        "opt_b": "Роспуск II Государственной думы и изменение избирательного закона («Третьеиюньский переворот»)",
        "opt_c": "Отречение Николая II от престола",
        "opt_d": "Создание Белорусской социалистической громады",
        "correct": "b",
        "explanation": "3 июня 1907 г. была распущена II Государственная дума и в одностороннем порядке изменён избирательный закон в пользу помещиков. Этот день, известный как «Третьеиюньский переворот», считается датой окончания Первой русской революции."
    },
    {
        "text": "Когда и в результате какой операции была освобождена территория Беларуси от немецко-фашистских захватчиков?",
        "opt_a": "23 июня 1944 г. — начало операции «Багратион» (Василевский, Жуков); Минск освобождён 3 июля 1944 г.",
        "opt_b": "23 сентября 1943 г. — начало операции «Багратион»; Минск освобождён 28 июля 1944 г.",
        "opt_c": "Февраль 1917 г. — свержение самодержавия; Минск освобождён 3 июля 1944 г.",
        "opt_d": "16 июля 1944 г. — партизанский парад; Брест освобождён 23 сентября 1943 г.",
        "correct": "a",
        "explanation": "Освобождение Беларуси началось 23 сентября 1943 г. с освобождения Комарина. 23 июня 1944 г. началась операция «Багратион» под руководством Василевского и Жукова. В ходе операции 3 июля 1944 г. был освобождён Минск, а 28 июля 1944 г. — Брест. Был разгромлен «Белорусский балкон» — группа армий «Центр»."
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
    csv_filename = 'revolucii_1905_1907_i_1917_osvobozhdenie_belarusi.csv'
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
