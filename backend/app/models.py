from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, CheckConstraint, Uuid, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from .db.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = Column(String(100), nullable=False)
    class_name = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    device_token = Column(String(255), nullable=True)

    results = relationship("Result", back_populates="student")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    pin_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    quizzes = relationship("Quiz", back_populates="teacher")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    grade = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    teacher_id = Column(Uuid(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    is_public = Column(Boolean, default=False)
    time_limit_quiz = Column(Integer, nullable=True, default=2700)
    time_limit_question = Column(Integer, nullable=True, default=30)

    teacher = relationship("Teacher", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(Uuid(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    text = Column(Text, nullable=False)
    opt_a = Column(String(500), nullable=False)
    opt_b = Column(String(500), nullable=False)
    opt_c = Column(String(500), nullable=False)
    opt_d = Column(String(500), nullable=False)
    correct = Column(String(1), nullable=False)  # 'a', 'b', 'c', or 'd'
    explanation = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        CheckConstraint(correct.in_(['a', 'b', 'c', 'd']), name='correct_check'),
    )

    quiz = relationship("Quiz", back_populates="questions")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(Uuid(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    code = Column(String(4), unique=True, nullable=False)  # 4-letter code
    status = Column(String(20), nullable=False, default="active")  # active, closed
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)

    quiz = relationship("Quiz", back_populates="sessions")
    results = relationship("Result", back_populates="session", cascade="all, delete-orphan")
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")

class Result(Base):
    __tablename__ = "results"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Uuid(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    student_id = Column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False, default=0)
    answers_json = Column(Text, nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="results")
    student = relationship("Student", back_populates="results")


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Uuid(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    student_id = Column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    current_question = Column(Integer, nullable=True)
    answers_json = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student"),
    )

    session = relationship("Session", back_populates="participants")