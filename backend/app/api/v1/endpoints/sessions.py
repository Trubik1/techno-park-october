from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app import schemas, crud
from app.db.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.SessionResponse)
def create_session(session: schemas.SessionCreate, quiz_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Создание новой сессии для теста.
    Генерирует 4-значный код для доступа учеников.
    Требует quiz_id для связи с тестом.
    """
    # Check if quiz exists
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return crud.create_session(db=db, session=session, quiz_id=quiz_id)

@router.get("/{code}", response_model=schemas.SessionResponse)
def get_session_by_code(code: str, db: Session = Depends(get_db)):
    """
    Получить сессию по 4-значному коду.
    Используется учениками для подключения к сессии.
    """
    db_session = crud.get_session_by_code(db, code=code)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.get("/", response_model=List[schemas.SessionResponse])
def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех сессий (для админских целей).
    """
    sessions = crud.get_sessions(db, skip=skip, limit=limit)
    return sessions

@router.post("/{session_id}/close", response_model=schemas.SessionResponse)
def close_session_endpoint(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Закрыть сессию (изменить статус на closed).
    """
    db_session = crud.close_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session