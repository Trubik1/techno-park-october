import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggleButton: React.FC = () => {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ backgroundColor: dark ? '#4F46E5' : '#D1D5DB' }}
      aria-label={dark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
    >
      <span
        className={`absolute top-0.5 flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
          dark ? 'left-[calc(100%-1.75rem)]' : 'left-0.5'
        }`}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-500 ${
            dark ? 'text-primary rotate-45' : 'text-amber-500 -rotate-45'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          {dark ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          )}
        </svg>
      </span>
    </button>
  );
};

export default ThemeToggleButton;
