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
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center"><div className="spinner-dots"><span></span><span></span><span></span></div></div>;
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
    <div className="min-h-[100dvh] bg-background animate-fadeIn">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <BackButton to="/student/entry" />
            </div>
            <button onClick={() => navigate('/student/practice')}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
              Подготовка
            </button>
          </div>
        <div className="card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-[0.5rem_1.5rem_0.5rem_1.5rem] bg-primary/8 border border-primary/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary font-heading">Подключение к тесту</h2>
            <p className="text-text-secondary mt-2 text-sm">Введите 4-значный код сессии, предоставленный вашим учителем</p>
          </div>

          <div className="bg-background rounded-[0.5rem_1.25rem_0.5rem_1.25rem] p-4 mb-6 text-center border border-border/60">
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

            <p className="text-xs text-text-secondary/50 text-center">
              Код сессии предоставляется вашим учителем перед началом теста.
            </p>
          </form>

        </div>
      </div>
    </div>
  );
};

export default StudentQuizEntry;
