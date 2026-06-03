import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to }) => {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(to)} className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all active:scale-95" title="Назад">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;
