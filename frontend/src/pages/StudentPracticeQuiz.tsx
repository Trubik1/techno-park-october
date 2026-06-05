import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';
import BackButton from '../components/BackButton';

interface Question {
  id: string;
  text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct: string;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  question_count: number;
  time_limit_quiz?: number | null;
  time_limit_question?: number | null;
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

const StudentPracticeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const navigate = useNavigate();
  const { student, isLoading: studentLoading } = useStudent();

  const studentIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const submitResultsRef = useRef<() => void>(() => {});

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!quizId) { navigate('/student/practice'); return; }
    if (!student) return;
    studentIdRef.current = student.id;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const quizRes = await fetch('/api/quizzes/' + quizId);
        if (!quizRes.ok) throw new Error('Quiz not found');
        const qData = await quizRes.json();
        if (cancelled) return;

        const questionsRes = await fetch('/api/questions/?quiz_id=' + quizId);
        if (!questionsRes.ok) throw new Error('Questions not found');
        const rawQuestions = await questionsRes.json();
        const questionsData: Question[] = rawQuestions.map((q: any) => ({
          id: q.id, text: q.text,
          opt_a: q.opt_a, opt_b: q.opt_b, opt_c: q.opt_c, opt_d: q.opt_d,
          correct: q.correct, explanation: q.explanation,
        }));
        if (cancelled) return;
        if (questionsData.length === 0) throw new Error('Нет вопросов в этом билете');

        setQuizData(qData);
        setQuestions(questionsData);
        setShuffleOrder(shuffleArray(['a', 'b', 'c', 'd']));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimers(); };
  }, [quizId, navigate, student]);

  const submitResults = useCallback(async () => {
    if (isSubmitted || !quizData || !studentIdRef.current) return;
    clearTimers();
    setError(null);
    try {
      setIsLoading(true);
      let score = 0;
      const answerItems: { question_id: string; answer: string }[] = [];
      const currentAnswers = answersRef.current;
      questions.forEach(question => {
        const userAnswer = currentAnswers[question.id] || '';
        answerItems.push({ question_id: question.id, answer: userAnswer });
        if (userAnswer === question.correct) score++;
      });
      const response = await fetch(`/api/results/practice/?student_id=${studentIdRef.current}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizData.id,
          score,
          total_questions: questions.length,
          answers: answerItems,
          mode,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save');
      }
      const resultData = await response.json();
      setResultId(resultData.id);
      setIsSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [quizData, questions, isSubmitted, mode]);

  submitResultsRef.current = submitResults;

  answersRef.current = answers;

  const moveToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setShowExplanation(false);
      setSelectedOption(null);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitResultsRef.current();
    }
  };

  useEffect(() => {
    if (quizData && !isSubmitted && mode === 'exam') {
      clearTimers();
      const totalTime = quizData.time_limit_quiz || (quizData.time_limit_question || 30) * questions.length;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setTimeLeft(Math.max(totalTime - elapsed, 0));
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) { submitResultsRef.current(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }, [quizData, isSubmitted, mode, questions.length, startedAt]);

  const handleAnswerSelect = (originalKey: string) => {
    if (!quizData || isSubmitted || showExplanation) return;
    setSelectedOption(prev => prev === originalKey ? null : originalKey);
  };

  const confirmAnswer = () => {
    if (!quizData || isSubmitted || !selectedOption) return;
    const qId = questions[currentQuestionIndex].id;
    const updated = { ...answersRef.current, [qId]: selectedOption };
    answersRef.current = updated;
    setAnswers(updated);
    if (mode === 'practice') {
      setShowExplanation(true);
      setSelectedOption(null);
    } else {
      if (currentQuestionIndex < questions.length - 1) {
        setSelectedOption(null);
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        submitResultsRef.current();
      }
    }
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

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    navigate('/student/entry');
    return null;
  }

  if (error && !quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card p-8 max-w-md mx-auto animate-scaleIn text-center">
          <div className="error-box mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button onClick={() => navigate('/student/practice')} className="btn-primary w-full">К списку билетов</button>
        </div>
      </div>
    );
  }

  if (!quizData || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card p-8 max-w-md text-center animate-fadeIn">
          {isLoading ? (
            <>
              <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
              <p className="text-sm text-text-secondary">Загрузка вопросов...</p>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-4">Тест не найден</p>
              <button onClick={() => navigate('/student/practice')} className="btn-primary">К списку билетов</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const totalTime = quizData.time_limit_quiz || (quizData.time_limit_question || 30) * questions.length;
  const timePercent = timeLeft !== null && totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timePercent > 50 ? '#22c55e' : timePercent > 20 ? '#eab308' : '#ef4444';

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const correctCount = questions.filter(q => answers[q.id] === q.correct).length;
  const options = shuffleOrder.map(origKey => ({
    originalKey: origKey,
    value: currentQuestion[('opt_' + origKey) as keyof Question] as string,
  }));

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <ThemeToggleButton />
          <BackButton to="/student/practice" />
        </div>
        <div className="card">
          <div className={`p-6 rounded-t-2xl ${mode === 'exam' ? 'bg-primary' : 'bg-emerald-600'} text-white`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                    {mode === 'exam' ? 'Экзамен' : 'Подготовка'}
                  </span>
                  {quizData.subject && (
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                      {quizData.subject} · {quizData.grade} класс
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold font-heading">{quizData.title}</h1>
                <p className="mt-1 text-sm text-white/80">Вопрос {currentQuestionIndex + 1} из {questions.length}</p>
              </div>
              {timeLeft !== null && !isSubmitted && (
                <div className="flex items-center gap-2">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={timerColor} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={`${(timePercent / 100) * 97.4} 97.4`}
                      className="transition-all duration-1000 ease-linear" />
                  </svg>
                  <div className={'text-2xl font-bold tabular-nums leading-none ' + (timePercent <= 20 && timeLeft > 0 ? 'text-accent animate-pulse' : 'text-white')}>
                    {timeLeft > 0 ? (
                      quizData.time_limit_quiz
                        ? Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0')
                        : timeLeft + 'с'
                    ) : '0с'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-2 bg-background">
            <div className={`h-full transition-all duration-500 ease-out rounded-r-full ${mode === 'exam' ? 'bg-primary' : 'bg-emerald-500'}`}
              style={{ width: progress + '%' }}></div>
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
              <div className="mt-6 p-4 rounded-xl bg-primary/10 text-text-primary border border-primary/20 animate-slideDown">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {answers[currentQuestion.id] === currentQuestion.correct ? '✅ Верно!' : '❌ Неверно'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Правильный ответ: {currentQuestion.correct.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{currentQuestion.explanation}</p>
              </div>
            )}

            {showExplanation && !isSubmitted && (
              <div className="mt-6 animate-slideDown">
                <button onClick={() => { clearTimers(); moveToNext(); }} className="btn-primary w-full">
                  {currentQuestionIndex < questions.length - 1 ? '→ Далее' : 'Завершить'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 error-box animate-shake">
                <p className="error-text">{error}</p>
              </div>
            )}

            {mode !== 'practice' && !showExplanation && !isSubmitted && (
              <div className="mt-6">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button onClick={() => { setCurrentQuestionIndex(prev => prev + 1); setSelectedOption(null); }}
                    disabled={!answers[currentQuestion.id]} className="btn-primary btn-sm ml-auto block">
                    Следующий →
                  </button>
                ) : (
                  <button onClick={() => submitResultsRef.current()} disabled={!answers[currentQuestion.id]} className="btn-success w-full">
                    Завершить тест
                  </button>
                )}
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
                <h3 className="text-2xl font-bold text-success mb-2 font-heading">
                  {mode === 'practice' ? 'Подготовка завершена!' : 'Экзамен завершен!'}
                </h3>
                <p className="text-text-secondary mb-2">
                  Результат: <span className="font-bold text-2xl text-text-primary">{correctCount}/{questions.length}</span>
                </p>
                {questions.length > 0 && (
                  <p className="text-xs text-text-secondary/60 mb-2">
                    Точность: {Math.round((correctCount / questions.length) * 100)}%
                  </p>
                )}
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                  {resultId && <button onClick={() => navigate(`/student/review/${resultId}`)} className="btn-primary">Посмотреть ответы</button>}
                  <button onClick={() => { window.location.href = `/student/practice/quiz/${quizId}?mode=${mode}`; }}
                    className="btn-outline">
                    Пройти ещё раз
                  </button>
                  <button onClick={() => navigate('/student/practice')} className="btn-outline">К списку билетов</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPracticeQuiz;