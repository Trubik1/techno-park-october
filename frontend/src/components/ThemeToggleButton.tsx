import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggleButton: React.FC = () => {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 flex items-center justify-center rounded-[0.3rem_1rem_0.3rem_1rem] border border-border/80 bg-surface text-text-secondary hover:text-primary hover:border-primary/30 shadow-studio hover:shadow-studio-hover transition-all duration-200 active:scale-95"
      aria-label={dark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
    >
      <svg
        className="w-4 h-4 transition-transform duration-500"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        {dark ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        )}
      </svg>
    </button>
  );
};

export default ThemeToggleButton;
