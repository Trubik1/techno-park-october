from fastapi import APIRouter
from app.api.v1.endpoints import students, teachers, quizzes, questions, sessions, results, import_

api_router = APIRouter()

api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
api_router.include_router(import_.router, prefix="/quizzes/import", tags=["import"])