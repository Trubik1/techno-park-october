import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleButton from '../components/ThemeToggleButton';
import Breadcrumbs from '../components/Breadcrumbs';

interface QuestionPreview {
  text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; explanation: string | null;
}

interface QuizImportPreview {
  success: boolean; message: string; questions_count: number;
  questions: QuestionPreview[]; errors: string[];
}

const QuizImportForm: React.FC = () => {
  const navigate = useNavigate();
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current); }, []);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState('');
  const [quizGrade, setQuizGrade] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [timerMode, setTimerMode] = useState<'quiz' | 'question'>('quiz');
  const [timeLimitQuiz, setTimeLimitQuiz] = useState(45);
  const [timeLimitQuestion, setTimeLimitQuestion] = useState(30);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<QuizImportPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xls', 'xlsx'].includes(ext || '')) {
        setUploadError('Неправильный формат');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
      setUploadError(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) { setUploadError('Пожалуйста, выберите файл для загрузки'); return; }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/quizzes/import/preview', { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Ошибка предпросмотра'); }
      setPreviewData(await res.json());
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!quizTitle.trim() || !quizSubject.trim() || !quizGrade.trim()) { setUploadError('Заполните анкету до конца'); return; }
    if (!previewData || !previewData.success) { setUploadError('Невозможно импортировать тест без успешного предварительного просмотра'); return; }
    setIsImporting(true);
    setUploadError(null);
    try {
      const teacherData = localStorage.getItem('classquiz_teacher');
      if (!teacherData) { navigate('/teacher/login'); return; }
      let teacher;
      try { teacher = JSON.parse(teacherData); } catch { throw new Error('Повреждённые данные учителя'); }

      const quizPayload: Record<string, any> = { title: quizTitle.trim(), subject: quizSubject.trim(), grade: quizGrade.trim(), is_public: isPublic };
      if (timerMode === 'quiz') {
        quizPayload.time_limit_quiz = timeLimitQuiz * 60;
        quizPayload.time_limit_question = null;
      } else {
        quizPayload.time_limit_quiz = null;
        quizPayload.time_limit_question = timeLimitQuestion;
      }
      const res = await fetch(`/api/quizzes/import/confirm?teacher_id=${teacher.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_data: quizPayload, questions: previewData.questions }),
      });
      if (!res.ok) {
        let errMsg = 'Ошибка импорта';
        try { const err = await res.json(); errMsg = err.detail || errMsg; } catch {}
        throw new Error(errMsg);
      }
      setImportSuccess(true);
      navigateTimeoutRef.current = setTimeout(() => navigate('/teacher/dashboard'), 2000);
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка импорта');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggleButton />
      </div>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Breadcrumbs items={[
          { label: 'Вход учителя', path: '/teacher/login' },
          { label: 'Панель управления', path: '/teacher/dashboard' },
          { label: 'Импорт теста' },
        ]} />
        <div className="card p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-primary font-heading">Импорт теста из файла</h1>
            <button onClick={() => navigate('/teacher/dashboard')} className="btn-ghost btn-sm">Отмена</button>
          </div>

          <form className="space-y-6" onSubmit={e => { e.preventDefault(); handlePreview(); }}>
            <div className="space-y-5">
              <div>
                <label className="label">Название теста</label>
                <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Например: Математика: Дроби" className="input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Предмет (вкладка)</label>
                  <input type="text" value={quizSubject} onChange={(e) => setQuizSubject(e.target.value)} placeholder="Например: История Беларуси" className="input" list="subjects-import-list" />
                  <datalist id="subjects-import-list">
                    {existingSubjects.filter(s => s !== quizSubject).map(s => (<option key={s} value={s} />))}
                  </datalist>
                </div>
                <div>
                  <label className="label">Класс</label>
                  <select value={quizGrade} onChange={(e) => setQuizGrade(e.target.value)} className="input">
                    <option value="">Выберите класс</option>
                    {Array.from({length: 11}, (_, i) => String(i + 1)).map(g => <option key={g} value={g}>{g} класс</option>)}
                    <option value="доп занятия">Доп. занятия</option>
                  </select>
                </div>
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
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-bold text-text-primary mb-4 font-heading">Загрузка файла с вопросами</h2>
              <p className="text-sm text-text-secondary mb-4">Поддерживаемые форматы: CSV, XLS, XLSX. Колонки: вопрос, вариант a/b/c/d, правильный ответ (a/b/c/d), объяснение.</p>

              <div className="rounded-xl border border-border overflow-hidden bg-surface mb-4">
                <div className="p-3 bg-background border-b border-border text-xs font-medium text-text-secondary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Пример оформления таблицы
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Вопрос<br/><span className="text-text-secondary/50">(question)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант A<br/><span className="text-text-secondary/50">(opt_a)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант B<br/><span className="text-text-secondary/50">(opt_b)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант C<br/><span className="text-text-secondary/50">(opt_c)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант D<br/><span className="text-text-secondary/50">(opt_d)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Правильный<br/><span className="text-text-secondary/50">(correct)</span></th>
                        <th className="px-3 py-2 text-left font-medium text-text-secondary">Пояснение<br/><span className="text-text-secondary/50">(explanation)</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="bg-surface hover:bg-background transition-colors">
                        <td className="px-3 py-2 text-text-primary">Сколько будет 2+2?</td>
                        <td className="px-3 py-2 text-text-primary">3</td>
                        <td className="px-3 py-2 text-text-primary">4</td>
                        <td className="px-3 py-2 text-text-primary">5</td>
                        <td className="px-3 py-2 text-text-primary">6</td>
                        <td className="px-3 py-2 font-bold text-success">b</td>
                        <td className="px-3 py-2 text-text-secondary">2+2=4</td>
                      </tr>
                      <tr className="bg-surface hover:bg-background transition-colors">
                        <td className="px-3 py-2 text-text-primary">Столица Франции?</td>
                        <td className="px-3 py-2 text-text-primary">Лондон</td>
                        <td className="px-3 py-2 text-text-primary">Берлин</td>
                        <td className="px-3 py-2 text-text-primary">Париж</td>
                        <td className="px-3 py-2 text-text-primary">Мадрид</td>
                        <td className="px-3 py-2 font-bold text-success">c</td>
                        <td className="px-3 py-2 text-text-secondary"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer min-h-[140px] grid place-content-center">
                <input type="file" id="file-input" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
                <label htmlFor="file-input" className="cursor-pointer block mx-auto max-w-xs">
                  <p className="font-medium text-text-primary">Перетащите файл сюда</p>
                  <p className="text-sm text-text-secondary">или нажмите чтобы выбрать файл</p>
                  <p className="text-xs text-text-secondary/60 mt-2 break-all">{selectedFile ? selectedFile.name : 'Файл не выбран'}</p>
                </label>
              </div>
              {uploadError && <div className="error-box mt-4"><p className="error-text">{uploadError}</p></div>}
              {!isUploading && selectedFile && !previewData && (
                <div className="flex justify-end mt-4">
                  <button type="submit" className="btn-primary">Предварительный просмотр</button>
                </div>
              )}
              {isUploading && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2 text-text-secondary"><div className="spinner !h-5 !w-5"></div><span className="text-sm">Загрузка...</span></div>
                </div>
              )}
            </div>

            {previewData && (
              <div className="animate-fadeIn pt-4">
                <h2 className="text-lg font-bold text-text-primary mb-4 font-heading">Результат предварительного просмотра</h2>
                {previewData.success ? (
                  <>
                    <div className="bg-success/5 border border-success/20 rounded-xl p-4 mb-4"><p className="text-sm text-success font-medium">{previewData.message}</p></div>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="min-w-full divide-y divide-border table-fixed">
                        <thead className="bg-background">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-12">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '260px'}}>Вопрос</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '160px'}}>A</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '160px'}}>B</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '160px'}}>C</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '160px'}}>D</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-24">Правильный</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" style={{minWidth: '200px'}}>Объяснение</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {previewData.questions.map((q, i) => (
                            <tr key={i} className="bg-surface hover:bg-background transition-colors">
                              <td className="px-4 py-3 text-sm text-text-secondary whitespace-normal break-words">{i + 1}</td>
                              <td className="px-4 py-3 text-sm text-text-primary whitespace-normal break-words">{q.text}</td>
                              <td className="px-4 py-3 text-sm text-text-primary whitespace-normal break-words">{q.opt_a}</td>
                              <td className="px-4 py-3 text-sm text-text-primary whitespace-normal break-words">{q.opt_b}</td>
                              <td className="px-4 py-3 text-sm text-text-primary whitespace-normal break-words">{q.opt_c}</td>
                              <td className="px-4 py-3 text-sm text-text-primary whitespace-normal break-words">{q.opt_d}</td>
                              <td className={`px-4 py-3 text-sm font-bold whitespace-normal break-words ${q.correct === 'a' ? 'text-success' : q.correct === 'b' ? 'text-info' : q.correct === 'c' ? 'text-warning' : 'text-error'}`}>{q.correct.toUpperCase()}</td>
                              <td className="px-4 py-3 text-sm text-text-secondary whitespace-normal break-words">{q.explanation?.substring(0, 40)}{q.explanation && q.explanation.length > 40 ? '...' : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                      {!isImporting ? (
                        <>
                          <button type="button" onClick={handleConfirmImport} className="btn-success">Подтвердить импорт</button>
                          <button type="button" onClick={() => setPreviewData(null)} className="btn-outline">Изменить файл</button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-text-secondary"><div className="spinner !h-5 !w-5"></div><span>Импорт теста...</span></div>
                      )}
                      {importSuccess && <div className="bg-success/5 border border-success/20 rounded-xl p-4"><p className="text-sm text-success font-medium">Тест успешно импортирован! Перенаправление...</p></div>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="error-box mb-4"><p className="error-text">{previewData.message}</p></div>
                    <div className="flex justify-end"><button type="button" onClick={() => setPreviewData(null)} className="btn-outline">Изменить файл</button></div>
                  </>
                )}
              </div>
            )}

            {!previewData && (
              <div className="pt-6 border-t border-border">
                <button type="submit" disabled={isUploading || !selectedFile} className="btn-primary w-full">
                  {isUploading ? 'Загрузка...' : 'Предпросмотр таблицы'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizImportForm;
