import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to }) => {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(to)} className="w-9 h-9 rounded-[0.3rem_1rem_0.3rem_1rem] bg-surface border border-border/80 flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 hover:-translate-x-0.5 shadow-studio transition-all duration-200 active:scale-95" title="Назад">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;
