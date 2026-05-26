"""
Export a quiz from the database to CSV.
Usage: python export_quiz.py [quiz_title_or_id]
"""
import sys
import os
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.getcwd())

import csv
from app.db.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def export_quiz(quiz_id, filename=None):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        return None
    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).order_by(models.Question.id).all()
    if not filename:
        safe = "".join(c if c.isalnum() or c in ' _-' else '_' for c in quiz.title)
        filename = f"{safe}.csv"
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'correct', 'explanation'])
        for q in questions:
            w.writerow([q.text, q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.correct, q.explanation or ''])
    db.close()
    return filepath

if __name__ == '__main__':
    query = sys.argv[1] if len(sys.argv) > 1 else None
    if query:
        quiz = db.query(models.Quiz).filter(
            (models.Quiz.id == query) | (models.Quiz.title.contains(query))
        ).first()
    else:
        quizzes = db.query(models.Quiz).order_by(models.Quiz.created_at.desc()).limit(5).all()
        print("Последние тесты:")
        for i, q in enumerate(quizzes, 1):
            cnt = db.query(models.Question).filter(models.Question.quiz_id == q.id).count()
            print(f"  {i}. {q.title} ({cnt} вопросов) id={q.id}")
        db.close()
        sys.exit(0)
    if not quiz:
        print("Тест не найден")
        db.close()
        sys.exit(1)
    path = export_quiz(quiz.id)
    print(f"Экспортирован: {path}")
    db.close()
