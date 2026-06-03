import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';
import { useToast } from '../components/Toast';

interface Quiz {
  id: string; title: string; subject: string; grade: string;
  teacher_id: string; teacher_name: string; created_at: string;
  question_count: number; is_public: boolean;
}

interface QuizEditForm {
  title: string; subject: string; grade: string;
  is_public: boolean;
}

const DeleteConfirmModal: React.FC<{ quizTitle: string; onConfirm: () => void; onClose: () => void }> = ({ quizTitle, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error/20 mb-3">
            <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary">Удалить тест?</h3>
          <p className="text-sm text-text-secondary mt-1">«{quizTitle.length > 50 ? quizTitle.slice(0, 50) + '…' : quizTitle}»</p>
          <p className="text-xs text-text-secondary/60 mt-2">Это действие нельзя отменить. Все вопросы, сессии и результаты будут удалены.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button onClick={onConfirm} className="btn-error flex-1">Удалить</button>
        </div>
      </div>
    </div>
  );
};

const QuizEditModal: React.FC<{ quiz: Quiz; onSave: () => void; onClose: () => void }> = ({ quiz, onSave, onClose }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<QuizEditForm>({
    title: quiz.title, subject: quiz.subject, grade: quiz.grade,
    is_public: quiz.is_public,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { showToast('Ошибка сохранения', 'error'); return; }
      showToast('Тест сохранён');
      onSave();
      onClose();
    } catch { showToast('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-lg w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-4">Редактировать тест</h2>
        <div className="space-y-4">
          <input className="input" placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Предмет" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <input className="input" placeholder="Класс" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded" />
            Публичный тест
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
};

interface ActiveSession {
  session_id: string; code: string; quiz_title: string;
  subject: string; grade: string; started_at: string;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'my' | 'public'>('my');
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Quiz | null>(null);
  const [sortBy, setSortBy] = useState<'ticket' | 'date' | 'title'>('ticket');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const teacherData = localStorage.getItem('classquiz_teacher');
      if (!teacherData) { navigate('/teacher/login'); return; }
      const teacher = JSON.parse(teacherData);

      const [myRes, publicRes, activeRes] = await Promise.all([
        fetch(`/api/quizzes/?teacher_id=${teacher.id}`),
        fetch('/api/quizzes/?public=true'),
        fetch(`/api/sessions/active/?teacher_id=${teacher.id}`),
      ]);
      if (!myRes.ok || !publicRes.ok) throw new Error('Ошибка загрузки');

      const myData: Quiz[] = await myRes.json();
      const publicData: Quiz[] = await publicRes.json();
      if (activeRes.ok) setActiveSessions(await activeRes.json());

      setMyQuizzes(myData);
      setPublicQuizzes(publicData.filter(q => q.teacher_id !== teacher.id));
    } catch {
      setError('Не удалось загрузить список тестов.');
    } finally { setIsLoading(false); }
  }, [navigate]);

  const handleDeleteQuiz = async (quizId: string) => {
    setDeletingId(quizId);
    setDeleteConfirm(null);
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
        if (!res.ok) { showToast('Ошибка удаления', 'error'); setDeletingId(null); return; }
        showToast('Тест удалён');
        setMyQuizzes(prev => prev.filter(q => q.id !== quizId));
      } catch { showToast('Ошибка удаления', 'error'); }
      finally { setDeletingId(null); }
    }, 300);
  };

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  const subjects = useMemo(() => {
    return [...new Set(myQuizzes.map(q => q.subject))].sort();
  }, [myQuizzes]);

  const sortQuizzes = (a: Quiz, b: Quiz) => {
    let cmp = 0;
    if (sortBy === 'ticket') {
      const ma = a.title.match(/Билет\s+(\d+)/);
      const mb = b.title.match(/Билет\s+(\d+)/);
      if (ma && mb) cmp = parseInt(ma[1]) - parseInt(mb[1]);
      else if (ma) cmp = -1;
      else if (mb) cmp = 1;
      else cmp = a.title.localeCompare(b.title);
    } else if (sortBy === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  };

  const filteredMyQuizzes = (activeSubject
    ? myQuizzes.filter(q => q.subject === activeSubject)
    : myQuizzes
  ).filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortQuizzes);

  const publicSubjects = useMemo(() => {
    return [...new Set(publicQuizzes.map(q => q.subject))].sort();
  }, [publicQuizzes]);

  const [publicSubject, setPublicSubject] = useState<string | null>(null);

  const filteredPublicQuizzes = (publicSubject
    ? publicQuizzes.filter(q => q.subject === publicSubject)
    : publicQuizzes
  ).filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortQuizzes);

  if (isLoading && myQuizzes.length === 0 && publicQuizzes.length === 0) {
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
      <div className="max-w-4xl mx-auto mb-2 px-1">
        <Breadcrumbs items={[
          { label: 'Вход учителя', path: '/teacher/login' },
          { label: 'Панель управления' },
        ]} />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <UserMenu role="teacher" />
      </div>
      <div className="max-w-4xl mx-auto card animate-slideUp">
        <div className="gradient-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Панель управления учителя</h1>
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
          <div className="flex gap-1 mt-4">
            <button onClick={() => setTab('my')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tab === 'my' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              Мои тесты
            </button>
            <button onClick={() => setTab('public')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tab === 'public' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              Общие тесты {publicQuizzes.length > 0 && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{publicQuizzes.length}</span>}
            </button>
          </div>
        </div>

        {activeSessions.length > 0 && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <h3 className="text-sm font-semibold text-white/90">Активные сессии</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSessions.map(s => (
                <button
                  key={s.session_id}
                  onClick={() => navigate(`/teacher/dashboard/session/${s.code}`)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  {s.quiz_title.length > 25 ? s.quiz_title.slice(0, 25) + '…' : s.quiz_title}
                  <span className="opacity-60 font-mono">{s.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(tab === 'my') && (
          <div className="p-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text-primary">Мои тесты</h2>
                  <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                    {([['ticket', '№'], ['title', 'А-Я'], ['date', '📅']] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setSortBy(key)} className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${sortBy === key ? 'bg-white dark:bg-gray-600 text-text-primary shadow-sm' : 'text-text-secondary/60 hover:text-text-secondary'}`}>{label}</button>
                    ))}
                    <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="px-1.5 py-0.5 text-xs text-text-secondary/60 hover:text-text-secondary" title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
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
            {myQuizzes.length === 0 ? (
              <div className="p-8 text-center animate-fadeIn">
                <p className="text-text-secondary">У вас пока нет созданных тестов.</p>
                <p className="mt-2 text-sm text-text-secondary/60">Нажмите кнопку выше, чтобы создать первый тест или импортировать его из файла.</p>
              </div>
            ) : filteredMyQuizzes.length === 0 ? (
              <div className="p-8 text-center animate-fadeIn">
                <p className="text-text-secondary">Тесты не найдены. Попробуйте изменить параметры поиска.</p>
              </div>
            ) : (
            <div className="grid gap-4">
              {filteredMyQuizzes.map((quiz, index) => (
                <div key={quiz.id} className={`card-hover border border-gray-100 animate-slideUp hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 ${deletingId === quiz.id ? 'opacity-20 scale-95 pointer-events-none' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary truncate">{quiz.title}</h3>
                        <p className="text-sm text-text-secondary"><span className="font-medium">{quiz.subject}</span> • {quiz.grade} класс</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary shrink-0">{quiz.question_count} вопросов</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-text-secondary/60">
                        <span>Создан: {new Date(quiz.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {quiz.is_public && <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success">Публичный</span>}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setEditingQuiz(quiz)}
                          disabled={startingId !== null}
                          className="btn-sm bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(quiz)}
                          disabled={deletingId !== null || startingId !== null}
                          className="btn-sm bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
                          title="Удалить"
                        >
                          🗑️
                        </button>
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
        )}

        {deleteConfirm && (
          <DeleteConfirmModal quizTitle={deleteConfirm.title} onConfirm={() => handleDeleteQuiz(deleteConfirm.id)} onClose={() => setDeleteConfirm(null)} />
        )}
        {editingQuiz && (
          <QuizEditModal quiz={editingQuiz} onSave={loadQuizzes} onClose={() => setEditingQuiz(null)} />
        )}

        {tab === 'public' && (
          <div className="p-6">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-text-primary">Общие тесты</h2>
                <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  {([['ticket', '№'], ['title', 'А-Я'], ['date', '📅']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setSortBy(key)} className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${sortBy === key ? 'bg-white dark:bg-gray-600 text-text-primary shadow-sm' : 'text-text-secondary/60 hover:text-text-secondary'}`}>{label}</button>
                  ))}
                  <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="px-1.5 py-0.5 text-xs text-text-secondary/60 hover:text-text-secondary" title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
                {publicSubjects.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => setPublicSubject(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${publicSubject === null ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Все</button>
                    {publicSubjects.map(s => (
                      <button key={s} onClick={() => setPublicSubject(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${publicSubject === s ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{s}</button>
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
            {publicQuizzes.length === 0 ? (
              <div className="p-8 text-center animate-fadeIn">
                <p className="text-text-secondary">Публичных тестов от других учителей пока нет.</p>
                <p className="mt-2 text-sm text-text-secondary/60">Создайте тест и сделайте его публичным, чтобы он появился здесь.</p>
              </div>
            ) : filteredPublicQuizzes.length === 0 ? (
              <div className="p-8 text-center animate-fadeIn">
                <p className="text-text-secondary">Тесты не найдены. Попробуйте изменить параметры поиска.</p>
              </div>
            ) : (
            <div className="grid gap-4">
              {filteredPublicQuizzes.map((quiz, index) => (
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
        )}

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
