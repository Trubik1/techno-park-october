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

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fadeIn">
    <div className="text-center">
      <div className="flex justify-center mb-3"><div className="spinner-dots"><span></span><span></span><span></span></div></div>
      <p className="text-sm text-text-secondary animate-pulse" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Загрузка...</p>
    </div>
  </div>
);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fadeIn relative">
      <div className="page-card text-center">
        <div className="text-7xl font-bold text-primary mb-4 font-heading" style={{ letterSpacing: '-0.03em' }}>404</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2 font-heading">Страница не найдена</h2>
        <p className="text-text-secondary mb-6">Страница, которую вы ищете, не существует или была перемещена.</p>
        <button onClick={() => navigate('/')} className="btn-primary">На главную</button>
      </div>
    </div>
  );
};

const BgDecoration: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
    <svg className="w-full h-full opacity-[0.25] dark:opacity-[0.15]" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-100 200 C 200 50, 400 400, 700 250 S 1100 500, 1540 300" stroke="#2563EB" strokeWidth="2" fill="none" />
      <path d="M-100 500 C 300 700, 500 200, 800 450 S 1200 300, 1540 600" stroke="#2563EB" strokeWidth="1.5" fill="none" />
      <path d="M-100 750 C 250 900, 600 600, 900 800 S 1300 650, 1540 800" stroke="#2563EB" strokeWidth="1" fill="none" />
      <path d="M200 -50 C 400 200, 300 500, 600 600 S 1000 400, 1200 950" stroke="#2563EB" strokeWidth="2" fill="none" />
      <path d="M600 -50 C 800 150, 700 400, 1000 500 S 1400 300, 1540 100" stroke="#2563EB" strokeWidth="1.5" fill="none" />
    </svg>
  </div>
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
