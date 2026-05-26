import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleQuestionChange = (id: number, field: string, value: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
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

      const quizRes = await fetch(`/api/quizzes/?teacher_id=${teacher.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), subject: subject.trim(), grade: grade.trim() }),
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
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < idx ? 'bg-primary' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (step === 'meta') {
    return (
      <div className="page-container">
        <div className="max-w-2xl mx-auto card animate-slideUp">
          <div className="gradient-header">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Создание теста</h1>
              <button onClick={() => navigate('/teacher/dashboard')} className="text-sm text-white/80 hover:text-white">Отмена</button>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {stepBar('meta')}
            <div className="space-y-4">
              <div>
                <label className="label">Название теста</label>
                <input type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }} placeholder="Например: Математика: Дроби" className={`input ${errors.title ? 'input-error' : ''}`} autoFocus />
                {errors.title && <p className="error-text mt-1">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Предмет</label>
                  <input type="text" value={subject} onChange={e => { setSubject(e.target.value); setErrors(prev => ({ ...prev, subject: undefined })); }} placeholder="Например: Математика" className={`input ${errors.subject ? 'input-error' : ''}`} />
                  {errors.subject && <p className="error-text mt-1">{errors.subject}</p>}
                </div>
                <div>
                  <label className="label">Класс</label>
                  <select value={grade} onChange={e => { setGrade(e.target.value); setErrors(prev => ({ ...prev, grade: undefined })); }} className={`input ${errors.grade ? 'input-error' : ''}`}>
                    <option value="">Выберите класс</option>
                    {['5', '6', '7', '8', '9', '10', '11'].map(g => <option key={g} value={g}>{g} класс</option>)}
                  </select>
                  {errors.grade && <p className="error-text mt-1">{errors.grade}</p>}
                </div>
              </div>
              <div>
                <label className="label">Количество вопросов</label>
                <input type="number" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 10)} min={1} max={100} className="input" />
                {errors.questionCount && <p className="error-text mt-1">{errors.questionCount}</p>}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleStart} className="btn-primary flex-1">Заполнить вопросы ({questionCount} шт.)</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="page-container">
        <div className="max-w-2xl mx-auto card animate-scaleIn">
          <div className="gradient-header">
            <h1 className="text-2xl font-bold">Тест создан</h1>
          </div>
          <div className="p-6 md:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">"{title}"</h2>
            <p className="text-text-secondary mb-2">{subject} &bull; {grade} класс &bull; {questions.length} вопросов</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={downloadFilled} className="btn-primary">Скачать CSV</button>
              <button onClick={() => navigate('/teacher/dashboard')} className="btn-secondary">В дашборд</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto animate-slideUp">
        {stepBar('questions')}
        <div className="card">
          <div className="gradient-header">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">{title}</h1>
              <button onClick={() => setStep('meta')} className="text-sm text-white/80 hover:text-white">Изменить настройки</button>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Вопросы ({questions.length})</h2>
              <div className="flex gap-2">
                <button onClick={downloadTemplate} className="btn-secondary btn-sm">Шаблон CSV</button>
                <button onClick={downloadFilled} className="btn-secondary btn-sm">Скачать CSV</button>
              </div>
            </div>

            {saveError && <div className="error-box mb-4 animate-shake"><p className="error-text">{saveError}</p></div>}

            <div className="space-y-4">
              {questions.map((q, i) => {
                const qe = errors[`q_${q.id}`] as Record<string, string> | undefined;
                return (
                  <div key={q.id} className="card-hover border border-gray-100 p-5 animate-fadeIn">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Вопрос {i + 1}</h3>
                    <div className="space-y-3">
                      <textarea value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Текст вопроса..." rows={2} className={`input ${qe?.text ? 'input-error' : ''}`} />
                      {qe?.text && <p className="error-text text-xs">{qe.text}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['a', 'b', 'c', 'd'] as const).map(letter => (
                          <div key={letter}>
                            <label className="label">{letter.toUpperCase()}</label>
                            <input type="text" value={q[`opt_${letter}`]} onChange={e => handleQuestionChange(q.id, `opt_${letter}`, e.target.value)} placeholder={`Вариант ${letter.toUpperCase()}`} className={`input ${qe?.[`opt_${letter}`] ? 'input-error' : ''}`} />
                            {qe?.[`opt_${letter}`] && <p className="error-text text-xs">{qe[`opt_${letter}`]}</p>}
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="label">Правильный ответ</label>
                        <div className="flex gap-3">
                          {(['a', 'b', 'c', 'd'] as const).map(letter => (
                            <label key={letter} className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" value={letter} checked={q.correct === letter} onChange={e => handleQuestionChange(q.id, 'correct', e.target.value)} className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-text-primary">{letter.toUpperCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <input type="text" value={q.explanation} onChange={e => handleQuestionChange(q.id, 'explanation', e.target.value)} placeholder="Объяснение (необязательно)" className="input" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-100">
              <button onClick={saveToBackend} disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Сохранение...
                  </span>
                ) : 'Сохранить тест'}
              </button>
              <button onClick={downloadFilled} className="btn-secondary flex-1">Скачать CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreateForm;
