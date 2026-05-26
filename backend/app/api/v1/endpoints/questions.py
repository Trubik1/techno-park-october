from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app import schemas, crud
from app.db.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.QuestionResponse)
def create_question(question: schemas.QuestionCreate, quiz_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Создание нового вопроса для теста.
    Требует quiz_id для связи с тестом.
    """
    # Check if quiz exists
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return crud.create_question(db=db, question=question, quiz_id=quiz_id)

@router.get("/", response_model=List[schemas.QuestionResponse])
def read_questions(quiz_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список вопросов для конкретного теста.
    """
    # Check if quiz exists
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = crud.get_questions_by_quiz(db, quiz_id=quiz_id, skip=skip, limit=limit)
    return questions

@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def read_question(question_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить конкретный вопрос по ID.
    """
    db_question = crud.get_question(db, question_id=question_id)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question