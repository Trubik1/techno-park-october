import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';

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
    <div className="page-container flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        {isRegistered && <UserMenu role="student" />}
      </div>
      <div className="page-card animate-slideUp">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg shadow-primary/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Добро пожаловать в ClassQuiz!</h2>
          <p className="text-text-secondary mt-1">Введите данные для начала работы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ваше имя
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-]/g, ''))}
              placeholder="Например: Анна Петрова"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Тип</label>
            <div className="flex gap-2">
              {(['school', 'club', 'other'] as UserType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setUserType(t); setClassName(''); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all duration-200
                    ${userType === t
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-text-secondary hover:border-gray-300'}`}
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
            <div className="error-box animate-shake">
              <p className="error-text">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Регистрация...
              </span>
            ) : 'Начать работу'}
          </button>

          <p className="text-xs text-text-secondary/60 text-center">
            Ваши данные будут сохранены только в этом браузере и не будут переданы на сервер без вашего согласия.
          </p>
        </form>
      </div>
    </div>
  );
};

export default StudentEntry;
