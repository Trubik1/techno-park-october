from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app import schemas, crud
from app.db.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.QuizResponse)
def create_quiz(quiz: schemas.QuizCreate, teacher_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Создание нового теста вручную.
    Требует teacher_id для связи с учителем.
    """
    return crud.create_quiz(db=db, quiz=quiz, teacher_id=teacher_id)

@router.get("/", response_model=List[schemas.QuizResponse])
def read_quizzes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    quizzes = crud.get_quizzes(db, skip=skip, limit=limit)
    result = []
    for q in quizzes:
        d = {c.name: getattr(q, c.name) for c in q.__table__.columns}
        d['question_count'] = len(q.questions) if hasattr(q, 'questions') else 0
        result.append(schemas.QuizResponse(**d))
    return result

@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def read_quiz(quiz_id: uuid.UUID, db: Session = Depends(get_db)):
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    d = {c.name: getattr(db_quiz, c.name) for c in db_quiz.__table__.columns}
    d['question_count'] = len(db_quiz.questions) if hasattr(db_quiz, 'questions') else 0
    return schemas.QuizResponse(**d)

# We'll add the import endpoint later