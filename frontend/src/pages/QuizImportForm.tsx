import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizImportPreview {
  success: boolean;
  message: string;
  questions_count: number;
  questions: { text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; explanation: string | null; }[];
  errors: string[];
}

const QuizImportForm: React.FC = () => {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState('');
  const [quizGrade, setQuizGrade] = useState('');
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
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setUploadError(null);
    }
  };

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'title') setQuizTitle(value);
    else if (name === 'subject') setQuizSubject(value);
    else if (name === 'grade') setQuizGrade(value);
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (!selectedFile) { setUploadError('Пожалуйста, выберите файл для загрузки'); return; }
    if (!quizTitle.trim() || !quizSubject.trim() || !quizGrade.trim()) { setUploadError('Пожалуйста, заполните все поля метаданных теста'); return; }
    setIsUploading(true);
    setUploadError(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockPreview: QuizImportPreview = {
      success: true, message: 'Успешно предварительно просмотрено 5 вопросов', questions_count: 5,
      questions: [
        { text: 'Какой оператор используется для присваивания значения переменной в Python?', opt_a: '=', opt_b: '==', opt_c: '===', opt_d: ':=', correct: 'a', explanation: 'Оператор = используется для присваивания, == для сравнения равенства' },
        { text: 'Какой тип данных используется для хранения целочисленных значений в Python?', opt_a: 'int', opt_b: 'float', opt_c: 'str', opt_d: 'bool', correct: 'a', explanation: 'int - для целых чисел' },
        { text: 'Как создать пустой список в Python?', opt_a: '[]', opt_b: '{}', opt_c: '()', opt_d: '<>', correct: 'a', explanation: 'Квадратные скобки [] создают пустой список' },
        { text: 'Какое ключевое слово используется для определения функции в Python?', opt_a: 'function', opt_b: 'def', opt_c: 'func', opt_d: 'define', correct: 'b', explanation: 'def - ключевое слово для определения функций' },
        { text: 'Какой оператор используется для возведения в степень в Python?', opt_a: '^', opt_b: '**', opt_c: '//', opt_d: '%', correct: 'b', explanation: '** - оператор возведения в степень' },
      ], errors: []
    };
    setPreviewData(mockPreview);
    setIsUploading(false);
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.success) { setUploadError('Невозможно импортировать тест без успешного предварительного просмотра'); return; }
    setIsImporting(true);
    setUploadError(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setImportSuccess(true);
    setTimeout(() => navigate('/teacher/dashboard'), 2000);
    setIsImporting(false);
  };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto card animate-slideUp">
        <div className="gradient-header">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Импорт теста из файла</h1>
            <button onClick={() => navigate('/teacher/dashboard')} className="text-sm text-white/80 hover:text-white transition-colors">Отмена</button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form className="space-y-6">
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
                    {['8', '9', '10', '11'].map(g => <option key={g} value={g}>{g} класс</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Загрузка файла с вопросами</h2>
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">Поддерживаемые форматы: CSV, XLS, XLSX. Обязательные колонки: question, opt_a, opt_b, opt_c, opt_d, correct</p>
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
                    <button type="button" onClick={handlePreview} className="btn-primary">Предварительный просмотр</button>
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
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {['#', 'Вопрос', 'A', 'B', 'C', 'D', 'Правильный', 'Объяснение'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.questions.map((q, i) => (
                            <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-text-secondary">{i + 1}</td>
                              <td className="px-4 py-3 text-sm text-text-primary">{q.text}</td>
                              <td className="px-4 py-3 text-sm">{q.opt_a}</td>
                              <td className="px-4 py-3 text-sm">{q.opt_b}</td>
                              <td className="px-4 py-3 text-sm">{q.opt_c}</td>
                              <td className="px-4 py-3 text-sm">{q.opt_d}</td>
                              <td className={`px-4 py-3 text-sm font-bold ${q.correct === 'a' ? 'text-success' : q.correct === 'b' ? 'text-info' : q.correct === 'c' ? 'text-warning' : 'text-error'}`}>{q.correct.toUpperCase()}</td>
                              <td className="px-4 py-3 text-sm text-text-secondary">{q.explanation?.substring(0, 40)}...</td>
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
                <button type="button" disabled={isUploading || !selectedFile || !quizTitle.trim() || !quizSubject.trim() || !quizGrade.trim()} onClick={handlePreview} className="btn-primary w-full">
                  {isUploading ? 'Загрузка...' : 'Выполнить предварительный просмотр'}
                </button>
                <p className="mt-2 text-xs text-text-secondary/60">Все поля обязательны для заполнения</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizImportForm;
