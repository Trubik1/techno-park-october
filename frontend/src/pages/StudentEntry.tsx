import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';

type UserType = 'school' | 'club' | 'other';

const StudentEntry: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [className, setClassName] = useState('');
  const [userType, setUserType] = useState<UserType>('school');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { registerStudent, isRegistered } = useStudent();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRegistered) {
      navigate('/student/quiz-entry');
    }
  }, [isRegistered, navigate]);

  const typeLabels: Record<UserType, { label: string; placeholder: string }> = {
    school: { label: 'Класс', placeholder: 'Например: 8Б' },
    club: { label: 'Группа / Кружок', placeholder: 'Например: Робототехника' },
    other: { label: 'Направление', placeholder: 'Например: Самостоятельно' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const name = displayName.trim();
      const group = className.trim();
      if (!name || !group) {
        setError(`Пожалуйста, введите имя и укажите ${typeLabels[userType].label.toLowerCase()}`);
        return;
      }
      if (name.length < 2) {
        setError('Имя должно содержать минимум 2 символа');
        return;
      }
      if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s\-]+$/.test(name)) {
        setError('Имя может содержать только буквы, цифры, пробелы и дефис');
        return;
      }
      if (/^[0-9\s\-]+$/.test(name)) {
        setError('Имя не может состоять только из цифр');
        return;
      }
      const fullClass = `${group} · ${typeLabels[userType].label}`;
      const student = await registerStudent(name, fullClass);
      if (student) {
        navigate('/student/quiz-entry');
      } else {
        setError('Ошибка регистрации. Пожалуйста, попробуйте снова.');
      }
    } catch {
      setError('Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      {isRegistered && (
        <div className="fixed top-4 right-4 z-50">
          <UserMenu role="student" />
        </div>
      )}

      <div className="hidden lg:flex w-[45%] bg-primary relative items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-white font-heading text-4xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>ClassQuiz</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Проходите тесты, отслеживайте свои результаты и улучшайте знания в удобном формате.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">50+</p>
              <p className="text-white/60 text-sm mt-1">Вопросов</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">Мом.</p>
              <p className="text-white/60 text-sm mt-1">Результат</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold font-heading">Все</p>
              <p className="text-white/60 text-sm mt-1">Предметы</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-text-primary font-heading">ClassQuiz</h1>
            <p className="text-text-secondary mt-2">Добро пожаловать!</p>
          </div>

          <div className="card p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary font-heading">Добро пожаловать!</h2>
              <p className="text-text-secondary mt-2 text-sm">Введите данные для начала работы</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Ваше имя</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-]/g, ''))}
                  placeholder="Анна Петрова"
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Тип</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['school', 'club', 'other'] as UserType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setUserType(t); setClassName(''); }}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all duration-200
                        ${userType === t
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-text-secondary hover:border-primary/30'}`}
                    >
                      {t === 'school' ? '🏫 Школа' : t === 'club' ? '🧪 Кружок' : '🎯 Другое'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">{typeLabels[userType].label}</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-]/g, ''))}
                  placeholder={typeLabels[userType].placeholder}
                  className="input"
                />
              </div>

              {error && (
                <div className="error-box">
                  <p className="error-text">{error}</p>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white"></div>
                    Регистрация...
                  </span>
                ) : 'Начать работу'}
              </button>

              <p className="text-xs text-text-secondary/60 text-center">
                Ваши данные будут сохранены только в этом браузере.
              </p>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => navigate('/teacher/login')} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Войти как учитель →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEntry;
