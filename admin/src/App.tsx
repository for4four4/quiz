import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { LeadsPage } from './pages/Leads';
import { NewQuizPage } from './pages/NewQuiz';
import { QuizEditorPage } from './pages/QuizEditor';
import { ToastProvider } from './ui';

function RequireAuth({ children }: { children: React.ReactElement }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/new" element={<NewQuizPage />} />
            <Route path="/quizzes/:id" element={<QuizEditorPage />} />
            <Route path="/leads" element={<LeadsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
