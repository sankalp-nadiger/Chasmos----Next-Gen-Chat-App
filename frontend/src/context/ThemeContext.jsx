import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import CosmosBackground from '../components/CosmosBg';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [timeOfDay, setTimeOfDay] = useState('morning');

  // Function to determine theme based on time
  const getThemeByTime = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      setTimeOfDay('morning');
      return 'light';
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay('afternoon');
      return 'mixed';
    } else {
      setTimeOfDay('night');
      return 'dark';
    }
  };

  useEffect(() => {
    const newTheme = getThemeByTime();
    setTheme(newTheme);

    // Update theme every hour instead of every minute to reduce re-renders
    const interval = setInterval(() => {
      const updatedTheme = getThemeByTime();
      if (updatedTheme !== theme) {
        setTheme(updatedTheme);
      }
    }, 3600000); // 1 hour instead of 1 minute

    return () => clearInterval(interval);
  }, [theme]);

  // Theme configurations - memoized to prevent recreation on each render
  const themes = useMemo(() => ({
    light: {
      primary: 'bg-white',
      secondary: 'bg-white',
      accent: 'bg-blue-500',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100',
      searchBg: 'bg-gray-100',
      inputBg: 'bg-gray-100',
      sidebar: 'bg-white',
      message: {
        sent: 'bg-blue-500 text-white',
        received: 'bg-gray-100 text-gray-900'
      },
      shadow: 'shadow-lg'
    },
    mixed: {
      primary: 'bg-blue-50',
      secondary: 'bg-white',
      accent: 'bg-blue-600',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-50',
      searchBg: 'bg-blue-50',
      inputBg: 'bg-white',
      sidebar: 'bg-white',
      message: {
        sent: 'bg-blue-600 text-white',
        received: 'bg-blue-100 text-gray-800'
      },
      shadow: 'shadow-xl'
    },
    dark: {
      primary: 'bg-gray-900',
      secondary: 'bg-gray-800',
      accent: 'bg-blue-600',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      border: 'border-gray-700',
      hover: 'hover:bg-gray-700',
      searchBg: 'bg-gray-700',
      inputBg: 'bg-gray-700',
      sidebar: 'bg-gray-800',
      message: {
        sent: 'bg-blue-600 text-white',
        received: 'bg-gray-700 text-white'
      },
      shadow: 'shadow-2xl'
    }
  }), []);

  const currentTheme = useMemo(() => themes[theme], [themes, theme]);

  const value = useMemo(() => ({
    theme,
    timeOfDay,
    currentTheme,
    setTheme
  }), [theme, timeOfDay, currentTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div className="relative w-full h-screen">
        <CosmosBackground 
          opacity={0.3} 
          theme={theme}
          showStars={true}
          showNebula={true}
          showParticles={true}
          className="cosmos-background"
        />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};