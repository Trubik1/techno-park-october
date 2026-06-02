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
  time_limit_quiz?: number | null;
  time_limit_question?: number | null;
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

  const studentIdRef = useRef<string | null>(null);
  const submitQuizRef = useRef<() => void>(() => {});

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
  const [resultId, setResultId] = useState<string | null>(null);

  const loadingCodeRef = useRef<string | null>(null);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!code) { navigate('/student/entry'); return; }
    if (!student) return;
    if (loadingCodeRef.current === code) return;
    loadingCodeRef.current = code;
    studentIdRef.current = student.id;
    let cancelled = false;

    (async () => {
      try {
        const sessionRes = await fetch('/api/sessions/' + code);
        if (!sessionRes.ok) throw new Error('Session not found');
        const sData = await sessionRes.json();
        if (cancelled) return;
        setSessionData(sData);

        const quizRes = await fetch('/api/quizzes/' + sData.quiz_id);
        if (!quizRes.ok) throw new Error('Quiz not found');
        const qData = await quizRes.json();

        const questionsRes = await fetch('/api/questions/?quiz_id=' + sData.quiz_id);
        if (!questionsRes.ok) throw new Error('Questions not found');
        const rawQuestions = await questionsRes.json();
        const questions: Question[] = rawQuestions.map((q: any) => ({
          id: q.id, text: q.text,
          opt_a: q.opt_a, opt_b: q.opt_b, opt_c: q.opt_c, opt_d: q.opt_d,
          explanation: q.explanation, correct: q.correct,
        }));
        if (cancelled) return;
        setQuizData({ id: qData.id, title: qData.title, questions, time_limit_quiz: qData.time_limit_quiz, time_limit_question: qData.time_limit_question });
        setShuffleOrder(shuffleArray(['a', 'b', 'c', 'd']));

        const joinRes = await fetch('/api/sessions/' + code + '/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: student.id }),
        });
        if (!joinRes.ok) {
          if (joinRes.status === 404) {
            const errData = await joinRes.json().catch(() => ({}));
            if (errData.detail === 'Student not found') {
              const regRes = await fetch('/api/students/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ display_name: student.display_name, class_name: student.class_name }),
              });
              if (regRes.ok) {
                const newStudent = await regRes.json();
                localStorage.setItem('classquiz_student', JSON.stringify(newStudent));
                studentIdRef.current = newStudent.id;
                const retryRes = await fetch('/api/sessions/' + code + '/join', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ student_id: newStudent.id }),
                });
                if (!retryRes.ok) console.warn('Re-join after re-registration failed');
              }
            }
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load quiz');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimers(); };
  }, [code, navigate, student]);

  const submitQuiz = useCallback(async () => {
    if (isSubmitted || !quizData || !studentIdRef.current || !sessionData) return;
    clearTimers();
    setError(null);
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
          student_id: studentIdRef.current,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save results');
      }
      const resultData = await response.json();
      setResultId(resultData.id);
      setIsSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit results');
      setIsLoading(false);
    } finally { setIsLoading(false); }
  }, [quizData, sessionData, answers, isSubmitted]);

  submitQuizRef.current = submitQuiz;

  const moveToNext = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setShowExplanation(false);
      setSelectedOption(null);
      setCurrentQuestionIndex(prev => prev + 1);
      if (!quizData.time_limit_quiz) startQuestionTimer();
    } else {
      submitQuizRef.current();
    }
  };

  useEffect(() => {
    if (quizData && !isSubmitted) {
      if (quizData.time_limit_quiz) {
        clearTimers();
        setTimeLeft(quizData.time_limit_quiz);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === null || prev <= 1) { submitQuizRef.current(); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        startQuestionTimer();
      }
    }
  }, [quizData, isSubmitted]);

  const startQuestionTimer = () => {
    clearTimers();
    setTimeLeft(quizData?.time_limit_question || 30);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev === null || prev <= 1 ? 0 : prev - 1));
    }, 1000);
  };

  const handleAnswerSelect = (originalKey: string) => {
    if (!quizData || isSubmitted || showExplanation) return;
    setSelectedOption(prev => prev === originalKey ? null : originalKey);
  };

  const confirmAnswer = () => {
    if (!quizData || isSubmitted || !selectedOption) return;
    const qId = quizData.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: selectedOption }));
    setShowExplanation(true);
    setSelectedOption(null);
    if (quizData?.time_limit_quiz) {
      return;
    }
    clearTimers();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      moveToNext();
    }, 2000);
  };

  useEffect(() => {
    if (!quizData || isSubmitted || shuffleOrder.length !== 4) return;
    const handleKey = (e: KeyboardEvent) => {
      if (showExplanation || isSubmitted) return;
      const key = e.key.toLowerCase();
      if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        handleAnswerSelect(shuffleOrder[parseInt(key) - 1]);
      } else if (['a', 'b', 'c', 'd'].includes(key)) {
        e.preventDefault();
        const positions: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        handleAnswerSelect(shuffleOrder[positions[key]]);
      } else if (key === 'enter' && selectedOption) {
        e.preventDefault();
        confirmAnswer();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [quizData, isSubmitted, showExplanation, currentQuestionIndex, shuffleOrder, selectedOption]);

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
    value: currentQuestion[('opt_' + origKey) as keyof Question] as string,
  }));

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
              <div className={'text-2xl font-bold tabular-nums ' + (timeLeft <= 30 && timeLeft > 0 ? 'text-error animate-pulse' : 'text-white')}>
                {timeLeft > 0 ? (
                  quizData.time_limit_quiz
                    ? Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0')
                    : timeLeft + 'с'
                ) : '0с'}
              </div>
            )}
          </div>
        </div>

        <div className="h-2 bg-gray-100 dark:bg-gray-700">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out rounded-r-full" style={{ width: progress + '%' }}></div>
        </div>

        <div className="p-6 md:p-8 animate-fadeIn" key={currentQuestionIndex}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-text-primary">{currentQuestion.text}</h3>
            {!showExplanation && !isSubmitted && (
              <p className="mt-2 text-xs text-text-secondary/50">Клавиши: 1-4 для выбранных цветов или A-D для вариантов</p>
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
                bgClass = isSelected ? color.bg + ' brightness-75' : color.bg;
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
                  className={'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ' + bgClass + ' ' + borderClass + ' disabled:cursor-default active:scale-[0.99] text-white hover:brightness-110 ' + extraRing}
                >
                  <div className="flex items-start gap-3">
                    <span className={'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ' + badgeClass}>
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

          {showExplanation && !isSubmitted && currentQuestionIndex < quizData.questions.length - 1 && (
            <div className="mt-6 animate-slideDown">
              <button onClick={() => { clearTimers(); moveToNext(); }} className="btn-primary w-full">
                → Далее
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 error-box animate-shake">
              <p className="error-text">{error}</p>
            </div>
          )}

          {!isSubmitted && currentQuestionIndex === quizData.questions.length - 1 && (
            <div className="mt-6">
              <button onClick={() => submitQuizRef.current()} disabled={!answers[currentQuestion.id]} className="btn-success w-full">
                Завершить тест
              </button>
            </div>
          )}

          {!showExplanation && !isSubmitted && currentQuestionIndex < quizData.questions.length - 1 && (
            <div className="mt-6 flex justify-between">
              {currentQuestionIndex > 0 && (
                <button onClick={() => { setCurrentQuestionIndex(prev => prev - 1); setShowExplanation(false); setSelectedOption(null); if (!quizData?.time_limit_quiz) { clearTimers(); startQuestionTimer(); } }} className="btn-secondary btn-sm">
                  ← Назад
                </button>
              )}
              <button onClick={() => { if (!quizData?.time_limit_quiz) clearTimers(); moveToNext(); }} disabled={!answers[currentQuestion.id]} className="btn-primary btn-sm ml-auto">
                Следующий →
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
                {resultId && <button onClick={() => navigate(`/student/review/${resultId}`)} className="btn-primary">Посмотреть ответы</button>}
                <button onClick={() => navigate('/student/history')} className="btn-secondary">История</button>
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
