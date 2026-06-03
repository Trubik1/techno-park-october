import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import BackButton from '../components/BackButton';
import ThemeToggleButton from '../components/ThemeToggleButton';
import PixelOtpInput from '../components/PixelOtpInput';

const StudentQuizEntry: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { student, isRegistered, isLoading } = useStudent();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="spinner"></div></div>;
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
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton to="/student/entry" />
        </div>
        <div className="card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary font-heading">Подключение к тесту</h2>
            <p className="text-text-secondary mt-2 text-sm">Введите 4-значный код сессии, предоставленный вашим учителем</p>
          </div>

          <div className="bg-background rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-text-secondary">
              Привет, <span className="font-semibold text-text-primary">{student.display_name}</span>!
              Вы в классе <span className="font-semibold text-text-primary">{student.class_name}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label text-center block">Ключ тестового мероприятия</label>
              <PixelOtpInput value={sessionCode} onChange={setSessionCode} length={4} />
            </div>

            {error && (
              <div className="error-box">
                <p className="error-text">{error}</p>
              </div>
            )}

            <button type="submit" disabled={localLoading} className="btn-primary w-full">
              {localLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white"></div>
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
    </div>
  );
};

export default StudentQuizEntry;
