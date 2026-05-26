"""
One-time script: export the b1v1 quiz from DB to CSV.
"""
import sys, os
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, os.getcwd())
import csv
from app.db.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()
quiz = db.query(models.Quiz).order_by(models.Quiz.created_at.desc()).first()
if not quiz:
    print("Quiz not found in DB. Run: cd backend && python seed_quiz_b1v1.py")
    db.close()
    exit()

questions = db.query(models.Question).filter(models.Question.quiz_id == quiz.id).order_by(models.Question.id).all()
filepath = os.path.join(os.path.dirname(__file__), "drevnie_lyudi_belarus.csv")

with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'correct', 'explanation'])
    for q in questions:
        w.writerow([q.text, q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.correct, q.explanation or ''])

db.close()
print(f"Exported {len(questions)} questions to: {filepath}")
