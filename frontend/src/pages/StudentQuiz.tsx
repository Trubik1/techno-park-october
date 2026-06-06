import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import UserMenu from '../components/UserMenu';
import ThemeToggleButton from '../components/ThemeToggleButton';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';

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

const OPTION_STYLES = [
  { label: '1', ring: 'ring-primary/30' },
  { label: '2', ring: 'ring-accent/30' },
  { label: '3', ring: 'ring-info/30' },
  { label: '4', ring: 'ring-success/30' },
];

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
  const { student, isLoading: studentLoading } = useStudent();

  const studentIdRef = useRef<string | null>(null);
  const submitQuizRef = useRef<() => void>(() => {});

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
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
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!code) { navigate('/student/entry'); return; }
    if (!student) { setIsLoading(false); return; }
    studentIdRef.current = student.id;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
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

  const sendProgress = useCallback(() => {
    if (!sessionData || !student || !quizData) return;
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(async () => {
      try {
        const answerList = quizData.questions
          .map((q, idx) => {
            const studentAnswer = answers[q.id] || '';
            if (!studentAnswer) return null;
            return {
              question_index: idx,
              answer: studentAnswer,
              is_correct: studentAnswer === q.correct,
            };
          })
          .filter((a): a is { question_index: number; answer: string; is_correct: boolean } => a !== null);
        await fetch(`/api/sessions/${sessionData.id}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.id,
            current_question: currentQuestionIndex,
            answers: answerList,
          }),
        });
      } catch {
      }
    }, 500);
  }, [sessionData, student, quizData, answers, currentQuestionIndex]);

  const moveToNext = () => {
    if (!quizData) return;
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setShowExplanation(false);
      setSelectedOption(null);
      setCurrentQuestionIndex(prev => prev + 1);
      if (!quizData.time_limit_quiz) startQuestionTimer();
      sendProgress();
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
    sendProgress();
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

  if (studentLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !quizData) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
          <p className="text-sm text-text-secondary animate-pulse">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="card-sharp p-8 max-w-md mx-auto animate-scaleIn text-center">
          <div className="error-box mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button onClick={() => navigate('/student/entry')} className="btn-primary w-full">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="card-sharp p-8 max-w-md text-center animate-fadeIn">
          <p className="text-text-secondary mb-4">Тест не найден</p>
          <button onClick={() => navigate('/student/entry')} className="btn-primary">Вернуться к входу</button>
        </div>
      </div>
    );
  }

  const totalTime = quizData.time_limit_quiz || (quizData.time_limit_question || 30) * quizData.questions.length;
  const timePercent = timeLeft !== null && totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timePercent > 50 ? '#7d9b6a' : timePercent > 20 ? '#c49a4a' : '#c45353';

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  const correctCount = quizData.questions.filter(q => answers[q.id] === q.correct).length;
  const options = shuffleOrder.map(origKey => ({
    originalKey: origKey,
    value: currentQuestion[('opt_' + origKey) as keyof Question] as string,
  }));

  return (
    <div className="min-h-[100dvh] bg-background animate-fadeIn">
      <div className="fixed top-4 right-4 z-50">
        <UserMenu role="student" />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <ThemeToggleButton />
          <BackButton to="/student/quiz-entry" />
        </div>
        <Breadcrumbs items={[
          { label: 'Вход ученика', path: '/student/entry' },
          { label: 'Выбор теста', path: '/student/quiz-entry' },
          { label: quizData?.title || 'Тест' },
        ]} />
        <div className="card overflow-hidden" style={{ borderRadius: '16px' }}>
          <div className="p-6 bg-primary text-white relative overflow-hidden" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/60 blur-2xl" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-semibold font-heading text-white">{quizData.title}</h1>
                <p className="mt-1 text-sm text-white/70">Вопрос {currentQuestionIndex + 1} из {quizData.questions.length}</p>
              </div>
              {timeLeft !== null && !isSubmitted && (
                <div className="flex items-center gap-2">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={timerColor} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={`${(timePercent / 100) * 97.4} 97.4`}
                      className="transition-all duration-1000 ease-linear" />
                  </svg>
                  <div className={`text-2xl font-bold tabular-nums leading-none ${timePercent <= 20 && timeLeft > 0 ? 'text-accent animate-pulse' : 'text-white'}`}>
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

          <div className="h-1.5 bg-white/15">
            <div className="h-full transition-all duration-500 ease-out rounded-r-full" style={{ width: progress + '%', backgroundColor: '#4CAF50' }}></div>
          </div>

          <div className="p-6 md:p-8 animate-fadeIn" key={currentQuestionIndex} style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <div className="mb-6">
              <h3 className="text-xl font-medium text-text-primary font-heading leading-snug">{currentQuestion.text}</h3>
              {!showExplanation && !isSubmitted && (
                <p className="mt-2 text-xs text-text-secondary/40">Клавиши: 1-4 для выбранных цветов или A-D для вариантов</p>
              )}
            </div>

            <div className="grid gap-3">
              {options.map((opt, idx) => {
                const isSelected = (showExplanation ? answers[currentQuestion.id] : selectedOption) === opt.originalKey;
                const isCorrect = opt.originalKey === currentQuestion.correct;
                const showResult = showExplanation;
                const style = OPTION_STYLES[idx];

                let containerClass = 'w-full text-left p-4 border transition-all duration-200 disabled:cursor-default active:scale-[0.99] flex items-start gap-3 ';
                let badgeClass = 'flex items-center justify-center w-8 h-8 text-sm font-bold shrink-0 ';
                let textClass = 'pt-1.5 font-medium ';

                if (!showResult) {
                  if (isSelected) {
                    containerClass += 'border-primary bg-primary/5 rounded-[0.5rem_1.5rem_0.5rem_1.5rem] shadow-studio';
                    badgeClass += 'bg-primary text-white rounded-[0.25rem_0.75rem_0.25rem_0.75rem]';
                    textClass += 'text-text-primary';
                  } else {
                    containerClass += 'border-border/60 bg-surface hover:border-primary/30 hover:bg-primary/[0.02] rounded-[0.5rem_1.25rem_0.5rem_1.25rem]';
                    badgeClass += 'bg-border/40 text-text-secondary rounded-[0.25rem_0.5rem_0.25rem_0.5rem]';
                    textClass += 'text-text-primary';
                  }
                } else if (isCorrect) {
                  containerClass += 'border-success bg-success/5 rounded-[0.5rem_1.5rem_0.5rem_1.5rem]';
                  badgeClass += 'bg-success text-white rounded-[0.25rem_0.75rem_0.25rem_0.75rem]';
                  textClass += 'text-text-primary';
                } else if (isSelected) {
                  containerClass += 'border-error bg-error/5 rounded-[0.5rem_1.5rem_0.5rem_1.5rem]';
                  badgeClass += 'bg-error text-white rounded-[0.25rem_0.75rem_0.25rem_0.75rem]';
                  textClass += 'text-text-primary';
                } else {
                  containerClass += 'border-border/40 bg-surface/50 rounded-[0.5rem_1.25rem_0.5rem_1.25rem] opacity-60';
                  badgeClass += 'bg-border/30 text-text-secondary/60 rounded-[0.25rem_0.5rem_0.25rem_0.5rem]';
                  textClass += 'text-text-secondary/60';
                }

                return (
                  <button
                    key={opt.originalKey}
                    onClick={() => handleAnswerSelect(opt.originalKey)}
                    disabled={isSubmitted || showExplanation}
                    className={containerClass}
                  >
                    <span className={badgeClass}>
                      {style.label}
                    </span>
                    <span className={textClass}>{opt.value}</span>
                  </button>
                );
              })}
            </div>

            {!showExplanation && !isSubmitted && selectedOption && (
              <div className="mt-6 animate-slideDown">
                <button onClick={confirmAnswer} className="btn-primary w-full flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Подтвердить ответ
                </button>
                <p className="mt-2 text-xs text-center text-text-secondary/40">Enter &crarr; для подтверждения</p>
              </div>
            )}

            {showExplanation && currentQuestion.explanation && (
              <div className="mt-6 p-4 rounded-[0.5rem_1.25rem_0.5rem_1.25rem] bg-primary/5 text-text-primary border border-primary/15 animate-slideDown">
                <p className="text-sm font-medium mb-1">Объяснение:</p>
                <p className="text-sm text-text-secondary">{currentQuestion.explanation}</p>
              </div>
            )}

            {showExplanation && !isSubmitted && currentQuestionIndex < quizData.questions.length - 1 && (
              <div className="mt-6 animate-slideDown">
                <button onClick={() => { clearTimers(); moveToNext(); }} className="btn-primary w-full">
                  &rarr; Далее
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
                  <button onClick={() => { setCurrentQuestionIndex(prev => prev - 1); setShowExplanation(false); setSelectedOption(null); if (!quizData?.time_limit_quiz) { clearTimers(); startQuestionTimer(); } sendProgress(); }} className="btn-outline btn-sm">
                    &larr; Назад
                  </button>
                )}
                <button onClick={() => { if (!quizData?.time_limit_quiz) clearTimers(); moveToNext(); sendProgress(); }} disabled={!answers[currentQuestion.id]} className="btn-primary btn-sm ml-auto">
                  Следующий &rarr;
                </button>
              </div>
            )}
          </div>

          {isSubmitted && (
            <div className="p-6 md:p-8 bg-success/5 border-t border-success/20 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[0.5rem_1.5rem_0.5rem_1.5rem] bg-success/10 mb-4">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-success mb-2 font-heading">Тест завершен!</h3>
                <p className="text-text-secondary mb-2">
                  Ваш результат: <span className="font-bold text-2xl text-text-primary">{correctCount}/{quizData.questions.length}</span>
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                  {resultId && <button onClick={() => navigate(`/student/review/${resultId}`)} className="btn-primary">Посмотреть ответы</button>}
                  <button onClick={() => navigate('/student/history')} className="btn-outline">История</button>
                  <button onClick={() => navigate('/student/entry')} className="btn-outline">Начать новый тест</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
