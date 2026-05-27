from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# Student schemas
class StudentBase(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100, pattern=r'^[a-zA-Zа-яА-ЯёЁ0-9\s\-]+$')
    class_name: str = Field(..., min_length=1, max_length=50)

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Teacher schemas
class TeacherCreate(BaseModel):
    name: str = Field(default="Учитель", max_length=100)
    pin: str = Field(..., min_length=6, max_length=10)

class TeacherLogin(BaseModel):
    pin: str = Field(..., min_length=6, max_length=10)

class TeacherResponse(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Quiz schemas
class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=100)
    grade: str = Field(..., min_length=1, max_length=50)
    is_public: bool = False
    time_limit_quiz: Optional[int] = 2700
    time_limit_question: Optional[int] = 30

class QuizCreate(QuizBase):
    pass

class QuizResponse(QuizBase):
    id: uuid.UUID
    teacher_id: uuid.UUID
    question_count: int = 0
    created_at: datetime
    teacher_name: str = ""

    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    text: str = Field(..., min_length=1)
    opt_a: str = Field(..., min_length=1)
    opt_b: str = Field(..., min_length=1)
    opt_c: str = Field(..., min_length=1)
    opt_d: str = Field(..., min_length=1)
    correct: str = Field(..., pattern='^[abcd]$')
    explanation: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: uuid.UUID
    quiz_id: uuid.UUID
    
    class Config:
        from_attributes = True

# Session schemas
class SessionBase(BaseModel):
    status: str = Field(default="active", pattern='^(active|closed)$')

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: uuid.UUID
    quiz_id: uuid.UUID
    code: str
    started_at: datetime
    closed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Result schemas
class AnswerItem(BaseModel):
    question_id: str
    answer: str  # 'a', 'b', 'c', or 'd'

class ResultBase(BaseModel):
    score: int
    total_questions: int = 0
    answers: List[AnswerItem]

class ResultCreate(ResultBase):
    pass

class ResultResponse(BaseModel):
    id: uuid.UUID
    score: int
    total_questions: int
    answers_json: str
    completed_at: datetime
    quiz_title: str = ""
    
    class Config:
        from_attributes = True

class ResultWithStudentResponse(ResultResponse):
    student_display_name: str = ""
    student_class_name: str = ""

# Session participant schemas
class SessionJoinRequest(BaseModel):
    student_id: uuid.UUID

class ParticipantResponse(BaseModel):
    student_id: uuid.UUID
    display_name: str
    class_name: str
    joined_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[int] = None
    total_questions: int = 0

    class Config:
        from_attributes = True

# Import schemas
class QuizImportPreview(BaseModel):
    success: bool
    message: str
    questions_count: int
    questions: List[QuestionBase]
    errors: List[str] = []

# Live session data
class LiveSessionData(BaseModel):
    session_id: uuid.UUID
    quiz_title: str
    total_questions: int
    results: List[dict]  # Will contain student answers and scores