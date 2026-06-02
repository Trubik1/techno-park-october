from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app import schemas, crud
from app.db.database import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.TeacherResponse)
def teacher_login(login_data: schemas.TeacherLogin, db: Session = Depends(get_db)):
    """
    Вход учителя по PIN-коду без имени.
    """
    db_teacher = crud.get_teacher_by_pin(db, pin=login_data.pin)
    if not db_teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect PIN"
        )
    return db_teacher

@router.post("/", response_model=schemas.TeacherResponse)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового учителя по PIN-коду.
    Автоматически копирует базовый тест новому учителю.
    """
    existing = crud.get_teacher_by_pin(db, pin=teacher.pin)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Teacher with this PIN already exists"
        )
    new_teacher = crud.create_teacher(db=db, teacher=teacher)
    return new_teacher

@router.get("/", response_model=List[schemas.TeacherResponse])
def read_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех учителей (для админских целей).
    """
    teachers = crud.get_teachers(db, skip=skip, limit=limit)
    return teachers

@router.put("/{teacher_id}/pin", response_model=schemas.TeacherResponse)
def reset_teacher_pin(teacher_id: uuid.UUID, body: schemas.TeacherPinReset, db: Session = Depends(get_db)):
    """
    Смена PIN-кода учителя.
    Требует старый PIN для подтверждения.
    """
    db_teacher = crud.get_teacher(db, teacher_id=teacher_id)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if not crud.verify_pin(body.old_pin, db_teacher.pin_hash):
        raise HTTPException(status_code=400, detail="Incorrect old PIN")
    updated = crud.update_teacher_pin(db, teacher_id=teacher_id, new_pin=body.new_pin, name=body.name)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update PIN")
    return updated