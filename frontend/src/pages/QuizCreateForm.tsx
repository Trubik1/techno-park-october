import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';
import Breadcrumbs from '../components/Breadcrumbs';
import { downloadCsv } from '../utils/csvExport';

interface QuestionForm {
  id: number;
  text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct: string;
  explanation: string;
  [key: string]: string | number;
}

type Step = 'meta' | 'questions' | 'done';

const QuizCreateForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('meta');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [timerMode, setTimerMode] = useState<'quiz' | 'question'>('quiz');
  const [timeLimitQuiz, setTimeLimitQuiz] = useState(45);
  const [timeLimitQuestion, setTimeLimitQuestion] = useState(30);
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);

  useEffect(() => {
    const teacherData = localStorage.getItem('classquiz_teacher');
    if (!teacherData) return;
    const teacher = JSON.parse(teacherData);
    fetch('/api/quizzes/').then(r => r.json()).then((all: any[]) => {
      const subs = [...new Set(all.filter(q => q.teacher_id === teacher.id).map(q => q.subject))].sort();
      setExistingSubjects(subs);
    }).catch(() => {});
  }, []);

  const genId = () => Date.now() + Math.random();

  const handleStart = () => {
    const newErrors: Record<string, any> = {};
    if (!title.trim()) newErrors.title = 'Название теста обязательно';
    if (!subject.trim()) newErrors.subject = 'Предмет обязателен';
    if (!grade.trim()) newErrors.grade = 'Класс обязателен';
    if (questionCount < 1 || questionCount > 100) newErrors.questionCount = 'Количество вопросов от 1 до 100';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const count = Math.max(1, Math.min(100, questionCount));
    const generated: QuestionForm[] = Array.from({ length: count }, () => ({
      id: genId(),
      text: '', opt_a: '', opt_b: '', opt_c: '', opt_d: '',
      correct: 'a', explanation: '',
    }));
    setQuestions(generated);
    setStep('questions');
  };

  const dragIdx = useRef<number | null>(null);

  const handleQuestionChange = (id: number, field: string, value: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const moveQuestion = (from: number, to: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const validateQuestions = () => {
    const newErrors: Record<string, any> = {};
    questions.forEach((q) => {
      const qe: Record<string, string> = {};
      if (!q.text.trim()) qe.text = 'Текст вопроса обязателен';
      if (!q.opt_a.trim()) qe.opt_a = 'Вариант A обязателен';
      if (!q.opt_b.trim()) qe.opt_b = 'Вариант B обязателен';
      if (!q.opt_c.trim()) qe.opt_c = 'Вариант C обязателен';
      if (!q.opt_d.trim()) qe.opt_d = 'Вариант D обязателен';
      if (Object.keys(qe).length > 0) newErrors[`q_${q.id}`] = qe;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const downloadTemplate = () => {
    const rows = Array.from({ length: Math.max(1, questionCount) }, (_, i) => ({
      question: '',
      opt_a: '', opt_b: '', opt_c: '', opt_d: '',
      correct: '',
      explanation: '',
    }));
    const header = '# ClassQuiz - Шаблон теста\n# Заполните таблицу и импортируйте через "Импортировать"\n\n';
    const csv = header + [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')),
    ].join('\n');
    const safeTitle = title.trim() || 'template';
    downloadCsv(csv, `classquiz_template_${safeTitle}.csv`);
  };

  const downloadFilled = () => {
    if (questions.length === 0) return;
    const rows = questions.map(q => ({
      question: q.text,
      opt_a: q.opt_a, opt_b: q.opt_b, opt_c: q.opt_c, opt_d: q.opt_d,
      correct: q.correct,
      explanation: q.explanation,
    }));
    const safeTitle = title.trim().replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s_-]/g, '_') || 'quiz';
    const header = Object.keys(rows[0]).join(',');
    const csv = [
      header,
      ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    downloadCsv(csv, `classquiz_${safeTitle}.csv`);
  };

  const saveToBackend = async () => {
    if (!validateQuestions()) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const teacherData = localStorage.getItem('classquiz_teacher');
      if (!teacherData) { navigate('/teacher/login'); return; }
      const teacher = JSON.parse(teacherData);

      const quizPayload: Record<string, any> = {
        title: title.trim(), subject: subject.trim(), grade: grade.trim(), is_public: isPublic,
      };
      if (timerMode === 'quiz') {
        quizPayload.time_limit_quiz = timeLimitQuiz * 60;
        quizPayload.time_limit_question = null;
      } else {
        quizPayload.time_limit_quiz = null;
        quizPayload.time_limit_question = timeLimitQuestion;
      }
      const quizRes = await fetch(`/api/quizzes/?teacher_id=${teacher.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizPayload),
      });
      if (!quizRes.ok) throw new Error('Не удалось создать тест');
      const quiz = await quizRes.json();

      for (const q of questions) {
        const qRes = await fetch(`/api/questions/?quiz_id=${quiz.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: q.text,
            opt_a: q.opt_a, opt_b: q.opt_b, opt_c: q.opt_c, opt_d: q.opt_d,
            correct: q.correct,
            explanation: q.explanation || null,
          }),
        });
        if (!qRes.ok) throw new Error('Не удалось сохранить вопрос');
      }

      setSubmitSuccess(true);
      setStep('done');
    } catch (err: any) {
      setSaveError(err.message || 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepBar = (current: Step) => {
    const steps: { key: Step; label: string }[] = [
      { key: 'meta', label: 'Настройки' },
      { key: 'questions', label: 'Вопросы' },
      { key: 'done', label: 'Готово' },
    ];
    const idx = steps.findIndex(s => s.key === current);
    return (
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1.5 text-sm ${i <= idx ? 'text-primary font-semibold' : 'text-text-secondary/40'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= idx ? 'bg-primary text-white' : 'bg-background border border-border text-text-secondary'}`}>{i + 1}</span>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < idx ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (step === 'meta') {
    return (
      <div className="min-h-screen bg-background animate-fadeIn">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggleButton />
        </div>
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Breadcrumbs items={[
            { label: 'Вход учителя', path: '/teacher/login' },
            { label: 'Панель управления', path: '/teacher/dashboard' },
            { label: 'Создание теста' },
          ]} />
          <div className="card p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-text-primary font-heading">Создание теста</h1>
              <button onClick={() => navigate('/teacher/dashboard')} className="btn-ghost btn-sm">Отмена</button>
            </div>
            {stepBar('meta')}
            <div className="space-y-5">
              <div>
                <label className="label">Название теста</label>
                <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }} placeholder="Например: Математика: Дроби" className={`input ${errors.title ? 'input-error' : ''}`} autoFocus />
                {errors.title && <p className="error-text mt-1">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Предмет (вкладка)</label>
                  <div className="relative">
                    <input type="text" value={subject} onChange={e => { setSubject(e.target.value); setErrors(prev => ({ ...prev, subject: undefined })); }} placeholder="Например: История Беларуси" className={`input ${errors.subject ? 'input-error' : ''}`} list="subjects-list" />
                    <datalist id="subjects-list">
                      {existingSubjects.filter(s => s !== subject).map(s => (<option key={s} value={s} />))}
                    </datalist>
                  </div>
                  {errors.subject && <p className="error-text mt-1">{errors.subject}</p>}
                </div>
                <div>
                  <label className="label">Класс</label>
                  <select value={grade} onChange={e => { setGrade(e.target.value); setErrors(prev => ({ ...prev, grade: undefined })); }} className={`input ${errors.grade ? 'input-error' : ''}`}>
                    <option value="">Выберите класс</option>
                    {Array.from({length: 11}, (_, i) => String(i + 1)).map(g => <option key={g} value={g}>{g} класс</option>)}
                    <option value="доп занятия">Доп. занятия</option>
                  </select>
                  {errors.grade && <p className="error-text mt-1">{errors.grade}</p>}
                </div>
              </div>
              <div>
                <label className="label">Количество вопросов</label>
                <input type="number" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 10)} min={1} max={100} className="input" />
                {errors.questionCount && <p className="error-text mt-1">{errors.questionCount}</p>}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                <span className="text-sm text-text-secondary">Сделать тест публичным (доступен всем учителям)</span>
              </label>

              <div className="pt-4 border-t border-border">
                <label className="label">Ограничение по времени</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setTimerMode('quiz')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timerMode === 'quiz' ? 'bg-primary text-white shadow-sm' : 'border border-border text-text-secondary hover:bg-surface'}`}>На весь тест</button>
                  <button type="button" onClick={() => setTimerMode('question')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timerMode === 'question' ? 'bg-primary text-white shadow-sm' : 'border border-border text-text-secondary hover:bg-surface'}`}>На один вопрос</button>
                </div>
                {timerMode === 'quiz' ? (
                  <div className="flex items-center gap-3">
                    <input type="number" value={timeLimitQuiz} onChange={e => setTimeLimitQuiz(Math.max(1, parseInt(e.target.value) || 45))} min={1} max={180} className="input w-24" />
                    <span className="text-sm text-text-secondary">минут</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input type="number" value={timeLimitQuestion} onChange={e => setTimeLimitQuestion(Math.max(5, parseInt(e.target.value) || 30))} min={5} max={300} className="input w-24" />
                    <span className="text-sm text-text-secondary">секунд на вопрос</span>
                  </div>
                )}
              </div>

              <button onClick={handleStart} className="btn-primary w-full">Заполнить вопросы ({questionCount} шт.)</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-background animate-fadeIn">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggleButton />
        </div>
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="card p-8 md:p-10 text-center animate-scaleIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2 font-heading">«{title}»</h2>
            <p className="text-text-secondary mb-2">{subject} &bull; {grade} класс &bull; {questions.length} вопросов</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={downloadFilled} className="btn-primary">Скачать CSV</button>
              <button onClick={() => navigate('/teacher/dashboard')} className="btn-outline">В дашборд</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: genId(), text: '', opt_a: '', opt_b: '', opt_c: '', opt_d: '', correct: 'a', explanation: '' }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs items={[
          { label: 'Вход учителя', path: '/teacher/login' },
          { label: 'Панель управления', path: '/teacher/dashboard' },
          { label: 'Создание теста' },
        ]} />
        {stepBar('questions')}
        <div className="card">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h1 className="text-xl font-bold text-text-primary font-heading">{title}</h1>
            <button onClick={() => setStep('meta')} className="btn-ghost btn-sm">Изменить настройки</button>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary font-heading">Вопросы ({questions.length})</h2>
              <div className="flex gap-2">
                <button onClick={downloadTemplate} className="btn-outline btn-sm">Шаблон CSV</button>
                <button onClick={downloadFilled} className="btn-outline btn-sm">Скачать CSV</button>
              </div>
            </div>

            {saveError && <div className="error-box mb-4 animate-shake"><p className="error-text">{saveError}</p></div>}

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-2 py-2 w-8 text-xs font-medium text-text-secondary">#</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[200px]">Текст вопроса</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[120px]">A</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[120px]">B</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[120px]">C</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[120px]">D</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary w-16">✓</th>
                    <th className="px-2 py-2 text-xs font-medium text-text-secondary min-w-[100px]">Пояснение</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {questions.map((q, i) => {
                    const qe = errors[`q_${q.id}`] as Record<string, string> | undefined;
                    return (
                      <tr key={q.id}
                        draggable
                        onDragStart={() => { dragIdx.current = i; }}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={() => { if (dragIdx.current !== null && dragIdx.current !== i) { moveQuestion(dragIdx.current, i); } dragIdx.current = null; }}
                        onDragEnd={() => { dragIdx.current = null; }}
                        className={'hover:bg-background transition-colors ' + (dragIdx.current === i ? 'opacity-30' : '')}
                      >
                        <td className="px-2 py-1.5">
                          <span className="cursor-grab active:cursor-grabbing text-text-secondary/30 hover:text-text-secondary/60 transition-colors block text-center">
                            <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-xs text-text-secondary text-center font-mono">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          <textarea value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Текст вопроса..." rows={2} className={`input !text-sm !py-1 !px-2 resize-none ${qe?.text ? 'input-error' : ''}`} />
                          {qe?.text && <p className="error-text text-xs mt-0.5">{qe.text}</p>}
                        </td>
                        {(['a', 'b', 'c', 'd'] as const).map(letter => (
                          <td key={letter} className="px-2 py-1.5">
                            <input type="text" value={q[`opt_${letter}`]} onChange={e => handleQuestionChange(q.id, `opt_${letter}`, e.target.value)} placeholder={`Вар. ${letter.toUpperCase()}`} className={`input !text-sm !py-1 !px-2 ${qe?.[`opt_${letter}`] ? 'input-error' : ''}`} />
                            {qe?.[`opt_${letter}`] && <p className="error-text text-xs mt-0.5">{qe[`opt_${letter}`]}</p>}
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <select value={q.correct} onChange={e => handleQuestionChange(q.id, 'correct', e.target.value)} className="input !text-sm !py-1 !px-2 !w-14 text-center font-bold">
                            {(['a', 'b', 'c', 'd'] as const).map(letter => (
                              <option key={letter} value={letter}>{letter.toUpperCase()}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={q.explanation} onChange={e => handleQuestionChange(q.id, 'explanation', e.target.value)} placeholder="Пояснение" className="input !text-sm !py-1 !px-2" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => removeQuestion(q.id)} disabled={questions.length <= 1} className="text-text-secondary/40 hover:text-error transition-colors disabled:opacity-20" title="Удалить вопрос">
                            <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-center">
              <button onClick={addQuestion} className="btn-outline btn-sm">
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Добавить вопрос
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
              <button onClick={saveToBackend} disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white"></div>
                    Сохранение...
                  </span>
                ) : 'Сохранить тест'}
              </button>
              <button onClick={downloadFilled} className="btn-outline flex-1">Скачать CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreateForm;
