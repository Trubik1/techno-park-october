import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Вход учителя', path: '/teacher/login' },
          { label: 'Панель управления', path: '/teacher/dashboard' },
          { label: 'Импорт теста' },
        ]} />
        <div className="card animate-slideUp">
        <div className="gradient-header">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Импорт теста из файла</h1>
            <button onClick={() => navigate('/teacher/dashboard')} className="text-sm text-white/80 hover:text-white transition-colors">Отмена</button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form className="space-y-6" onSubmit={e => { e.preventDefault(); handlePreview(); }}>
            <div className="space-y-4">
              <div>
                <label className="label">Название теста</label>
                <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Например: Математика: Дроби" className="input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Предмет (вкладка)</label>
                  <input type="text" value={quizSubject} onChange={(e) => setQuizSubject(e.target.value)} placeholder="Например: История Беларуси" className="input" list="subjects-import-list" />
                  <datalist id="subjects-import-list">
                    {existingSubjects.filter(s => s !== quizSubject).map(s => (
                      <option key={s} value={s} />
                    ))}
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
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is-public-import" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />
                <label htmlFor="is-public-import" className="text-sm text-text-secondary cursor-pointer select-none">Сделать тест публичным (доступен всем учителям)</label>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="label">Ограничение по времени</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setTimerMode('quiz')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timerMode === 'quiz' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>На весь тест</button>
                  <button type="button" onClick={() => setTimerMode('question')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timerMode === 'question' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}>На один вопрос</button>
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

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Загрузка файла с вопросами</h2>
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">Поддерживаемые форматы: CSV, XLS, XLSX. Колонки: вопрос, вариант a/b/c/d, правильный ответ (a/b/c/d), объяснение.</p>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-text-secondary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Пример оформления таблицы
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Вопрос<br/><span className="text-text-secondary/50">(question)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант A<br/><span className="text-text-secondary/50">(opt_a)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант B<br/><span className="text-text-secondary/50">(opt_b)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант C<br/><span className="text-text-secondary/50">(opt_c)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Вариант D<br/><span className="text-text-secondary/50">(opt_d)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Правильный<br/><span className="text-text-secondary/50">(correct)</span></th>
                          <th className="px-3 py-2 text-left font-medium text-text-secondary">Пояснение<br/><span className="text-text-secondary/50">(explanation)</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-3 py-2 text-text-primary">Сколько будет 2+2?</td>
                          <td className="px-3 py-2 text-text-primary">3</td>
                          <td className="px-3 py-2 text-text-primary">4</td>
                          <td className="px-3 py-2 text-text-primary">5</td>
                          <td className="px-3 py-2 text-text-primary">6</td>
                          <td className="px-3 py-2 font-bold text-success">b</td>
                          <td className="px-3 py-2 text-text-secondary">2+2=4</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                  <input type="file" id="file-input" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16v4a2 2 0 002 2h6a2 2 0 002-2v-4M11 8h6a2 2 0 002-2V4a2 2 0 00-2-2h-6a2 2 0 00-2 2v2M7 20h10a2 2 0 002-2V8a2 2 0 00-2-2h-2m0 0l-3-3m3 3l-3 3" />
                      </svg>
                      <div>
                        <p className="font-medium text-text-primary">Перетащите файл сюда</p>
                        <p className="text-sm text-text-secondary">или нажмите чтобы выбрать файл</p>
                      </div>
                      <p className="text-xs text-text-secondary/60">{selectedFile ? selectedFile.name : 'Файл не выбран'}</p>
                    </div>
                  </label>
                </div>
                {uploadError && <div className="error-box"><p className="error-text">{uploadError}</p></div>}
                {!isUploading && selectedFile && !previewData && (
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary">Предварительный просмотр</button>
                  </div>
                )}
                {isUploading && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-text-secondary"><div className="spinner !h-5 !w-5"></div><span className="text-sm">Загрузка...</span></div>
                  </div>
                )}
              </div>
            </div>

            {previewData && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-bold text-text-primary mb-4">Результат предварительного просмотра</h2>
                {previewData.success ? (
                  <>
                    <div className="success-box mb-4"><p className="success-text">{previewData.message}</p></div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                        <thead className="bg-gray-50 dark:bg-gray-900">
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
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {previewData.questions.map((q, i) => (
                            <tr key={i} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                          <button type="button" onClick={() => setPreviewData(null)} className="btn-secondary">Изменить файл</button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-text-secondary"><div className="spinner !h-5 !w-5"></div><span>Импорт теста...</span></div>
                      )}
                      {importSuccess && <div className="success-box"><p className="success-text">Тест успешно импортирован! Перенаправление...</p></div>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="error-box mb-4"><p className="error-text">{previewData.message}</p></div>
                    <div className="mt-6 flex justify-end"><button type="button" onClick={() => setPreviewData(null)} className="btn-secondary">Изменить файл</button></div>
                  </>
                )}
              </div>
            )}

            {!previewData && (
              <div className="pt-6 border-t border-gray-100">
                <button type="submit" disabled={isUploading || !selectedFile} className="btn-primary w-full">
                  {isUploading ? 'Загрузка...' : 'Предпросмотр таблицы'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default QuizImportForm;
