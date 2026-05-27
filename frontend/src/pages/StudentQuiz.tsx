import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import BackButton from '../components/BackButton';

interface Question {
  id: string;
  text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  explanation?: string;
  correct: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

interface SessionData {
  id: string;
  quiz_id: string;
  code: string;
  status: string;
}

const OPTION_COLORS = [
  { bg: 'bg-green-500', border: 'border-green-500', hover: 'hover:bg-green-600', ring: 'ring-green-300', label: '1' },
  { bg: 'bg-red-500', border: 'border-red-500', hover: 'hover:bg-red-600', ring: 'ring-red-300', label: '2' },
  { bg: 'bg-blue-500', border: 'border-blue-500', hover: 'hover:bg-blue-600', ring: 'ring-blue-300', label: '3' },
  { bg: 'bg-yellow-500', border: 'border-yellow-500', hover: 'hover:bg-yellow-600', ring: 'ring-yellow-300', label: '4' },
];

const CORRECT_COLOR = 'bg-green-500';
const WRONG_COLOR = 'bg-red-500';
const WRONG_SELECTED_COLOR = 'bg-red-700';
const WRONG_OTHER_COLOR = 'bg-red-400';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const StudentQuiz: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { student } = useStudent();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!code) { navigate('/student/entry'); return; }
    if (!student) { console.log('[StudentQuiz] waiting for student...'); return; }
    console.log('[StudentQuiz] student loaded, fetching quiz data', student.id);
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        const sessionResponse = await fetch(`/api/sessions/${code}`);
        if (!sessionResponse.ok) throw new Error('Сессия не найдена');
        const sData: SessionData = await sessionResponse.json();
        setSessionData(sData);

        const quizResponse = await fetch(`/api/quizzes/${sData.quiz_id}`);
        if (!quizResponse.ok) throw new Error('Тест не найден');
        const qData = await quizResponse.json();

        const questionsResponse = await fetch(`/api/questions/?quiz_id=${sData.quiz_id}`);
        if (!questionsResponse.ok) throw new Error('Вопросы не найдены');
        const questionsData = await questionsResponse.json();
        const questions: Question[] = questionsData.map((q: any) => ({
          id: q.id, text: q.text, opt_a: q.opt_a, opt_b: q.opt_b,
          opt_c: q.opt_c, opt_d: q.opt_d, explanation: q.explanation,
          correct: q.correct,
        }));
        setQuizData({ id: qData.id, title: qData.title, questions });
        setShuffleOrder(shuffleArray(['a', 'b', 'c', 'd']));
        const joinRes = await fetch(`/api/sessions/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: student.id }),
        });
        if (!joinRes.ok) {
          const errData = await joinRes.json().catch(() => ({}));
          console.error('[StudentQuiz] join failed:', joinRes.status, errData);
          if (joinRes.status === 404 && errData.detail === 'Student not found') {
            console.log('[StudentQuiz] re-registering student...');
            const reReg = await fetch('/api/students/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ display_name: student.display_name, class_name: student.class_name }),
            });
            if (reReg.ok) {
              const newStudent = await reReg.json();
              localStorage.setItem('classquiz_student', JSON.stringify(newStudent));
              const retryJoin = await fetch(`/api/sessions/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: newStudent.id }),
              });
              if (retryJoin.ok) console.log('[StudentQuiz] join OK after re-register');
            }
          }
        } else {
          console.log('[StudentQuiz] join OK');
        }
      } catch (err) {
        console.error('[StudentQuiz] error:', err);
        setError('Не удалось загрузить тест. Проверьте код сессии и попробуйте снова.');
      } finally { setIsLoading(false); }
    };
    fetchQuizData();
    return () => clearTimers();
  }, [code, navigate, student]);

  useEffect(() => {
    if (quizData && !isSubmitted) startTimer();
  }, [quizData]);

  const startTimer = () => {
    clearTimers();
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev === null || prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  const moveToNext = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setShowExplanation(false);
      setSelectedOption(null);
      setCurrentQuestionIndex(prev => prev + 1);
      startTimer();
    } else {
      submitQuiz();
    }
  };

  const handleAnswerSelect = (originalKey: string) => {
    if (!quizData || isSubmitted || showExplanation) return;
    setSelectedOption(selectedOption === originalKey ? null : originalKey);
  };

  const confirmAnswer = () => {
    if (!quizData || isSubmitted || !selectedOption) return;
    const qId = quizData.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: selectedOption }));
    setShowExplanation(true);
    setSelectedOption(null);
    clearTimers();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      moveToNext();
    }, 2000);
  };

  // Keyboard shortcuts: 1-4 to select by display position, A-D to select by original letter, Enter to confirm
  useEffect(() => {
    if (!quizData || isSubmitted || shuffleOrder.length !== 4) return;
    const handleKey = (e: KeyboardEvent) => {
      if (showExplanation || isSubmitted) return;
      const key = e.key.toLowerCase();
      if (['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key) - 1;
        e.preventDefault();
        handleAnswerSelect(shuffleOrder[idx]);
      } else if (['a', 'b', 'c', 'd'].includes(key)) {
        e.preventDefault();
        handleAnswerSelect(key);
      } else if (key === 'enter' && selectedOption) {
        e.preventDefault();
        confirmAnswer();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [quizData, isSubmitted, showExplanation, currentQuestionIndex, shuffleOrder, selectedOption]);

  const submitQuiz = useCallback(async () => {
    if (!quizData || !student || !sessionData) return;
    clearTimers();
    try {
      setIsLoading(true);
      let score = 0;
      const answerItems: { question_id: string; answer: string }[] = [];
      quizData.questions.forEach(question => {
        const userAnswer = answers[question.id] || '';
        answerItems.push({ question_id: question.id, answer: userAnswer });
        if (userAnswer === question.correct) score++;
      });
      const response = await fetch('/api/results/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          total_questions: quizData.questions.length,
          answers: answerItems,
          session_id: sessionData.id,
          student_id: student.id,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Не удалось сохранить результаты');
      }
      setIsSubmitted(true);
    } catch {
      setError('Не удалось отправить результаты. Пожалуйста, попробуйте снова.');
      setIsLoading(false);
    } finally { setIsLoading(false); }
  }, [quizData, student, sessionData, answers]);

  if (isLoading && !quizData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-text-secondary animate-pulse">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="page-card animate-scaleIn">
          <div className="error-box mb-4">
            <h3 className="font-bold text-text-primary mb-1">Ошибка</h3>
            <p className="text-text-secondary text-sm">{error}</p>
          </div>
          <button onClick={() => navigate('/student/entry')} className="btn-primary w-full">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="page-card text-center animate-fadeIn">
          <p className="text-text-secondary mb-4">Тест не найден</p>
          <button onClick={() => navigate('/student/entry')} className="btn-primary">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  const correctCount = quizData.questions.filter(q => answers[q.id] === q.correct).length;

  const options = shuffleOrder.map(origKey => ({
    originalKey: origKey,
    value: currentQuestion[`opt_${origKey}` as keyof Question] as string,
  }));

  const hint = `Клавиши: 1-4 для выбранных цветов или A-D для вариантов`;

  return (
    <div className="page-container flex items-center justify-center relative">
      <div className="fixed top-14 left-3 z-40">
        <BackButton to="/student/quiz-entry" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <UserMenu role="student" />
      </div>
      <div className="w-full max-w-2xl mx-auto card animate-slideUp">
        <div className="gradient-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{quizData.title}</h1>
              <p className="mt-1 text-sm text-white/80">Вопрос {currentQuestionIndex + 1} из {quizData.questions.length}</p>
            </div>
            {timeLeft !== null && !isSubmitted && (
              <div className={`text-2xl font-bold tabular-nums ${timeLeft <= 5 && timeLeft > 0 ? 'text-error animate-pulse' : 'text-white'}`}>
                {timeLeft > 0 ? `${timeLeft}с` : '0с'}
              </div>
            )}
          </div>
        </div>

        <div className="h-2 bg-gray-100 dark:bg-gray-700">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-r-full" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="p-6 md:p-8 animate-fadeIn" key={currentQuestionIndex}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-text-primary">{currentQuestion.text}</h3>
            {!showExplanation && !isSubmitted && (
              <p className="mt-2 text-xs text-text-secondary/50">{hint}</p>
            )}
          </div>

          <div className="grid gap-3">
            {options.map((opt, idx) => {
              const isSelected = (showExplanation ? answers[currentQuestion.id] : selectedOption) === opt.originalKey;
              const isCorrect = opt.originalKey === currentQuestion.correct;
              const showResult = showExplanation;
              const color = OPTION_COLORS[idx];

              let bgClass: string;
              let badgeClass = 'bg-white/20 text-white';

              if (!showResult) {
                bgClass = isSelected ? `${color.bg} brightness-75` : color.bg;
              } else if (isCorrect) {
                bgClass = CORRECT_COLOR;
              } else if (isSelected) {
                bgClass = WRONG_SELECTED_COLOR;
                badgeClass = 'bg-white/25 text-white';
              } else {
                bgClass = WRONG_OTHER_COLOR;
                badgeClass = 'bg-white/15 text-white/80';
              }

              const borderClass = isSelected && !showResult ? color.border
                : showResult && isCorrect ? 'border-green-500'
                : showResult && isSelected && !isCorrect ? 'border-red-700'
                : showResult && !isSelected && !isCorrect ? 'border-red-400'
                : 'border-transparent';

              const extraRing = isSelected && !showResult ? 'ring-2 ring-white/50'
                : showResult && isSelected && !isCorrect ? 'ring-2 ring-red-300'
                : '';

              return (
                <button
                  key={opt.originalKey}
                  onClick={() => handleAnswerSelect(opt.originalKey)}
                  disabled={isSubmitted || showExplanation}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${bgClass} ${borderClass} disabled:cursor-default active:scale-[0.99] text-white hover:brightness-110 ${extraRing}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${badgeClass}`}>
                      {color.label}
                    </span>
                    <span className="pt-1.5 font-medium">{opt.value}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {!showExplanation && !isSubmitted && selectedOption && (
            <div className="mt-6 animate-slideDown">
              <button onClick={confirmAnswer} className="btn-primary w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Подтвердить ответ
              </button>
              <p className="mt-2 text-xs text-center text-text-secondary/50">Enter ↵ для подтверждения</p>
            </div>
          )}

          {showExplanation && currentQuestion.explanation && (
            <div className="mt-6 p-4 rounded-lg bg-white/10 text-white animate-slideDown">
              <p className="text-sm font-medium mb-1">Объяснение:</p>
              <p className="text-sm text-white/80">{currentQuestion.explanation}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 error-box animate-shake">
              <p className="error-text">{error}</p>
            </div>
          )}

          {!showExplanation && !isSubmitted && currentQuestionIndex < quizData.questions.length - 1 && (
            <div className="mt-6 flex justify-between">
              {currentQuestionIndex > 0 && (
                <button onClick={() => { clearTimers(); setCurrentQuestionIndex(prev => prev - 1); setShowExplanation(false); setSelectedOption(null); startTimer(); }} className="btn-secondary btn-sm">
                  ← Назад
                </button>
              )}
              <button onClick={() => { clearTimers(); moveToNext(); }} disabled={!answers[currentQuestion.id]} className="btn-primary btn-sm ml-auto">
                Следующий →
              </button>
            </div>
          )}

          {!showExplanation && !isSubmitted && currentQuestionIndex === quizData.questions.length - 1 && (
            <div className="mt-6">
              <button onClick={submitQuiz} disabled={!answers[currentQuestion.id]} className="btn-success w-full">
                Завершить тест
              </button>
            </div>
          )}
        </div>

        {isSubmitted && (
          <div className="p-6 md:p-8 bg-success/5 border-t border-success/20 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-success mb-2">Тест завершен!</h3>
              <p className="text-text-secondary mb-2">
                Ваш результат: <span className="font-bold text-2xl text-text-primary">{correctCount}/{quizData.questions.length}</span>
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                <button onClick={() => navigate('/student/history')} className="btn-primary">Посмотреть историю</button>
                <button onClick={() => navigate('/student/entry')} className="btn-secondary">Начать новый тест</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuiz;
