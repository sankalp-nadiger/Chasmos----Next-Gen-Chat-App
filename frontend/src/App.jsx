/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LoadingBar from "./components/loadingbar.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChattingPage from "./components/ChattingPage.jsx";
import NewChat from "./components/NewChat.jsx";
import AuthPage from "./components/AuthPage.jsx";
import { Toaster } from "react-hot-toast";



import Profile from "./components/Profile.jsx";
import Settings from "./components/Settings.jsx";

// OAuth Callback Handler Component
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const syncStatus = searchParams.get('sync');
    const token = searchParams.get('token');
    
    if (syncStatus === 'success') {
      // If token is provided in URL, store it in localStorage
      if (token) {
        localStorage.setItem('chasmos_auth_token', token);
      }
      
        // Show success message (optional)
        console.log('Google Contacts sync successful!');
        
        // Redirect to ChattingPage (chats section)
        setTimeout(() => {
          navigate('/chats', { replace: true });
        }, 800);
    } else if (syncStatus === 'error') {
      // Handle error
        // Handle error - redirect to chats anyway but show error
        const reason = searchParams.get('reason');
        console.error('Google Contacts sync failed:', reason);
        setTimeout(() => {
          navigate('/chats', { replace: true });
        }, 800);
    } else {
      // No sync parameter, just redirect to chats
      setTimeout(() => {
        navigate('/chats', { replace: true });
      }, 800);
    }
  }, [location, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#1a1d29'
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          Completing Google Contacts sync...
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #333', 
          borderTop: '4px solid #4285f4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Auth Route Component (redirect to home if already authenticated)
const AuthRoute = ({ children, isAuthenticated }) => {
  return !isAuthenticated ? children : <Navigate to="/chats" replace />;
};

// Main App Content Component
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if app has been loaded before
    const hasLoaded = sessionStorage.getItem('app_has_loaded');
    return !hasLoaded;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage to prevent redirect on refresh
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    return !!(token && userInfo);
  });
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
    if (!isLoading) {
      const authToken = localStorage.getItem('token');
      const userData = localStorage.getItem('userInfo');
      
      if (authToken && userData) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        // Only redirect to auth if not already there and not on OAuth callback
        if (location.pathname !== '/auth' && location.pathname !== '/home') {
          navigate('/auth', { replace: true });
        }
      }
    }
  }, [isLoading, navigate]);

  const handleAuthentication = (success, userData = null) => {
    if (success) {
      // AuthPage already stores the token and userInfo, just update state
      setIsAuthenticated(true);
      navigate('/chats', { replace: true });
    } else {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
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
      
      {/* OAuth Callback Route - handles Google OAuth redirect */}
      <Route 
        path="/home" 
        element={<OAuthCallback />} 
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
            <Toaster position="top-center" />
          <AppContent />
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;