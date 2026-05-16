import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider }   from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider }    from './context/AuthContext';
import AuthLayout          from './layouts/AuthLayout';
import AppLayout           from './layouts/AppLayout';
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import ChatPage            from './pages/ChatPage';
import QuizPage            from './pages/QuizPage';
import ExamPage            from './pages/ExamPage';
import DebugPage           from './pages/DebugPage';
import DashboardPage       from './pages/DashboardPage';
import MaterialsPage       from './pages/MaterialsPage';
import HistoryPage         from './pages/HistoryPage';
import GPAPage             from './pages/GPAPage';
import FlashcardsPage     from './pages/FlashcardsPage';
import StudyPlannerPage   from './pages/StudyPlannerPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth pages (centered card layout) */}
              <Route element={<AuthLayout />}>
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* App pages (sidebar layout, requires auth or guest) */}
              <Route element={<AppLayout />}>
                <Route path="/chat"       element={<ChatPage />} />
                <Route path="/quiz"       element={<QuizPage />} />
                <Route path="/exam"       element={<ExamPage />} />
                <Route path="/debug"      element={<DebugPage />} />
                <Route path="/dashboard"  element={<DashboardPage />} />
                <Route path="/materials"  element={<MaterialsPage />} />
                <Route path="/history"    element={<HistoryPage />} />
                <Route path="/gpa"        element={<GPAPage />} />
                <Route path="/flashcards" element={<FlashcardsPage />} />
                <Route path="/planner"    element={<StudyPlannerPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
