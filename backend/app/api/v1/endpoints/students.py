from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud
from app.db.database import get_db

router = APIRouter()

@router.post("/register", response_model=schemas.StudentResponse)
def register_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового ученика.
    Возвращает UUID ученика, который сохраняется в localStorage браузера.
    """
    db_student = crud.create_student(db=db, student=student)
    return db_student

@router.get("/", response_model=List[schemas.StudentResponse])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех учеников (для админских целей).
    """
    students = crud.get_students(db, skip=skip, limit=limit)
    return students