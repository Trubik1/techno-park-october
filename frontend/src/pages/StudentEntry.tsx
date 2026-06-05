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
    <div className="min-h-[100dvh] bg-background animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      {isRegistered && (
        <div className="fixed top-4 right-4 z-50">
          <UserMenu role="student" />
        </div>
      )}

      <div className="relative px-6 pt-12 pb-8 md:pt-20 md:pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="max-w-2xl mx-auto relative z-10">
          <h1 className="text-text-primary font-heading text-3xl md:text-4xl font-semibold">ClassQuiz</h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed max-w-md mx-auto mt-2">
            Проходите тесты и отслеживайте результаты
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-10 pb-8">
        <div className="card p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-text-primary font-heading">Добро пожаловать!</h2>
            <p className="text-text-secondary mt-1 text-sm">Введите данные для начала работы</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                    className={`py-2.5 px-3 text-sm font-medium border transition-all duration-200
                      rounded-[0.4rem_1rem_0.4rem_1rem]
                      ${userType === t
                        ? 'border-primary bg-primary/8 text-primary'
                        : 'border-border/80 text-text-secondary hover:border-primary/30 hover:text-primary'}`}
                  >
                    {t === 'school' ? 'Школа' : t === 'club' ? 'Кружок' : 'Другое'}
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

            <p className="text-xs text-text-secondary/50 text-center">
              Ваши данные будут сохранены только в этом браузере.
            </p>
          </form>

          <div className="mt-5 text-center space-y-2">
            <div>
              <button onClick={() => navigate('/student/practice')} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Подготовка к билетам &rarr;
              </button>
            </div>
            <div>
              <button onClick={() => navigate('/teacher/login')} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Войти как учитель &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEntry;
