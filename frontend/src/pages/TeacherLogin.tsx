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
    <div className="min-h-screen bg-background flex animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>

      <div className="hidden lg:flex w-[45%] bg-primary mesh-gradient relative items-center justify-center p-12">
        <div className="absolute top-8 right-12 w-24 h-24 border border-white/10 rounded-full"></div>
        <div className="absolute bottom-16 left-8 w-16 h-16 border border-white/10 rounded-full"></div>
        <div className="text-center max-w-md relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-8" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-white font-heading text-4xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>ClassQuiz</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Создавайте тесты, проводите опросы и отслеживайте успеваемость вашего класса в реальном времени.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">25+</p>
              <p className="text-white/60 text-sm mt-1">Готовых тестов</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">1-11</p>
              <p className="text-white/60 text-sm mt-1">Классы</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">100%</p>
              <p className="text-white/60 text-sm mt-1">Бесплатно</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-text-primary font-heading">ClassQuiz</h1>
            <p className="text-text-secondary mt-2">Панель управления учителя</p>
          </div>

          <div className="card p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary font-heading">
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
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary transition-colors text-lg">
                    {showPin ? '🙈' : '👁️'}
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
                    <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary transition-colors text-lg">
                      {showConfirmPin ? '🙈' : '👁️'}
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
                ← Войти как ученик
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
    </div>
  );
};

export default TeacherLogin;
