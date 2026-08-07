import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

// Night mode is permanent — no toggle, no light mode.
export const useTheme = () => useContext(ThemeContext) || { isLightMode: false, toggleTheme: () => {} };

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Always force dark/night mode. Clear any saved light preference.
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ isLightMode: false, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
