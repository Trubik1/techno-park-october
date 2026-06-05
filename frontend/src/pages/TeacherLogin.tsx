import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';

const TeacherLogin: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setError('Пожалуйста, введите PIN-код');
      return;
    }
    if (trimmedPin.length < 6) {
      setError('PIN-код должен содержать минимум 6 символов');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/teachers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmedPin }),
      });
      if (!response.ok) throw new Error('Неверный PIN-код');
      const teacherData = await response.json();
      localStorage.setItem('classquiz_teacher', JSON.stringify(teacherData));
      navigate('/teacher/dashboard');
    } catch {
      setError('Неверный PIN-код. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setError('Пожалуйста, введите PIN-код');
      return;
    }
    if (trimmedPin.length < 6) {
      setError('PIN-код должен содержать минимум 6 символов');
      return;
    }
    if (trimmedPin !== confirmPin.trim()) {
      setError('PIN-коды не совпадают');
      return;
    }
    setIsLoading(true);
    try {
      const body: Record<string, string> = { pin: trimmedPin };
      if (name.trim()) body.name = name.trim();
      const response = await fetch('/api/teachers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Не удалось создать учителя');
      }
      const teacherData = await response.json();
      localStorage.setItem('classquiz_teacher', JSON.stringify(teacherData));
      navigate('/teacher/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary font-heading">ClassQuiz</h1>
          <p className="text-text-secondary mt-2">Панель управления учителя</p>
        </div>

        <div className="card p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-text-primary font-heading">
              {isRegister ? 'Создать класс' : 'Вход для учителя'}
            </h2>
            <p className="text-text-secondary mt-2 text-sm">
              {isRegister
                ? 'Зарегистрируйтесь, чтобы создавать тесты'
                : 'Введите PIN-код для доступа к панели управления'}
            </p>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
            {isRegister && (
              <div>
                <label className="label">Ваше имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="input"
                  autoFocus
                />
              </div>
            )}
            <div>
              <label className="label">Ключ учителя</label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  maxLength={10}
                  className="input pr-12 text-center tracking-[0.25em] font-medium"
                  autoFocus={!isRegister}
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text-secondary transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {showPin ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            {isRegister && (
              <div>
                <label className="label">Подтвердите ключ учителя</label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••••"
                    maxLength={10}
                    className="input pr-12 text-center tracking-[0.25em] font-medium"
                  />
                  <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text-secondary transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {showConfirmPin ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-box">
                <p className="error-text">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white"></div>
                  {isRegister ? 'Создание...' : 'Вход...'}
                </span>
              ) : isRegister ? 'Создать класс' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <button onClick={() => navigate('/student/entry')} className="text-sm text-text-secondary hover:text-primary transition-colors">
              &larr; Войти как ученик
            </button>
            <div>
              <button onClick={() => { setIsRegister(!isRegister); setError(null); setName(''); setPin(''); setConfirmPin(''); }} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                {isRegister ? 'Уже есть аккаунт? Войти' : 'Создать новый класс'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
