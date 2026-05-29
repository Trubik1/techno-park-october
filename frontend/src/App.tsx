import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StudentProvider } from './hooks/useStudent';
import { ThemeContext } from './hooks/useTheme';
import ThemeToggleButton from './components/ThemeToggleButton';

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
      <div className="spinner mx-auto mb-4"></div>
      <p className="text-text-secondary animate-pulse">Загрузка...</p>
    </div>
  </div>
);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fadeIn relative">
      <div className="page-card text-center">
        <div className="text-8xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">404</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Страница не найдена</h2>
        <p className="text-text-secondary mb-6">Страница, которую вы ищете, не существует или была перемещена.</p>
        <button onClick={() => navigate('/')} className="btn-primary">На главную</button>
      </div>
    </div>
  );
};

const BgDecoration: React.FC = () => (
  <div className="bg-decoration">
    <div></div>
    <div></div>
    <div></div>
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
          <BgDecoration />
          <div className="fixed top-3 left-3 z-50 animate-fadeIn">
            <ThemeToggleButton />
          </div>
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
        </StudentProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
