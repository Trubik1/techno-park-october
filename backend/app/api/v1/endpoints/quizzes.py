from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app import schemas, crud, models
from app.db.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.QuizResponse)
def create_quiz(quiz: schemas.QuizCreate, teacher_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        db_quiz = crud.create_quiz(db=db, quiz=quiz, teacher_id=teacher_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    d = {c.name: getattr(db_quiz, c.name) for c in db_quiz.__table__.columns}
    d['question_count'] = 0
    d['teacher_name'] = db_quiz.teacher.name if db_quiz.teacher else ""
    return schemas.QuizResponse(**d)

@router.get("/", response_model=List[schemas.QuizResponse])
def read_quizzes(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[uuid.UUID] = None,
    public: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Quiz)
    if teacher_id:
        query = query.filter(models.Quiz.teacher_id == teacher_id)
    if public is True:
        query = query.filter(models.Quiz.is_public == True)
    quizzes = query.offset(skip).limit(limit).all()
    result = []
    for q in quizzes:
        d = {c.name: getattr(q, c.name) for c in q.__table__.columns}
        d['question_count'] = len(q.questions) if hasattr(q, 'questions') else 0
        d['teacher_name'] = q.teacher.name if q.teacher else ""
        result.append(schemas.QuizResponse(**d))
    return result

@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def read_quiz(quiz_id: uuid.UUID, db: Session = Depends(get_db)):
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    d = {c.name: getattr(db_quiz, c.name) for c in db_quiz.__table__.columns}
    d['question_count'] = len(db_quiz.questions) if hasattr(db_quiz, 'questions') else 0
    d['teacher_name'] = db_quiz.teacher.name if db_quiz.teacher else ""
    return schemas.QuizResponse(**d)

@router.put("/{quiz_id}", response_model=schemas.QuizResponse)
def update_quiz(quiz_id: uuid.UUID, quiz_update: schemas.QuizUpdate, db: Session = Depends(get_db)):
    try:
        db_quiz = crud.update_quiz(db, quiz_id=quiz_id, quiz_update=quiz_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    d = {c.name: getattr(db_quiz, c.name) for c in db_quiz.__table__.columns}
    d['question_count'] = len(db_quiz.questions) if hasattr(db_quiz, 'questions') else 0
    d['teacher_name'] = db_quiz.teacher.name if db_quiz.teacher else ""
    return schemas.QuizResponse(**d)

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: uuid.UUID, db: Session = Depends(get_db)):
    deleted = crud.delete_quiz(db, quiz_id=quiz_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quiz not found")