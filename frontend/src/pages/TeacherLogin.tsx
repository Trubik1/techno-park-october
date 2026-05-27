import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const TeacherLogin: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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
    <div className="page-container flex items-center justify-center relative">
      <div className="fixed top-14 left-3 z-40">
        <BackButton to="/" />
      </div>
      <div className="page-card animate-slideUp">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mb-4 shadow-lg shadow-secondary/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">{isRegister ? 'Создать класс' : 'Вход для учителя'}</h2>
          <p className="text-text-secondary mt-1">
            {isRegister
              ? 'Зарегистрируйтесь, чтобы создавать тесты и управлять классом'
              : 'Введите ваше имя и PIN-код для доступа к панели управления'}
          </p>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <div>
              <label className="label">Ваше имя (необязательно)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Иван Иванов"
                className="input"
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="label flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4m-4-8a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              Ключ учителя
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              maxLength={10}
              className="input text-center tracking-widest font-bold"
            />
          </div>
          {isRegister && (
            <div>
              <label className="label flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Подтвердите ключ учителя
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••••"
                maxLength={10}
                className="input text-center tracking-widest font-bold"
              />
            </div>
          )}

          {error && (
            <div className="error-box animate-shake">
              <p className="error-text">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isRegister ? 'Создание...' : 'Вход...'}
              </span>
            ) : isRegister ? 'Создать класс' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {!isRegister && (
            <div className="text-center">
              <button onClick={() => navigate('/student/entry')} className="text-sm text-text-secondary hover:text-primary transition-colors">
                ← Войти как ученик
              </button>
            </div>
          )}
          <button onClick={() => { setIsRegister(!isRegister); setError(null); setName(''); setPin(''); setConfirmPin(''); }} className="text-sm text-primary hover:text-primary/80 transition-colors w-full text-center">
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Создать новый класс'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
