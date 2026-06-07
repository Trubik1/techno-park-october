import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../components/Toast';
import { percentageToGrade } from '../utils/grade';

interface QuizHistoryItem {
  id: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

const PinInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className="input pr-10" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} maxLength={10} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-text-secondary transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {show ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          )}
        </svg>
      </button>
    </div>
  );
};

const PinResetModal: React.FC<{ teacherId: string; teacherName: string; onClose: () => void }> = ({ teacherId, teacherName, onClose }) => {
  const { showToast } = useToast();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [name, setName] = useState(teacherName);
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
        body: JSON.stringify({ old_pin: oldPin, new_pin: newPin, name: name.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || 'Ошибка смены PIN'); return; }
      const updated = await res.json();
      localStorage.setItem('classquiz_teacher', JSON.stringify(updated));
      showToast('Данные обновлены');
      onClose();
    } catch { setError('Ошибка смены PIN'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="card-glass p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="space-y-3">
          <input className="input" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          <PinInput value={oldPin} onChange={setOldPin} placeholder="Старый PIN" />
          <PinInput value={newPin} onChange={setNewPin} placeholder="Новый PIN (6-10 символов)" />
          <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Подтвердите новый PIN" />
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">Отмена</button>
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
    <div className="absolute top-12 right-0 w-64 rounded-[0.75rem_1.5rem_0.75rem_1.5rem] shadow-studio-lg overflow-hidden animate-scaleIn z-50 card-glass">
      <div className="p-4 border-b border-border/60">
        <p className="font-semibold text-text-primary">{teacher?.name || 'Учитель'}</p>
        <p className="text-xs text-text-secondary mt-0.5">Учитель</p>
      </div>
      <div className="p-2">
        <button onClick={() => { setShowPinReset(true); }} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Сменить PIN
        </button>
      </div>
      <div className="p-2 border-t border-border/60">
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-error hover:bg-error/5 transition-colors">
          Выйти из аккаунта
        </button>
      </div>
      {showPinReset && teacher && (
        <PinResetModal teacherId={teacher.id} teacherName={teacher.name || ''} onClose={() => { setShowPinReset(false); window.location.reload(); }} />
      )}
    </div>
  );
};

const EditProfileModal: React.FC<{ student: { id: string; display_name: string; class_name: string }; onClose: () => void }> = ({ student, onClose }) => {
  const { showToast } = useToast();
  const { updateStudent } = useStudent();
  const [name, setName] = useState(student.display_name);
  const [className, setClassName] = useState(student.class_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!name.trim() || !className.trim()) { setError('Заполните все поля'); return; }
    setSaving(true);
    try {
      const updated = await updateStudent(name.trim(), className.trim());
      if (updated) {
        showToast('Данные обновлены');
        onClose();
      } else {
        setError('Ошибка обновления');
      }
    } catch { setError('Ошибка обновления'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="card-glass p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text-primary mb-4 font-heading">Редактировать профиль</h3>
        <div className="space-y-3">
          <input className="input" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          <input className="input" placeholder="Класс" value={className} onChange={e => setClassName(e.target.value)} maxLength={50} />
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">Отмена</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
};

const StudentMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { student, clearStudent } = useStudent();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (student) {
      const saved = localStorage.getItem(`classquiz_history_${student.id}`);
      if (saved) try { setHistory(JSON.parse(saved)); } catch { }
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
    <div className="absolute top-12 right-0 w-72 rounded-[0.75rem_1.5rem_0.75rem_1.5rem] shadow-studio-lg overflow-hidden animate-scaleIn z-50 card-glass">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.3rem_1rem_0.3rem_1rem] bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{student?.display_name || 'Ученик'}</p>
            <p className="text-xs text-text-secondary">{student?.class_name || ''}</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-border/60">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] bg-background">
            <p className="text-lg font-bold text-text-primary">{totalTests}</p>
            <p className="text-xs text-text-secondary">Тестов</p>
          </div>
          <div className="text-center p-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] bg-background">
            <p className={`text-lg font-bold ${avgPercent >= 80 ? 'text-success' : avgPercent >= 60 ? 'text-warning' : 'text-error'}`}>
              {avgPercent}%
            </p>
            <p className="text-xs text-text-secondary">Верных</p>
            <p className={`text-xs font-semibold mt-0.5 ${avgPercent >= 80 ? 'text-success' : avgPercent >= 60 ? 'text-warning' : 'text-error'}`}>
              Оценка: {percentageToGrade(avgPercent)}/10
            </p>
          </div>
        </div>
      </div>

      <div className="p-2 border-b border-border/60">
        <button onClick={() => { onClose(); navigate('/student/history'); }} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm font-medium text-text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          Профиль и статистика
        </button>
        <button onClick={() => setShowEdit(true)} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-text-primary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Сменить имя или класс
        </button>
        <button onClick={() => { onClose(); navigate('/teacher/login'); }} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-text-secondary hover:bg-primary/5 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Войти как учитель
        </button>
      </div>

      <div className="p-2">
        <button onClick={handleClearData} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-warning hover:bg-warning/5 transition-colors">
          Очистить данные
        </button>
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-[0.3rem_0.75rem_0.3rem_0.75rem] text-sm text-error hover:bg-error/5 transition-colors">
          Выйти
        </button>
      </div>
      {showEdit && student && (
        <EditProfileModal student={{ id: student.id, display_name: student.display_name, class_name: student.class_name }} onClose={() => setShowEdit(false)} />
      )}
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
        className="w-9 h-9 rounded-[0.3rem_0.9rem_0.3rem_0.9rem] bg-primary flex items-center justify-center text-white text-sm font-bold shadow-studio hover:shadow-studio-hover transition-all active:scale-95"
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
