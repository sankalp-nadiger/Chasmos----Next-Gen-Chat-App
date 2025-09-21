import React, { useState, useEffect } from "react";
import LoadingBar from "./components/loadingbar.jsx";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ChattingPage from "./components/ChattingPage.jsx";
function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {isLoading ? (
        <LoadingBar />
      ) : (
        <ThemeProvider>
          <ChattingPage />
        </ThemeProvider>
      )}
    </div>
  );
}

export default App;
