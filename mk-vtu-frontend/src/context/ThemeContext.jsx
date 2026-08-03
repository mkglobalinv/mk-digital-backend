import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext) || { theme: "light", toggleTheme: () => {} };

export const ThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('dashboardTheme');
    if (savedTheme) {
      return savedTheme === 'light';
    }
    // Default to day mode as per business requirements
    return true;
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
