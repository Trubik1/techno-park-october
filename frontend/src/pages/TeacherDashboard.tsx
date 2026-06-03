import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl border border-error/30 p-6 max-w-sm w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-error/10 mb-4">
            <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary font-heading">Удалить тест?</h3>
          <p className="text-sm text-text-secondary mt-2">«{quizTitle.length > 50 ? quizTitle.slice(0, 50) + '…' : quizTitle}»</p>
          <p className="text-xs text-text-secondary/60 mt-2">Это действие нельзя отменить. Все вопросы, сессии и результаты будут удалены.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Отмена</button>
          <button onClick={onConfirm} className="btn-danger flex-1">Удалить</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl border border-border p-6 max-w-lg w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-text-primary mb-4 font-heading">Редактировать тест</h2>
        <div className="space-y-4">
          <input className="input" placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="Предмет" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <input className="input" placeholder="Класс" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary/30" />
            Публичный тест
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">Отмена</button>
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
  const myGridRef = useRef<HTMLDivElement>(null);
  const [myRevealed, setMyRevealed] = useState(false);
  const pubGridRef = useRef<HTMLDivElement>(null);
  const [pubRevealed, setPubRevealed] = useState(false);

  useEffect(() => {
    setMyRevealed(false);
    setPubRevealed(false);
  }, [tab]);

  useEffect(() => {
    const el = myGridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMyRevealed(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab]);

  useEffect(() => {
    const el = pubGridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPubRevealed(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab]);

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
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary animate-pulse">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card p-8 max-w-md mx-auto animate-scaleIn text-center">
          <div className="error-box mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button onClick={() => navigate('/teacher/login')} className="btn-primary w-full">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="teacher" />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-2 mb-6">
          <ThemeToggleButton />
          <BackButton to="/teacher/login" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Панель управления</h1>
            <Breadcrumbs items={[
              { label: 'Вход учителя', path: '/teacher/login' },
              { label: 'Панель управления' },
            ]} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
            <button onClick={() => setTab('my')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'my' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
              Мои тесты
            </button>
            <button onClick={() => setTab('public')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'public' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
              Общие тесты {publicQuizzes.length > 0 && <span className="ml-1.5 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">{publicQuizzes.length}</span>}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/teacher/dashboard/create')} className="btn-primary btn-sm">
              + Создать
            </button>
            <button onClick={() => navigate('/teacher/dashboard/import')} className="btn-outline btn-sm">
              📥 Импорт
            </button>
          </div>
        </div>

        {activeSessions.length > 0 && (
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <h3 className="text-sm font-semibold text-text-primary font-heading">Активные сессии</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSessions.map(s => (
                <button
                  key={s.session_id}
                  onClick={() => navigate(`/teacher/dashboard/session/${s.code}`)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  {s.quiz_title.length > 30 ? s.quiz_title.slice(0, 30) + '…' : s.quiz_title}
                  <span className="opacity-60 font-mono">{s.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'my' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary font-heading">Мои тесты</h2>
                <div className="flex gap-0.5 bg-surface border border-border rounded-lg p-0.5">
                  {([['ticket', '№'], ['title', 'А-Я'], ['date', '📅']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setSortBy(key)} className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${sortBy === key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary/60 hover:text-text-secondary'}`}>{label}</button>
                  ))}
                  <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="px-1.5 py-0.5 text-xs text-text-secondary/60 hover:text-text-secondary" title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setActiveSubject(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeSubject === null ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface border border-border'}`}>Все</button>
                {subjects.map(s => (
                  <button key={s} onClick={() => setActiveSubject(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeSubject === s ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface border border-border'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по названию..." className="input pl-9" />
            </div>

            {myQuizzes.length === 0 ? (
              <div className="card p-8 text-center animate-fadeIn">
                <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-text-secondary">У вас пока нет созданных тестов.</p>
                <p className="mt-2 text-sm text-text-secondary/60">Нажмите «Создать» или «Импорт», чтобы добавить первый тест.</p>
              </div>
            ) : filteredMyQuizzes.length === 0 ? (
              <div className="card p-8 text-center animate-fadeIn">
                <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-text-secondary">Тесты не найдены. Попробуйте изменить параметры поиска.</p>
              </div>
            ) : (
              <div ref={myGridRef} className="grid gap-3">
                {filteredMyQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className={`card-hover p-5 ${deletingId === quiz.id ? 'opacity-20 scale-95 pointer-events-none' : ''} ${myRevealed ? 'animate-rise' : 'opacity-0 translate-y-6'}`} style={{ animationDelay: `${index * 0.06}s` }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text-primary truncate">{quiz.title}</h3>
                        <p className="text-sm text-text-secondary mt-0.5">{quiz.subject} · {quiz.grade} класс</p>
                      </div>
                      <span className="chip shrink-0">{quiz.question_count} вопросов</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-text-secondary/60">
                        <span>{new Date(quiz.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {quiz.is_public && <span className="badge bg-success/10 text-success">Публичный</span>}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => setEditingQuiz(quiz)} disabled={startingId !== null} className="btn-ghost btn-sm" title="Редактировать">✏️</button>
                        <button onClick={() => setDeleteConfirm(quiz)} disabled={deletingId !== null || startingId !== null} className="btn-ghost btn-sm !text-error hover:!bg-error/5" title="Удалить">🗑️</button>
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
                            } catch { setError('Не удалось создать сессию'); }
                            finally { setStartingId(null); }
                          }}
                          disabled={startingId !== null}
                          className="btn-success btn-sm"
                        >
                          {startingId === quiz.id ? 'Запуск...' : '▶ Запустить'}
                        </button>
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
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary font-heading">Общие тесты</h2>
                <div className="flex gap-0.5 bg-surface border border-border rounded-lg p-0.5">
                  {([['ticket', '№'], ['title', 'А-Я'], ['date', '📅']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setSortBy(key)} className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${sortBy === key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary/60 hover:text-text-secondary'}`}>{label}</button>
                  ))}
                  <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="px-1.5 py-0.5 text-xs text-text-secondary/60 hover:text-text-secondary" title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              {publicSubjects.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setPublicSubject(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${publicSubject === null ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface border border-border'}`}>Все</button>
                  {publicSubjects.map(s => (
                    <button key={s} onClick={() => setPublicSubject(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${publicSubject === s ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface border border-border'}`}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по названию..." className="input pl-9" />
            </div>

            {publicQuizzes.length === 0 ? (
              <div className="card p-8 text-center animate-fadeIn">
                <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-text-secondary">Публичных тестов от других учителей пока нет.</p>
                <p className="mt-2 text-sm text-text-secondary/60">Создайте тест и сделайте его публичным.</p>
              </div>
            ) : filteredPublicQuizzes.length === 0 ? (
              <div className="card p-8 text-center animate-fadeIn">
                <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-text-secondary">Тесты не найдены. Попробуйте изменить параметры поиска.</p>
              </div>
            ) : (
              <div ref={pubGridRef} className="grid gap-3">
                {filteredPublicQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className={`card-hover p-5 ${pubRevealed ? 'animate-rise' : 'opacity-0 translate-y-6'}`} style={{ animationDelay: `${index * 0.06}s` }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text-primary truncate">{quiz.title}</h3>
                        <p className="text-sm text-text-secondary mt-0.5">{quiz.subject} · {quiz.grade} класс · Автор: {quiz.teacher_name}</p>
                      </div>
                      <span className="chip shrink-0">{quiz.question_count} вопросов</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-sm text-text-secondary/60">
                        {new Date(quiz.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })}
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
                            } catch { setError('Не удалось создать сессию'); }
                            finally { setStartingId(null); }
                          }}
                          disabled={startingId !== null}
                          className="btn-success btn-sm"
                        >
                          {startingId === quiz.id ? 'Запуск...' : '▶ Запустить'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
