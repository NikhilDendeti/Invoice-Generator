import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const ThemeToggle = ({ className = '' }) => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!mounted) {
    return (
      <div className={`w-12 h-12 rounded-xl bg-gray-200 animate-pulse ${className}`}></div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/20 shadow-lg">
        <button
          onClick={() => toggleTheme('light')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white text-gray-900 shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          title="Light mode"
        >
          <FiSun className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => toggleTheme('dark')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          title="Dark mode"
        >
          <FiMoon className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => toggleTheme('system')}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
            theme === 'system'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          title="System theme"
        >
          <FiMonitor className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
