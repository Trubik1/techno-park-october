import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Breadcrumbs from '../components/Breadcrumbs';

interface ReviewItem {
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
}

interface ReviewData {
  quiz_title: string;
  answers: ReviewItem[];
  score: number;
  total: number;
}

const OPTION_LABELS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };
const OPTION_KEYS: (keyof ReviewItem)[] = ['opt_a', 'opt_b', 'opt_c', 'opt_d'];

const StudentQuizReview: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultId) { navigate('/student/entry'); return; }
    (async () => {
      try {
        const res = await fetch(`/api/results/${resultId}/review`);
        if (!res.ok) throw new Error('Не удалось загрузить обзор');
        const data: ReviewData = await res.json();
        setReview(data);
      } catch {
        setError('Не удалось загрузить результаты');
      } finally { setIsLoading(false); }
    })();
  }, [resultId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner mx-auto mb-3"></div>
          <p className="text-sm text-text-secondary">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card p-8 max-w-md mx-auto animate-scaleIn text-center">
          <div className="error-box mb-4">
            <p className="text-sm text-error">{error || 'Данные не найдены'}</p>
          </div>
          <button onClick={() => navigate('/student/entry')} className="btn-primary w-full">Вернуться</button>
        </div>
      </div>
    );
  }

  const q = review.answers[currentQ];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-background animate-fadeIn">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center gap-3 mb-6">
          <BackButton to="/student/entry" />
          <Breadcrumbs items={[
            { label: 'Вход ученика', path: '/student/entry' },
            { label: 'Просмотр ответов' },
          ]} />
        </div>

        <div className="card">
          <div className="p-6 bg-primary text-white rounded-t-2xl">
            <h1 className="text-xl font-bold font-heading">{review.quiz_title}</h1>
            <p className="text-white/80 mt-1">Просмотр ответов — {review.score}/{review.total}</p>
          </div>

          <div className="h-2 bg-background">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentQ + 1) / review.answers.length) * 100}%` }}></div>
          </div>

          <div className="p-6 animate-fadeIn" key={currentQ}>
            <p className="text-xs text-text-secondary mb-1">Вопрос {currentQ + 1} из {review.answers.length}</p>
            <h3 className="text-lg font-semibold text-text-primary mb-4">{q.question_text}</h3>

            <div className="grid gap-2 mb-4">
              {OPTION_KEYS.map((key) => {
                const label = key.replace('opt_', '').toUpperCase();
                const isStudentAnswer = q.student_answer === key.replace('opt_', '');
                const isCorrectAnswer = q.correct_answer === key.replace('opt_', '');
                let bg = 'bg-background';
                if (isCorrectAnswer) bg = 'bg-success/10 border-success';
                else if (isStudentAnswer && !q.is_correct) bg = 'bg-error/10 border-error';
                return (
                  <div key={key} className={`p-3 rounded-xl border-2 ${bg} ${(isStudentAnswer || isCorrectAnswer) ? 'border' : 'border-transparent'}`}>
                    <span className="font-bold text-sm">{label}.</span> {q[key]}
                    {isStudentAnswer && <span className="ml-2 text-xs text-error font-medium">(твой ответ)</span>}
                    {isCorrectAnswer && !isStudentAnswer && <span className="ml-2 text-xs text-success font-medium">(правильный)</span>}
                  </div>
                );
              })}
            </div>

            <div className={`p-3 rounded-lg text-sm font-medium ${q.is_correct ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
              {q.is_correct ? '✓ Верно' : '✗ Неверно'}
            </div>

            {q.explanation && (
              <div className="mt-4 p-4 rounded-xl bg-primary/5 text-text-secondary text-sm">
                <p className="font-medium text-text-primary mb-1">Объяснение:</p>
                {q.explanation}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border flex justify-between gap-3">
            <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0} className="btn-outline btn-sm disabled:opacity-30">
              ← Назад
            </button>
            <span className="text-sm text-text-secondary self-center">{currentQ + 1}/{review.answers.length}</span>
            <button onClick={() => setCurrentQ(p => Math.min(review.answers.length - 1, p + 1))} disabled={currentQ === review.answers.length - 1} className="btn-primary btn-sm disabled:opacity-30">
              Далее →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizReview;
