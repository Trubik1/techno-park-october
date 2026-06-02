from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
import uuid
import pandas as pd
import io
from app import schemas, crud, models
from app.db.database import get_db

router = APIRouter()

def validate_quiz_import_data(df):
    """
    Валидация структуры импортированного файла.
    Ожидаемые колонки: question, opt_a, opt_b, opt_c, opt_d, correct, explanation (опционально)
    """
    required_columns = ['question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'correct']
    optional_columns = ['explanation']
    
    # Проверяем наличие обязательных колонок
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return False, f"Missing required columns: {', '.join(missing_columns)}"
    
    # Проверяем, что правильные ответы в формате a, b, c, d
    invalid_correct = df[~df['correct'].isin(['a', 'b', 'c', 'd'])]
    if not invalid_correct.empty:
        return False, "Correct answers must be one of: a, b, c, d"
    
    # Проверяем, что нет пустых вопросов или вариантов ответов
    for col in required_columns:
        if df[col].isnull().any() or (df[col] == '').any():
            return False, f"Column '{col}' contains empty values"
    
    return True, "Data is valid"

@router.post("/preview", response_model=schemas.QuizImportPreview)
def preview_quiz_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Предпросмотр импортированного теста из CSV или Excel файла.
    Выполняет двухэтапную валидацию: клиентскую (в браузере) и серверную.
    """
    # Проверяем тип файла
    if not file.filename or not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported"
        )
    
    try:
        # Читаем файл в зависимости от типа
        content = file.file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8-sig')))
        else:  # Excel files
            df = pd.read_excel(io.BytesIO(content))
        
        # Валидация данных
        is_valid, message = validate_quiz_import_data(df)
        
        if not is_valid:
            return schemas.QuizImportPreview(
                success=False,
                message=message,
                questions_count=0,
                questions=[],
                errors=[message]
            )
        
        # Преобразуем данные в формат вопросов
        questions = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                question_data = {
                    "text": str(row['question']).strip(),
                    "opt_a": str(row['opt_a']).strip(),
                    "opt_b": str(row['opt_b']).strip(),
                    "opt_c": str(row['opt_c']).strip(),
                    "opt_d": str(row['opt_d']).strip(),
                    "correct": str(row['correct']).strip().lower(),
                    "explanation": str(row['explanation']).strip() if pd.notna(row.get('explanation')) and str(row['explanation']).strip() != '' else None
                }
                
                # Дополнительная валидация на уровне строки
                if not question_data["text"]:
                    errors.append(f"Row {index + 1}: Question text is empty")
                    continue
                
                has_empty_option = False
                for opt in ['opt_a', 'opt_b', 'opt_c', 'opt_d']:
                    if not question_data[opt]:
                        errors.append(f"Row {index + 1}: Option {opt.upper()} is empty")
                        has_empty_option = True
                        break
                
                if not has_empty_option:
                    questions.append(question_data)
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        if errors:
            return schemas.QuizImportPreview(
                success=False,
                message="Data validation failed",
                questions_count=len(questions),
                questions=questions,
                errors=errors
            )
        
        return schemas.QuizImportPreview(
            success=True,
            message=f"Successfully previewed {len(questions)} questions",
            questions_count=len(questions),
            questions=questions,
            errors=[]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        file.file.close()

@router.post("/confirm", response_model=schemas.QuizResponse)
def confirm_quiz_import(
    quiz_data: schemas.QuizCreate,
    questions: List[schemas.QuestionCreate],
    teacher_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Подтверждение и сохранение импортированного теста.
    Создает тест и все связанные вопросы в одной транзакции.
    """
    teacher = crud.get_teacher(db, teacher_id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = db.query(models.Quiz).filter(
        models.Quiz.teacher_id == teacher_id,
        func.lower(models.Quiz.title) == quiz_data.title.lower().strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Тест с названием «{quiz_data.title}» уже существует. Пожалуйста, используйте другое название."
        )

    db_quiz = models.Quiz(
        title=quiz_data.title,
        subject=quiz_data.subject,
        grade=quiz_data.grade,
        teacher_id=teacher_id,
        is_public=quiz_data.is_public,
        time_limit_quiz=quiz_data.time_limit_quiz,
        time_limit_question=quiz_data.time_limit_question,
    )
    db.add(db_quiz)
    db.flush()

    for q in questions:
        db.add(models.Question(
            text=q.text,
            opt_a=q.opt_a,
            opt_b=q.opt_b,
            opt_c=q.opt_c,
            opt_d=q.opt_d,
            correct=q.correct,
            explanation=q.explanation,
            quiz_id=db_quiz.id
        ))
    db.commit()
    db.refresh(db_quiz)
    d = {c.name: getattr(db_quiz, c.name) for c in db_quiz.__table__.columns}
    d['question_count'] = len(db_quiz.questions)
    d['teacher_name'] = db_quiz.teacher.name if db_quiz.teacher else ""
    return schemas.QuizResponse(**d)