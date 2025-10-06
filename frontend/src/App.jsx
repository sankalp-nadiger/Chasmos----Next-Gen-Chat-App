import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import LoadingBar from "./components/loadingbar.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChattingPage from "./components/ChattingPage.jsx";
import AuthPage from "./components/AuthPage.jsx";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

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
    <ThemeProvider>
      <Routes>
        {/* Auth Route */}
        <Route 
          path="/auth" 
          element={<AuthPage onAuthenticated={handleAuthentication} />} 
        />
        
        {/* Home Route */}
        <Route 
          path="/home" 
          element={
            isAuthenticated ? (
                <ChattingPage onLogout={handleLogout} />
              ) : (
                <div className="min-h-screen flex items-center justify-center bg-cosmic-dark text-white">
                  <div className="text-center">
                    <h1 className="text-2xl mb-4">Access Denied</h1>
                    <p className="mb-4">You need to be authenticated to access this page.</p>
                    <p className="mb-4 text-sm text-gray-400">Current auth state: {String(isAuthenticated)}</p>
                    <button 
                      onClick={() => handleAuthentication(true, { name: 'Test User' })}
                      className="bg-cosmic-blue px-4 py-2 rounded mr-4"
                    >
                      Test Login
                    </button>
                    <button 
                      onClick={() => navigate('/auth')}
                      className="bg-cosmic-purple px-4 py-2 rounded"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              )
          } 
        />
        
        {/* Default route */}
        <Route 
          path="/" 
          element={<Navigate to="/auth" replace />} 
        />
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={<Navigate to="/auth" replace />} 
        />
      </Routes>
    </ThemeProvider>
  );
};

function App() {
  return (
    <div className="App">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;
