import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LoadingBar from "./components/loadingbar.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChattingPage from "./components/ChattingPage.jsx";
import NewChat from "./components/NewChat.jsx";
import AuthPage from "./components/AuthPage.jsx";
import Profile from "./components/Profile.jsx";
import Settings from "./components/Settings.jsx";
import Community from "./components/Community.jsx";

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Auth Route Component (redirect to home if already authenticated)
const AuthRoute = ({ children, isAuthenticated }) => {
  return !isAuthenticated ? children : <Navigate to="/home" replace />;
};

// Main App Content Component
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if app has been loaded before
    const hasLoaded = sessionStorage.getItem('app_has_loaded');
    return !hasLoaded;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('app_has_loaded', 'true');
      }, 1700);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = localStorage.getItem('chasmos_auth_token');
      const userData = localStorage.getItem('chasmos_user_data');
      
      if (authToken && userData) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Only redirect to auth if not already there
        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      }
    };

    if (!isLoading) {
      checkAuthStatus();
    }
  }, [isLoading, location.pathname, navigate]);

  const handleAuthentication = (success, userData = null) => {
    if (success) {
      // Store authentication data
      localStorage.setItem('chasmos_auth_token', 'authenticated');
      if (userData) {
        localStorage.setItem('chasmos_user_data', JSON.stringify(userData));
      }
      setIsAuthenticated(true);
      navigate('/home', { replace: true });
    } else {
      // Clear authentication data
      localStorage.removeItem('chasmos_auth_token');
      localStorage.removeItem('chasmos_user_data');
      setIsAuthenticated(false);
      navigate('/auth', { replace: true });
    }
  };

  const handleLogout = () => {
    handleAuthentication(false);
  };

  if (isLoading) {
    return <LoadingBar />;
  }

  return (
    <Routes>
      {/* Auth Route */}
      <Route 
        path="/auth" 
        element={<AuthPage onAuthenticated={handleAuthentication} />} 
      />
      
      {/* Home/Chats Route */}
      <Route 
        path="/chats" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="chats" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />

      {/* Groups Route */}
      <Route 
        path="/groups" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="groups" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />

      {/* Documents Route */}
      <Route 
        path="/documents" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="documents" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />

      {/* Community Route */}
      <Route 
        path="/community" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="community" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />

      {/* Profile Route */}
      <Route 
        path="/profile" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="profile" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />

      {/* Settings Route */}
      <Route 
        path="/settings" 
        element={
          isAuthenticated ? (
              <ChattingPage onLogout={handleLogout} activeSection="settings" />
            ) : (
              <Navigate to="/auth" replace />
            )
        } 
      />
      
      {/* Home Route - redirect to chats */}
      <Route 
        path="/home" 
        element={<Navigate to="/chats" replace />} 
      />
      
      {/* Default route */}
      <Route 
        path="/" 
        element={<Navigate to="/auth" replace />} 
      />

      {/* New Chat Route */}
      <Route path="/new-chat" element={<NewChat />} />

      {/* Catch all route */}
      <Route 
        path="*" 
        element={<Navigate to="/auth" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <Router>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
