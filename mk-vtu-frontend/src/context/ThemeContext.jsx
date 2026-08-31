import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext) || { isLightMode: true, toggleTheme: () => {} };

export const ThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(() => {
    // The dashboard's day/night button used to write a separate
    // 'fintech_day_mode' flag that never actually drove this theme
    // (see FintechHeader.jsx history) — honor it as the user's real
    // prior choice. Otherwise default to light: 'theme' may already be
    // stuck at 'dark' from that disconnected default, not a real choice.
    const legacyDayMode = localStorage.getItem('fintech_day_mode');
    if (legacyDayMode !== null) return legacyDayMode !== 'false';
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
