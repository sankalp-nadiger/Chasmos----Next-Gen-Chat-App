import { useState, useEffect } from "react";
import LoadingBar from "./components/loadingbar.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChattingPage from "./components/ChattingPage.jsx";
import AuthPage from "./components/AuthPage.jsx";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      }
    };

    if (!isLoading) {
      checkAuthStatus();
    }
  }, [isLoading]);

  const handleAuthentication = (success, userData = null) => {
    if (success) {
      // Store authentication data
      localStorage.setItem('chasmos_auth_token', 'authenticated');
      if (userData) {
        localStorage.setItem('chasmos_user_data', JSON.stringify(userData));
      }
      setIsAuthenticated(true);
    } else {
      // Clear authentication data
      localStorage.removeItem('chasmos_auth_token');
      localStorage.removeItem('chasmos_user_data');
      setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
    handleAuthentication(false);
  };

  return (
    <div className="App">
      {isLoading ? (
        <LoadingBar />
      ) : (
        <ThemeProvider>
          {isAuthenticated ? (
            <ChattingPage onLogout={handleLogout} />
          ) : (
            <AuthPage onAuthenticated={handleAuthentication} />
          )}
        </ThemeProvider>
      )}
    </div>
  );
}

export default App;
