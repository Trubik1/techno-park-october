import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import BackButton from '../components/BackButton';

interface Quiz {
  id: string; title: string; subject: string; grade: string;
  teacher_id: string; teacher_name: string; created_at: string;
  question_count: number; is_public: boolean;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const teacherData = localStorage.getItem('classquiz_teacher');
      if (!teacherData) { navigate('/teacher/login'); return; }
      const teacher = JSON.parse(teacherData);

      const res = await fetch('/api/quizzes/');
      if (!res.ok) throw new Error('Ошибка загрузки');

      const data: Quiz[] = await res.json();
      setQuizzes(data);
    } catch {
      setError('Не удалось загрузить список тестов.');
    } finally { setIsLoading(false); }
  }, [navigate]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  const subjects = useMemo(() => {
    return [...new Set(quizzes.map(q => q.subject))].sort();
  }, [quizzes]);

  const filteredQuizzes = (activeSubject
    ? quizzes.filter(q => q.subject === activeSubject)
    : quizzes
  ).filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading && quizzes.length === 0) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Загрузка тестов...</p>
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
          <button onClick={() => navigate('/teacher/login')} className="btn-primary w-full">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <div className="fixed top-14 left-3 z-40">
        <BackButton to="/teacher/login" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <UserMenu role="teacher" />
      </div>
      <div className="max-w-4xl mx-auto card animate-slideUp">
        <div className="gradient-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Панель управления учителя</h1>
              <p className="text-sm text-white/80 mt-1">Все тесты доступны всем учителям</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={() => navigate('/teacher/dashboard/create')} className="btn-sm bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors">
                + Создать тест
              </button>
              <button onClick={() => navigate('/teacher/dashboard/import')} className="btn-sm bg-white/20 text-white hover:bg-white/30 rounded-lg transition-colors">
                📥 Импортировать
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Все тесты</h2>
              {subjects.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setActiveSubject(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeSubject === null ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Все</button>
                  {subjects.map(s => (
                    <button key={s} onClick={() => setActiveSubject(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeSubject === s ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="input pl-10"
              />
            </div>
          </div>
          {quizzes.length === 0 ? (
            <div className="p-8 text-center animate-fadeIn">
              <p className="text-text-secondary">Тестов пока нет.</p>
              <p className="mt-2 text-sm text-text-secondary/60">Создайте или импортируйте первый тест.</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="p-8 text-center animate-fadeIn">
              <p className="text-text-secondary">Тесты не найдены. Попробуйте изменить параметры поиска.</p>
            </div>
          ) : (
          <div className="grid gap-4">
            {filteredQuizzes.map((quiz, index) => (
              <div key={quiz.id} className="card-hover border border-gray-100 animate-slideUp hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate">{quiz.title}</h3>
                      <p className="text-sm text-text-secondary"><span className="font-medium">{quiz.subject}</span> • {quiz.grade} класс • <span className="text-text-secondary/60">Автор: {quiz.teacher_name}</span></p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary shrink-0">{quiz.question_count} вопросов</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-sm text-text-secondary/60">
                      Создан: {new Date(quiz.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={async () => {
                          setStartingId(quiz.id);
                          try {
                            const res = await fetch(`/api/sessions/?quiz_id=${quiz.id}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'active' }),
                            });
                            if (!res.ok) { setError('Не удалось создать сессию'); return; }
                            const session = await res.json();
                            navigate(`/teacher/dashboard/session/${session.code}`);
                          } catch {
                            setError('Не удалось создать сессию');
                          } finally { setStartingId(null); }
                        }}
                        disabled={startingId !== null}
                        className="btn-sm btn-success flex-1 sm:flex-none disabled:opacity-50"
                      >
                        {startingId === quiz.id ? 'Запуск...' : '▶ Запустить'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button onClick={() => navigate('/teacher/login')} className="btn-primary w-full">
            ← На страницу входа
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
