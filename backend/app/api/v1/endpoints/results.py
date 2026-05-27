from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid
from app import schemas, crud, models
from app.db.database import get_db

router = APIRouter()

class ResultSubmit(schemas.ResultCreate):
    session_id: uuid.UUID
    student_id: uuid.UUID

@router.post("/", response_model=schemas.ResultResponse)
def submit_result(result: ResultSubmit, db: Session = Depends(get_db)):
    """
    Отправка результатов теста учеником.
    session_id и student_id передаются в теле запроса.
    """
    db_session = crud.get_session(db, session_id=result.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    db_student = crud.get_student(db, student_id=result.student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    return crud.create_result(db=db, result=result, session_id=result.session_id, student_id=result.student_id)

@router.get("/session/{session_id}", response_model=List[schemas.ResultWithStudentResponse])
def get_session_results(session_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить все результаты для конкретной сессии.
    Используется учителем для просмотра результатов.
    """
    db_session = crud.get_session(db, session_id=session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    results = db.query(models.Result).options(
        joinedload(models.Result.student),
        joinedload(models.Result.session).joinedload(models.Session.quiz)
    ).filter(
        models.Result.session_id == session_id
    ).offset(skip).limit(limit).all()

    return [
        schemas.ResultWithStudentResponse(
            id=r.id,
            score=r.score,
            total_questions=r.total_questions if r.total_questions is not None else 0,
            answers_json=r.answers_json,
            completed_at=r.completed_at,
            quiz_title=r.session.quiz.title if r.session and r.session.quiz else "",
            student_display_name=r.student.display_name if r.student else "",
            student_class_name=r.student.class_name if r.student else "",
        )
        for r in results
    ]

@router.get("/student/{student_id}", response_model=List[schemas.ResultResponse])
def get_student_results(student_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить все результаты для конкретного ученика.
    Используется в личном кабинете ученика.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    results = db.query(models.Result).options(
        joinedload(models.Result.session).joinedload(models.Session.quiz)
    ).filter(models.Result.student_id == student_id).offset(skip).limit(limit).all()
    
    return [
        schemas.ResultResponse(
            id=r.id,
            score=r.score,
            total_questions=r.total_questions if r.total_questions is not None else 0,
            answers_json=r.answers_json,
            completed_at=r.completed_at,
            quiz_title=r.session.quiz.title if r.session and r.session.quiz else "",
        )
        for r in results
    ]