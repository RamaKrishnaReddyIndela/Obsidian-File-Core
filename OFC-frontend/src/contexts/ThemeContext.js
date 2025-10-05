import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/axios';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Function to determine the actual theme
  const determineTheme = (themePreference) => {
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference;
  };

  // Apply theme to document
  const applyTheme = (actualTheme) => {
    const root = document.documentElement;
    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setResolvedTheme(actualTheme);
  };

  // Load theme from user profile or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First try to get from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme);
          const actualTheme = determineTheme(savedTheme);
          applyTheme(actualTheme);
        }

        // Then try to sync with user profile
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await api.get('/user/profile');
            const userTheme = response.data.user.preferences?.theme || 'system';
            if (userTheme !== savedTheme) {
              setTheme(userTheme);
              localStorage.setItem('theme', userTheme);
              const actualTheme = determineTheme(userTheme);
              applyTheme(actualTheme);
            }
          } catch (error) {
            console.warn('Failed to load user theme preference:', error);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to system theme
        const actualTheme = determineTheme('system');
        applyTheme(actualTheme);
      }
    };

    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const actualTheme = determineTheme('system');
        applyTheme(actualTheme);
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Update theme
  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const actualTheme = determineTheme(newTheme);
    applyTheme(actualTheme);

    // Try to sync with backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.put('/user/profile', {
          preferences: {
            theme: newTheme
          }
        });
      }
    } catch (error) {
      console.warn('Failed to sync theme with backend:', error);
    }
  };

  const value = {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};