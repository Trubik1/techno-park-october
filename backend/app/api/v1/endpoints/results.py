from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid
import json
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
    Получить все результаты для конкретного ученика (и сессии, и практика).
    Используется в личном кабинете ученика.
    """
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    results = db.query(models.Result).options(
        joinedload(models.Result.session).joinedload(models.Session.quiz),
        joinedload(models.Result.quiz)
    ).filter(models.Result.student_id == student_id).order_by(models.Result.completed_at.desc()).offset(skip).limit(limit).all()
    
    def get_quiz_title(r):
        if r.quiz:
            return r.quiz.title
        if r.session and r.session.quiz:
            return r.session.quiz.title
        return ""
    
    return [
        schemas.ResultResponse(
            id=r.id,
            score=r.score,
            total_questions=r.total_questions if r.total_questions is not None else 0,
            answers_json=r.answers_json,
            completed_at=r.completed_at,
            quiz_title=get_quiz_title(r),
            mode=r.mode or "session",
        )
        for r in results
    ]

# ── Practice (self-study) endpoints ──

@router.post("/practice/", response_model=schemas.PracticeResultResponse)
def submit_practice_result(
    result: schemas.PracticeResultCreate,
    student_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db)
):
    db_student = crud.get_student(db, student_id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_quiz = crud.get_quiz(db, quiz_id=result.quiz_id)
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db_result = crud.create_practice_result(db=db, result=result, student_id=student_id)
    return schemas.PracticeResultResponse(
        id=db_result.id,
        score=db_result.score,
        total_questions=db_result.total_questions or 0,
        answers_json=db_result.answers_json,
        completed_at=db_result.completed_at,
        quiz_title=db_quiz.title,
        quiz_id=db_result.quiz_id,
        mode=db_result.mode or "practice",
    )


@router.get("/practice/", response_model=List[schemas.PracticeResultResponse])
def get_practice_results(
    student_id: uuid.UUID = Query(...),
    quiz_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    results = crud.get_practice_results_by_student(db, student_id=student_id, quiz_id=quiz_id)
    return [
        schemas.PracticeResultResponse(
            id=r.id,
            score=r.score,
            total_questions=r.total_questions or 0,
            answers_json=r.answers_json,
            completed_at=r.completed_at,
            quiz_title=r.quiz.title if r.quiz else "",
            quiz_id=r.quiz_id,
            mode=r.mode or "practice",
        )
        for r in results
    ]


@router.get("/practice/summary/", response_model=List[schemas.PracticeSummaryItem])
def get_practice_summary(
    student_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db)
):
    return crud.get_practice_summary(db, student_id=student_id)


# ── Review (works for both session and practice) ──

@router.get("/{result_id}/review", response_model=schemas.AnswerReviewResponse)
def get_result_review(result_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить детальный обзор ответов для конкретного результата.
    Возвращает каждый вопрос, ответ ученика, правильный ответ и объяснение.
    """
    db_result = db.query(models.Result).options(
        joinedload(models.Result.session).joinedload(models.Session.quiz),
        joinedload(models.Result.quiz)
    ).filter(models.Result.id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found")

    quiz = db_result.quiz or (db_result.session.quiz if db_result.session else None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found for this result")
    questions = crud.get_questions_by_quiz(db, quiz_id=quiz.id)
    questions_map = {str(q.id): q for q in questions}

    try:
        answers_data = json.loads(db_result.answers_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse answers")

    answer_items = []
    for ans in answers_data:
        q = questions_map.get(ans.get("question_id", ""))
        if not q:
            continue
        student_ans = ans.get("answer", "")
        answer_items.append(schemas.AnswerReviewItem(
            question_text=q.text,
            opt_a=q.opt_a,
            opt_b=q.opt_b,
            opt_c=q.opt_c,
            opt_d=q.opt_d,
            student_answer=student_ans,
            correct_answer=q.correct,
            is_correct=student_ans == q.correct,
            explanation=q.explanation,
        ))

    return schemas.AnswerReviewResponse(
        quiz_title=quiz.title,
        answers=answer_items,
        score=db_result.score,
        total=db_result.total_questions or 0,
    )