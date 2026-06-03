from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
import json
import random
import string
from datetime import datetime, timezone
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)

# Student CRUD
def get_student(db: Session, student_id: uuid.UUID):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_device_token(db: Session, device_token: str):
    return db.query(models.Student).filter(models.Student.device_token == device_token).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Student).offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(
        display_name=student.display_name,
        class_name=student.class_name
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

# Teacher CRUD
def get_teacher(db: Session, teacher_id: uuid.UUID):
    return db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()

def get_teacher_by_name(db: Session, name: str):
    return db.query(models.Teacher).filter(models.Teacher.name == name).first()

def get_teacher_by_pin(db: Session, pin: str):
    teachers = db.query(models.Teacher).all()
    for teacher in teachers:
        if verify_pin(pin, teacher.pin_hash):
            return teacher
    return None

def get_teachers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Teacher).offset(skip).limit(limit).all()

def create_teacher(db: Session, teacher: schemas.TeacherCreate):
    hashed_pin = hash_pin(teacher.pin)
    db_teacher = models.Teacher(
        name=teacher.name or "Учитель",
        pin_hash=hashed_pin
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

# Quiz CRUD
BASE_QUIZ_TITLE = "Билет 1. Древние люди на территории Беларуси"

def get_quiz(db: Session, quiz_id: uuid.UUID):
    return db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

def get_quizzes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Quiz).offset(skip).limit(limit).all()

def clone_public_quizzes_for_teacher(db: Session, teacher_id: uuid.UUID):
    public_quizzes = db.query(models.Quiz).filter(models.Quiz.is_public == True).all()
    for base_quiz in public_quizzes:
        qs = db.query(models.Question).filter(models.Question.quiz_id == base_quiz.id).all()
        if not qs:
            continue
        existing = db.query(models.Quiz).filter(
            models.Quiz.title == base_quiz.title,
            models.Quiz.teacher_id == teacher_id,
        ).first()
        if existing:
            continue
        clone = models.Quiz(
            id=uuid.uuid4(),
            title=base_quiz.title,
            subject=base_quiz.subject,
            grade=base_quiz.grade,
            teacher_id=teacher_id,
            created_at=datetime.now(timezone.utc),
            is_public=False,
            time_limit_quiz=base_quiz.time_limit_quiz,
            time_limit_question=base_quiz.time_limit_question,
        )
        db.add(clone)
        db.flush()
        for q in qs:
            db.add(models.Question(
                id=uuid.uuid4(),
                quiz_id=clone.id,
                text=q.text,
                opt_a=q.opt_a,
                opt_b=q.opt_b,
                opt_c=q.opt_c,
                opt_d=q.opt_d,
                correct=q.correct,
                explanation=q.explanation,
            ))
    db.commit()

def create_quiz(db: Session, quiz: schemas.QuizCreate, teacher_id: uuid.UUID):
    db_quiz = models.Quiz(
        title=quiz.title,
        subject=quiz.subject,
        grade=quiz.grade,
        teacher_id=teacher_id,
        is_public=quiz.is_public,
        time_limit_quiz=quiz.time_limit_quiz,
        time_limit_question=quiz.time_limit_question,
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def update_quiz(db: Session, quiz_id: uuid.UUID, quiz_update: schemas.QuizUpdate):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not db_quiz:
        return None
    update_data = quiz_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_quiz, key, value)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def delete_quiz(db: Session, quiz_id: uuid.UUID):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not db_quiz:
        return False
    db.delete(db_quiz)
    db.commit()
    return True

# Question CRUD
def get_question(db: Session, question_id: uuid.UUID):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def get_questions_by_quiz(db: Session, quiz_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.Question).filter(models.Question.quiz_id == quiz_id).order_by(models.Question.sort_order).offset(skip).limit(limit).all()

def create_question(db: Session, question: schemas.QuestionCreate, quiz_id: uuid.UUID):
    max_order = db.query(func.max(models.Question.sort_order)).filter(models.Question.quiz_id == quiz_id).scalar() or -1
    db_question = models.Question(
        text=question.text,
        opt_a=question.opt_a,
        opt_b=question.opt_b,
        opt_c=question.opt_c,
        opt_d=question.opt_d,
        correct=question.correct,
        explanation=question.explanation,
        quiz_id=quiz_id,
        sort_order=max_order + 1
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: uuid.UUID):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return False
    db.delete(db_question)
    db.commit()
    return True

# Teacher CRUD (continued)
def update_teacher_pin(db: Session, teacher_id: uuid.UUID, new_pin: str, name: str = None):
    db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not db_teacher:
        return None
    db_teacher.pin_hash = hash_pin(new_pin)
    if name is not None:
        db_teacher.name = name
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

# Session CRUD
def get_session(db: Session, session_id: uuid.UUID):
    return db.query(models.Session).filter(models.Session.id == session_id).first()

def get_session_by_code(db: Session, code: str):
    return db.query(models.Session).filter(models.Session.code == code).first()

def get_sessions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Session).offset(skip).limit(limit).all()

def create_session(db: Session, session: schemas.SessionCreate, quiz_id: uuid.UUID):
    # Generate a unique 4-letter code
    def generate_code():
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    code = generate_code()
    # Ensure uniqueness (in a real app, we might want to handle collisions better)
    while db.query(models.Session).filter(models.Session.code == code).first():
        code = generate_code()
    
    db_session = models.Session(
        quiz_id=quiz_id,
        code=code,
        status=session.status
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def close_session(db: Session, session_id: uuid.UUID):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if db_session:
        db_session.status = "closed"
        db_session.closed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_session)
    return db_session

# Result CRUD
def get_result(db: Session, result_id: uuid.UUID):
    return db.query(models.Result).filter(models.Result.id == result_id).first()

def get_results_by_session(db: Session, session_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.Result).filter(models.Result.session_id == session_id).offset(skip).limit(limit).all()

def get_results_by_student(db: Session, student_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.Result).filter(models.Result.student_id == student_id).offset(skip).limit(limit).all()

def create_result(db: Session, result: schemas.ResultCreate, session_id: uuid.UUID, student_id: uuid.UUID):
    # Convert answers list to JSON string
    answers_json = json.dumps([answer.model_dump() for answer in result.answers])
    
    db_result = models.Result(
        session_id=session_id,
        student_id=student_id,
        score=result.score,
        total_questions=result.total_questions if result.total_questions is not None else len(result.answers),
        answers_json=answers_json
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    # Auto-close session if all participants have submitted
    _auto_close_session_if_all_complete(db, session_id)

    return db_result

def _auto_close_session_if_all_complete(db: Session, session_id: uuid.UUID):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session or db_session.status != "active":
        return
    total_participants = db.query(models.SessionParticipant).filter(
        models.SessionParticipant.session_id == session_id
    ).count()
    total_results = db.query(models.Result).filter(
        models.Result.session_id == session_id
    ).count()
    if total_participants > 0 and total_results >= total_participants:
        db_session.status = "closed"
        db_session.closed_at = datetime.now(timezone.utc)
        db.commit()


# Session participant CRUD
def join_session(db: Session, session_id: uuid.UUID, student_id: uuid.UUID):
    existing = db.query(models.SessionParticipant).filter(
        models.SessionParticipant.session_id == session_id,
        models.SessionParticipant.student_id == student_id
    ).first()
    if existing:
        return existing
    participant = models.SessionParticipant(
        id=uuid.uuid4(),
        session_id=session_id,
        student_id=student_id
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

def get_participants_by_session(db: Session, session_id: uuid.UUID):
    return db.query(
        models.SessionParticipant,
        models.Student.display_name,
        models.Student.class_name,
        models.Result.completed_at,
        models.Result.score,
        models.Result.total_questions
    ).join(
        models.Student, models.SessionParticipant.student_id == models.Student.id
    ).outerjoin(
        models.Result,
        (models.Result.session_id == models.SessionParticipant.session_id) &
        (models.Result.student_id == models.SessionParticipant.student_id)
    ).filter(
        models.SessionParticipant.session_id == session_id
    ).all()

def get_active_sessions_by_teacher(db: Session, teacher_id: uuid.UUID):
    return db.query(
        models.Session,
        models.Quiz.title,
        models.Quiz.subject,
        models.Quiz.grade,
    ).join(
        models.Quiz, models.Session.quiz_id == models.Quiz.id
    ).filter(
        models.Quiz.teacher_id == teacher_id,
        models.Session.status == "active",
    ).order_by(models.Session.started_at.desc()).all()

def get_session_leaderboard(db: Session, session_id: uuid.UUID):
    rows = db.query(
        models.Student.display_name,
        models.Result.score,
        models.Result.total_questions,
        models.Result.completed_at
    ).join(
        models.Result, models.Result.student_id == models.Student.id
    ).filter(
        models.Result.session_id == session_id
    ).order_by(
        models.Result.score.desc(),
        models.Result.completed_at.asc()
    ).all()
    result = []
    for rank, (name, score, total, completed) in enumerate(rows, start=1):
        result.append({
            "rank": rank,
            "student_name": name,
            "score": score,
            "total": total or 0,
            "percentage": round((score / total * 100) if total else 0, 1),
        })
    return result