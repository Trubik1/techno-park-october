import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import BackButton from '../components/BackButton';

const StudentQuizEntry: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { student, isRegistered, isLoading } = useStudent();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="page-container flex items-center justify-center"><div className="spinner"></div></div>;
  }
  if (!isRegistered || !student) {
    return <Navigate to="/student/entry" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocalLoading(true);
    try {
      const code = sessionCode.trim().toUpperCase();
      if (!code) {
        setError('Пожалуйста, введите код сессии');
        return;
      }
      if (code.length !== 4 || !/^[A-Z0-9]+$/.test(code)) {
        setError('Код сессии должен состоять из 4 символов (буквы A-Z и цифры 0-9)');
        return;
      }
      const response = await fetch(`/api/sessions/${code}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Сессия не найдена. Проверьте код и попробуйте снова.');
        } else {
          setError('Ошибка проверки сессии. Пожалуйста, попробуйте снова.');
        }
        return;
      }
      const sessionData = await response.json();
      if (sessionData.status !== 'active') {
        setError('Эта сессия уже завершена или не активна.');
        return;
      }
      localStorage.setItem('current_session_code', code);
      navigate(`/student/quiz/${code}`);
    } catch {
      setError('Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center relative">
      <div className="fixed top-14 left-3 z-40">
        <BackButton to="/student/entry" />
      </div>
      <div className="absolute top-4 right-4">
        <UserMenu role="student" />
      </div>
      <div className="page-card animate-slideUp">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg shadow-primary/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Подключение к тесту</h2>
          <p className="text-text-secondary mt-1">Введите 4-значный код сессии, предоставленный вашим учителем</p>
          <div className="mt-4 p-3 bg-background rounded-lg">
            <p className="text-sm text-text-secondary">
              Привет, <span className="font-semibold text-text-primary">{student.display_name}</span>!
              Вы в классе <span className="font-semibold text-text-primary">{student.class_name}</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Ключ тестового мероприятия
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setSessionCode(value);
              }}
              maxLength={4}
              placeholder="A1B2"
              className="input text-center text-2xl font-bold tracking-[0.5em] uppercase"
              autoFocus
            />
          </div>

          {error && (
            <div className="error-box animate-shake">
              <p className="error-text">{error}</p>
            </div>
          )}

          <button type="submit" disabled={localLoading} className="btn-primary w-full">
            {localLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Подключение...
              </span>
            ) : 'Подключиться к тесту'}
          </button>

          <p className="text-xs text-text-secondary/60 text-center">
            Код сессии предоставляется вашим учителем перед началом теста.
          </p>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/student/entry')} className="text-sm text-text-secondary hover:text-primary transition-colors">
            ← Сменить имя или класс
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizEntry;
