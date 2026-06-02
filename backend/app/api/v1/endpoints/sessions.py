from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timezone
from app import schemas, crud, models
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

@router.get("/active/", response_model=List[dict])
def get_active_sessions(teacher_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить активные сессии для конкретного учителя.
    """
    rows = crud.get_active_sessions_by_teacher(db, teacher_id=teacher_id)
    return [
        {
            "session_id": str(s.id),
            "code": s.code,
            "quiz_title": title,
            "subject": subject,
            "grade": grade,
            "started_at": s.started_at.isoformat() if s.started_at else None,
        }
        for s, title, subject, grade in rows
    ]

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


@router.post("/{code}/join", response_model=schemas.ParticipantResponse)
def join_session(code: str, body: schemas.SessionJoinRequest, db: Session = Depends(get_db)):
    """
    Ученик присоединяется к сессии по коду.
    """
    db_session = crud.get_session_by_code(db, code=code)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if db_session.status != 'active':
        raise HTTPException(status_code=400, detail="Session is not active")
    student = crud.get_student(db, student_id=body.student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    participant = crud.join_session(db, session_id=db_session.id, student_id=body.student_id)
    db_quiz = crud.get_quiz(db, quiz_id=db_session.quiz_id)
    total = len(db_quiz.questions) if db_quiz else 0
    return schemas.ParticipantResponse(
        student_id=student.id,
        display_name=student.display_name,
        class_name=student.class_name,
        joined_at=participant.joined_at,
        completed_at=None,
        score=None,
        total_questions=total
    )


@router.get("/{session_id}/participants", response_model=List[schemas.ParticipantResponse])
def get_participants(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить всех участников сессии (присоединившихся + сдавших).
    """
    rows = crud.get_participants_by_session(db, session_id=session_id)
    result = []
    for p, display_name, class_name, completed_at, score, total_questions in rows:
        result.append(schemas.ParticipantResponse(
            student_id=p.student_id,
            display_name=display_name,
            class_name=class_name,
            joined_at=p.joined_at,
            completed_at=completed_at,
            score=score,
            total_questions=total_questions or 0
        ))
    return result

@router.get("/{session_id}/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить таблицу лидеров для сессии (отсортировано по баллам).
    """
    db_session = crud.get_session(db, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return crud.get_session_leaderboard(db, session_id=session_id)