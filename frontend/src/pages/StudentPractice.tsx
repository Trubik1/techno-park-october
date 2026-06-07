import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { percentageToGrade } from '../utils/grade';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';

interface QuizItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  question_count: number;
}

interface PracticeSummary {
  quiz_id: string;
  quiz_title: string;
  total_questions: number;
  last_score: number | null;
  last_completed_at: string | null;
  attempts: number;
}

const StudentPractice: React.FC = () => {
  const { student, isLoading: isStudentLoading } = useStudent();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [summary, setSummary] = useState<Map<string, PracticeSummary>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);

  useEffect(() => {
    if (isStudentLoading) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ public: 'true' });
        if (filterSubject) params.set('subject', filterSubject);
        if (filterGrade) params.set('grade', filterGrade);
        const res = await fetch(`/api/quizzes/?${params}`);
        if (!res.ok) throw new Error('Failed to load');
        const data: QuizItem[] = await res.json();
        setQuizzes(data);
        const allSubjects = [...new Set(data.map(q => q.subject))].sort();
        const allGrades = [...new Set(data.map(q => q.grade))].sort();
        setSubjects(allSubjects);
        setGrades(allGrades);
        if (student) {
          const sumRes = await fetch(`/api/results/practice/summary/?student_id=${student.id}`);
          if (sumRes.ok) {
            const sumData: PracticeSummary[] = await sumRes.json();
            setSummary(new Map(sumData.map(s => [s.quiz_id, s])));
          }
        }
      } catch {
        setError('Не удалось загрузить билеты.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [student, isStudentLoading, filterSubject, filterGrade]);

  if (isStudentLoading || (isLoading && quizzes.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary animate-pulse">Загрузка билетов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-2 mb-6">
          <ThemeToggleButton />
          <BackButton to="/student/entry" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Подготовка к билетам</h1>
            <Breadcrumbs items={[
              { label: 'Вход ученика', path: '/student/entry' },
              { label: 'Подготовка' },
            ]} />
          </div>
        </div>

        {error && (
          <div className="card p-6 mb-6 text-center">
            <p className="text-error text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Повторить</button>
          </div>
        )}

        {subjects.length > 1 && (
          <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
            <label className="text-sm font-medium text-text-secondary">Предмет:</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="input !w-auto">
              <option value="">Все</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-sm font-medium text-text-secondary">Класс:</label>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="input !w-auto">
              <option value="">Все</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}

        {quizzes.length === 0 && !isLoading ? (
          <div className="card p-8 text-center">
            <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-text-secondary mb-2">Нет доступных билетов</p>
            <p className="text-sm text-text-secondary/60">На данный момент нет публичных тестов для подготовки.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {quizzes.map((quiz, idx) => {
              const sum = summary.get(quiz.id);
              const ticketMatch = quiz.title.match(/Билет\s+(\d+)/);
              const ticketNum = ticketMatch ? ticketMatch[1] : null;
              return (
                <div key={quiz.id} className="card card-hover p-5" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {ticketNum && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                            №{ticketNum}
                          </span>
                        )}
                        <span className="text-xs text-text-secondary bg-background px-2 py-0.5 rounded-md">
                          {quiz.subject} · {quiz.grade} класс
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-text-primary leading-snug mt-1">{quiz.title}</h3>
                      <p className="text-xs text-text-secondary/60 mt-1">{quiz.question_count} вопросов</p>
                      {sum && (
                        <p className="text-xs mt-1">
                          {sum.attempts > 0 ? (
                            <>
                              <span className="text-text-secondary">Попыток: {sum.attempts} · </span>
                              <span className="text-success font-medium">Лучший: {sum.last_score}/{sum.total_questions}</span>
                              {sum.last_score !== null && (
                                <span className="text-success/70 ml-1">
                                  ({percentageToGrade(Math.round((sum.last_score / sum.total_questions) * 100))}/10)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-text-secondary/40">Не пройден</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => navigate(`/student/practice/quiz/${quiz.id}?mode=practice`)}
                        className="btn-primary btn-sm">
                        Подготовка
                      </button>
                      <button onClick={() => navigate(`/student/practice/quiz/${quiz.id}?mode=exam`)}
                        className="btn-outline btn-sm">
                        Экзамен
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/student/quiz-entry')} className="btn-primary flex-1">Подключиться к тесту</button>
          <button onClick={() => navigate('/student/history')} className="btn-outline flex-1">Моя статистика</button>
        </div>
      </div>
    </div>
  );
};

export default StudentPractice;