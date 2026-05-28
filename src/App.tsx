import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventsPage } from './components/EventsPage';
import { CreatePage } from './pages/CreatePage';
import { InvitePage } from './pages/InvitePage';
import { ContactsPage } from './pages/ContactsPage';
import { SignupPage } from './pages/SignupPage';
import { usePlatformAuth } from './hooks/usePlatformAuth';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/?platform=fallback" />;
};

const AuthLoader = () => {
  const { loading } = usePlatformAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0E9243] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/invite/:invitationId" element={<InvitePage />} />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <ContactsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <>
              <AuthLoader />
              <PrivateRoute>
                <EventsPage />
              </PrivateRoute>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;