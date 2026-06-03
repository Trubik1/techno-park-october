import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
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
      <div className="page-container flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="page-card animate-scaleIn">
          <div className="error-box mb-4">
            <h3 className="font-bold text-text-primary mb-1">Ошибка</h3>
            <p className="text-text-secondary text-sm">{error}</p>
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
    <div className="page-container relative">
      <div className="fixed top-14 left-3 z-40">
        <BackButton to="/student/quiz-entry" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <UserMenu role="student" />
      </div>
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <Breadcrumbs items={[
          { label: 'Вход ученика', path: '/student/entry' },
          { label: 'История тестов' },
        ]} />
        <div className="card">
          <div className="gradient-header">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{student?.display_name || 'Ученик'}</h1>
                <p className="text-sm text-white/80">{student?.class_name || ''}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="stat-card">
                <p className="text-sm font-medium text-text-secondary">Всего тестов</p>
                <p className="text-2xl font-bold text-text-primary">{history.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm font-medium text-text-secondary">Средний балл</p>
                <p className="text-2xl font-bold text-text-primary">{averageScore}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm font-medium text-text-secondary">Лучший</p>
                <p className="text-2xl font-bold text-success">{bestScore}%</p>
              </div>
              <div className="stat-card">
                <p className="text-sm font-medium text-text-secondary">Худший</p>
                <p className="text-2xl font-bold text-error">{worstScore}%</p>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="px-6 pb-6">
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-sm font-medium text-text-secondary mb-2">Общая статистика</p>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <span className="text-text-primary">Ответов: <strong>{totalQuestions}</strong></span>
                  <span className="text-text-primary">Верных: <strong className="text-success">{correctAnswers}</strong></span>
                  <span className="text-text-primary">Ошибок: <strong className="text-error">{totalQuestions - correctAnswers}</strong></span>
                  <span className="text-text-primary">Точность: <strong className={totalPercent >= 80 ? 'text-success' : totalPercent >= 60 ? 'text-warning' : 'text-error'}>{totalPercent}%</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="card p-8 text-center animate-fadeIn">
            <p className="text-text-secondary">У вас пока нет пройденных тестов.</p>
            <p className="mt-2 text-sm text-text-secondary/60">Пройдите тест, чтобы увидеть результаты здесь.</p>
            <button onClick={() => navigate('/student/quiz-entry')} className="btn-primary mt-6">Подключиться к тесту</button>
          </div>
        ) : (
          <div className="card animate-slideUp">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">История тестов</h2>
            </div>
            <div className="p-6 grid gap-4">
              {history.map((item, index) => {
                const percentage = Math.round((item.score / item.totalQuestions) * 100);
                const badgeClasses = percentage >= 80
                  ? 'bg-success/10 text-success' : percentage >= 60
                  ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error';
                const barClasses = percentage >= 80 ? 'bg-success' : percentage >= 60 ? 'bg-warning' : 'bg-error';
                return (
                  <div key={item.id} className="card-hover border border-gray-100 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                        </div>
                        <span className={'px-3 py-1 text-xs font-bold rounded-full shrink-0 ' + badgeClasses}>{percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full mb-3">
                        <div className={'h-full rounded-full transition-all duration-500 ' + barClasses} style={{ width: percentage + '%' }}></div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-text-secondary">
                        <span>Балл: <strong>{item.score}/{item.totalQuestions}</strong></span>
                        <span>{new Date(item.completedAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/student/quiz-entry')} className="btn-primary flex-1">Подключиться к тесту</button>
          <button onClick={() => navigate('/student/entry')} className="btn-secondary flex-1">Сменить профиль</button>
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
