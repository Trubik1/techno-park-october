import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';

interface QuizHistoryItem {
  id: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

const StudentHistory: React.FC = () => {
  const { student, isLoading: isStudentLoading } = useStudent();
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStudentLoading) return;
    if (!student) { navigate('/student/entry'); return; }
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/results/student/' + student.id);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const items: QuizHistoryItem[] = data.map((r: any) => ({
          id: r.id,
          title: r.quiz_title || 'Тест',
          score: r.score,
          totalQuestions: r.total_questions,
          completedAt: r.completed_at,
        }));
        setHistory(items);
      } catch {
        setError('Не удалось загрузить историю тестов.');
      } finally { setIsLoading(false); }
    };
    loadHistory();
  }, [student, navigate, isStudentLoading]);

  if ((isLoading || isStudentLoading) && history.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card p-8 max-w-md mx-auto animate-scaleIn text-center">
          <div className="error-box mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button onClick={() => navigate('/student/entry')} className="btn-primary w-full">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  const totalQuestions = history.reduce((sum, item) => sum + item.totalQuestions, 0);
  const correctAnswers = history.reduce((sum, item) => sum + item.score, 0);
  const averageScore = history.length > 0 ? ((correctAnswers / totalQuestions) * 10).toFixed(2) : '0.00';
  const bestScore = history.length > 0 ? Math.round(Math.max(...history.map(item => (item.score / item.totalQuestions) * 100))) : 0;
  const worstScore = history.length > 0 ? Math.round(Math.min(...history.map(item => (item.score / item.totalQuestions) * 100))) : 0;
  const totalPercent = history.length > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const initials = student?.display_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-2 mb-6">
          <ThemeToggleButton />
          <BackButton to="/student/quiz-entry" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Профиль</h1>
            <Breadcrumbs items={[
              { label: 'Вход ученика', path: '/student/entry' },
              { label: 'История тестов' },
            ]} />
          </div>
        </div>

        <div className="card p-6 md:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold font-heading shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary font-heading">{student?.display_name || 'Ученик'}</h2>
              <p className="text-sm text-text-secondary">{student?.class_name || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-sm font-medium text-text-secondary">Всего тестов</p>
              <p className="text-2xl font-bold text-text-primary font-heading">{history.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-medium text-text-secondary">Средний балл</p>
              <p className="text-2xl font-bold text-text-primary font-heading">{averageScore}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-medium text-text-secondary">Лучший</p>
              <p className="text-2xl font-bold text-success font-heading">{bestScore}%</p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-medium text-text-secondary">Худший</p>
              <p className="text-2xl font-bold text-error font-heading">{worstScore}%</p>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-background">
              <p className="text-sm font-medium text-text-secondary mb-2">Общая статистика</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span className="text-text-primary">Ответов: <strong>{totalQuestions}</strong></span>
                <span className="text-text-primary">Верных: <strong className="text-success">{correctAnswers}</strong></span>
                <span className="text-text-primary">Ошибок: <strong className="text-error">{totalQuestions - correctAnswers}</strong></span>
                <span className="text-text-primary">Точность: <strong className={totalPercent >= 80 ? 'text-success' : totalPercent >= 60 ? 'text-warning' : 'text-error'}>{totalPercent}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="card p-8 text-center animate-fadeIn">
            <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-text-secondary">У вас пока нет пройденных тестов.</p>
            <p className="mt-2 text-sm text-text-secondary/60">Пройдите тест, чтобы увидеть результаты здесь.</p>
            <button onClick={() => navigate('/student/quiz-entry')} className="btn-primary mt-6">Подключиться к тесту</button>
          </div>
        ) : (
          <div className="card">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary font-heading">История тестов</h2>
            </div>
            <div className="p-6 grid gap-3">
              {history.map((item, index) => {
                const percentage = Math.round((item.score / item.totalQuestions) * 100);
                const badgeClasses = percentage >= 80
                  ? 'bg-success/10 text-success' : percentage >= 60
                  ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error';
                const barClasses = percentage >= 80 ? 'bg-success' : percentage >= 60 ? 'bg-warning' : 'bg-error';
                return (
                  <div key={item.id} className="card-hover p-5" style={{ animationDelay: `${index * 0.08}s` }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                      </div>
                      <span className={'px-3 py-1 text-xs font-bold rounded-full shrink-0 ' + badgeClasses}>{percentage}%</span>
                    </div>
                    <div className="h-2 bg-background rounded-full mb-3">
                      <div className={'h-full rounded-full transition-all duration-500 ' + barClasses} style={{ width: percentage + '%' }}></div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-text-secondary">
                      <span>Балл: <strong>{item.score}/{item.totalQuestions}</strong></span>
                      <span>{new Date(item.completedAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/student/quiz-entry')} className="btn-primary flex-1">Подключиться к тесту</button>
          <button onClick={() => navigate('/student/entry')} className="btn-outline flex-1">Сменить профиль</button>
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
