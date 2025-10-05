import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = ({ className = "" }) => {
  const { theme, setTheme, isDark } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={18} />;
      case 'dark':
        return <Moon size={18} />;
      default:
        return <Monitor size={18} />;
    }
  };

  const cycleTheme = () => {
    const themes = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className={`
        p-2 rounded-lg border transition-colors duration-200
        ${isDark 
          ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200' 
          : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
        }
        ${className}
      `}
      title={`Current theme: ${theme}`}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;