import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/ProfileLogin';
import Quizzes from './pages/Quizzes';
import QuizDetail from './pages/QuizDetail';
import QuizAttempt from './pages/QuizAttempt';
import Leaderboard from './pages/Leaderboard';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import AttemptReview from './pages/AttemptReview';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizEditor from './pages/admin/QuizEditor';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen bg-mist">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quizzes/:id" element={<QuizDetail />} />
        <Route path="/quizzes/:id/leaderboard" element={<Leaderboard />} />
        <Route
          path="/quizzes/:id/attempt"
          element={
            <RequireAuth>
              <QuizAttempt />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/reviews"
          element={
            <RequireAuth>
              <Reviews />
            </RequireAuth>
          }
        />
        <Route
          path="/attempts/:id/review"
          element={
            <RequireAuth>
              <AttemptReview />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/quizzes/new"
          element={
            <RequireAdmin>
              <QuizEditor mode="create" />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/quizzes/:id"
          element={
            <RequireAdmin>
              <QuizEditor mode="edit" />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
