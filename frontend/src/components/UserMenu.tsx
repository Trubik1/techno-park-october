import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';

interface QuizHistoryItem {
  id: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

const PinResetModal: React.FC<{ teacherId: string; onClose: () => void }> = ({ teacherId, onClose }) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (newPin.length < 6 || newPin.length > 10) { setError('PIN должен быть от 6 до 10 символов'); return; }
    if (newPin !== confirmPin) { setError('PIN-коды не совпадают'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || 'Ошибка смены PIN'); return; }
      alert('PIN-код успешно изменён!');
      onClose();
    } catch { setError('Ошибка смены PIN'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text-primary mb-4">Сменить PIN-код</h3>
        <div className="space-y-3">
          <input type="password" className="input" placeholder="Старый PIN" value={oldPin} onChange={e => setOldPin(e.target.value)} maxLength={10} />
          <input type="password" className="input" placeholder="Новый PIN (6-10 символов)" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={10} />
          <input type="password" className="input" placeholder="Подтвердите новый PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={10} />
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button onClick={handleReset} disabled={saving} className="btn-primary flex-1">{saving ? 'Сохранение...' : 'Сменить'}</button>
        </div>
      </div>
    </div>
  );
};

const TeacherMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [showPinReset, setShowPinReset] = useState(false);
  let teacherData: string | null = null;
  try { teacherData = localStorage.getItem('classquiz_teacher'); } catch { teacherData = null; }
  let teacher = null;
  try { teacher = teacherData ? JSON.parse(teacherData) : null; } catch { teacher = null; }

  const handleLogout = () => {
    localStorage.removeItem('classquiz_teacher');
    onClose();
    navigate('/teacher/login');
  };

  return (
    <div className="absolute top-12 right-0 w-64 bg-surface rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scaleIn z-50">
      <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-text-primary">{teacher?.name || 'Учитель'}</p>
        <p className="text-xs text-text-secondary mt-0.5">Учитель</p>
      </div>
      <div className="p-2">
        <button onClick={() => { setShowPinReset(true); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Сменить PIN
        </button>
      </div>
      <div className="p-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-error hover:bg-error/5 transition-colors">
          Выйти из аккаунта
        </button>
      </div>
      {showPinReset && teacher && (
        <PinResetModal teacherId={teacher.id} onClose={() => setShowPinReset(false)} />
      )}
    </div>
  );
};

const StudentMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { student, clearStudent } = useStudent();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  useEffect(() => {
    if (student) {
      const saved = localStorage.getItem(`classquiz_history_${student.id}`);
      if (saved) try { setHistory(JSON.parse(saved)); } catch { /* corrupted data */ }
    }
  }, [student]);

  const totalTests = history.length;
  const avgPercent = totalTests > 0
    ? Math.round((history.reduce((sum, item) => sum + item.score, 0) / history.reduce((sum, item) => sum + item.totalQuestions, 0)) * 100)
    : 0;

  const handleClearData = () => {
    if (!window.confirm('Очистить все данные? Это удалит историю тестов и данные профиля.')) return;
    if (student) localStorage.removeItem(`classquiz_history_${student.id}`);
    localStorage.removeItem('current_session_code');
    clearStudent();
    onClose();
    navigate('/student/entry');
  };

  const handleLogout = () => {
    clearStudent();
    onClose();
    navigate('/student/entry');
  };

  const initials = student?.display_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="absolute top-12 right-0 w-72 bg-surface rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scaleIn z-50">
      <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{student?.display_name || 'Ученик'}</p>
            <p className="text-xs text-text-secondary">{student?.class_name || ''}</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-background/50">
            <p className="text-lg font-bold text-text-primary">{totalTests}</p>
            <p className="text-xs text-text-secondary">Тестов</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <p className={`text-lg font-bold ${avgPercent >= 80 ? 'text-success' : avgPercent >= 60 ? 'text-warning' : 'text-error'}`}>
              {avgPercent}%
            </p>
            <p className="text-xs text-text-secondary">Верных</p>
          </div>
        </div>
      </div>

      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
        <button onClick={() => { onClose(); navigate('/student/history'); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Профиль и статистика
        </button>
        <button onClick={() => { onClose(); navigate('/teacher/login'); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Войти как учитель
        </button>
      </div>

      <div className="p-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={handleClearData} className="w-full text-left px-3 py-2 rounded-lg text-sm text-warning hover:bg-warning/5 transition-colors">
          Очистить данные
        </button>
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-error hover:bg-error/5 transition-colors">
          Выйти
        </button>
      </div>
    </div>
  );
};

interface UserMenuProps {
  role: 'student' | 'teacher';
}

const UserMenu: React.FC<UserMenuProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const studentCtx = useStudent();
  const student = role === 'student' ? studentCtx.student : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const teacherData = localStorage.getItem('classquiz_teacher');
  let teacher = null;
  try { teacher = role === 'teacher' && teacherData ? JSON.parse(teacherData) : null; } catch { teacher = null; }

  const initials = role === 'student'
    ? student?.display_name?.charAt(0)?.toUpperCase() || '?'
    : teacher?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95"
      >
        {initials}
      </button>
      {isOpen && (
        role === 'student'
          ? <StudentMenu onClose={() => setIsOpen(false)} />
          : <TeacherMenu onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default UserMenu;
