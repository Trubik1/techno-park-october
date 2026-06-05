import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StudentProvider } from './hooks/useStudent';
import { ThemeContext } from './hooks/useTheme';
import ThemeToggleButton from './components/ThemeToggleButton';
import { ToastProvider } from './components/Toast';

const TeacherLogin = React.lazy(() => import('./pages/TeacherLogin'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const StudentEntry = React.lazy(() => import('./pages/StudentEntry'));
const StudentQuizEntry = React.lazy(() => import('./pages/StudentQuizEntry'));
const StudentQuiz = React.lazy(() => import('./pages/StudentQuiz'));
const StudentHistory = React.lazy(() => import('./pages/StudentHistory'));
const QuizCreateForm = React.lazy(() => import('./pages/QuizCreateForm'));
const QuizImportForm = React.lazy(() => import('./pages/QuizImportForm'));
const SessionMonitor = React.lazy(() => import('./pages/SessionMonitor'));
const StudentQuizReview = React.lazy(() => import('./pages/StudentQuizReview'));
const StudentPractice = React.lazy(() => import('./pages/StudentPractice'));
const StudentPracticeQuiz = React.lazy(() => import('./pages/StudentPracticeQuiz'));

const PageLoader: React.FC = () => (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-[0.5rem_1.5rem_0.5rem_1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center animate-breathe">
            <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton-text mx-auto max-w-[120px]" />
          <div className="skeleton-text mx-auto max-w-[80px] !w-[80px]" />
        </div>
      </div>
    </div>
);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 animate-fadeIn relative">
      <div className="page-card text-center">
        <div className="text-8xl font-bold text-primary/20 mb-2 font-heading leading-none">404</div>
        <div className="w-16 h-0.5 bg-primary/20 mx-auto mb-6 rounded-full" />
        <h2 className="text-2xl font-semibold text-text-primary mb-2 font-heading">Страница не найдена</h2>
        <p className="text-text-secondary mb-8 text-caption">Страница, которую вы ищете, не существует или была перемещена.</p>
        <button onClick={() => navigate('/')} className="btn-primary">На главную</button>
      </div>
    </div>
  );
};

const Blob = ({ className }: { className: string }) => (
  <div className={`absolute rounded-full blur-[100px] will-change-transform animate-float pointer-events-none ${className}`} />
);

const BgDecoration: React.FC = () => (
  <>
    <div className="noise-overlay" />
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
      <Blob className="w-[500px] h-[500px] bg-primary/8 -top-32 -left-32" />
      <Blob className="w-[400px] h-[400px] bg-accent/6 top-1/3 -right-24" style={{ animationDelay: '-3s', animationDuration: '10s' }} />
      <Blob className="w-[350px] h-[350px] bg-success/6 bottom-0 left-1/4" style={{ animationDelay: '-6s', animationDuration: '12s' }} />
    </div>
  </>
);

function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('classquiz_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('classquiz_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <BrowserRouter>
        <StudentProvider>
          <ToastProvider>
          <BgDecoration />
          
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/dashboard/create" element={<QuizCreateForm />} />
              <Route path="/teacher/dashboard/import" element={<QuizImportForm />} />
              <Route path="/teacher/dashboard/session/:code" element={<SessionMonitor />} />
              <Route path="/student/entry" element={<StudentEntry />} />
              <Route path="/student/quiz-entry" element={<StudentQuizEntry />} />
              <Route path="/student/quiz/:code" element={<StudentQuiz />} />
              <Route path="/student/history" element={<StudentHistory />} />
              <Route path="/student/review/:resultId" element={<StudentQuizReview />} />
              <Route path="/student/practice" element={<StudentPractice />} />
              <Route path="/student/practice/quiz/:quizId" element={<StudentPracticeQuiz />} />
              <Route path="/" element={<Navigate replace to="/student/entry" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </React.Suspense>
          </ToastProvider>
        </StudentProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
