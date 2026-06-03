import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-secondary/60 mb-3">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
          {item.path ? (
            <button onClick={() => navigate(item.path)} className="hover:text-primary transition-colors">{item.label}</button>
          ) : (
            <span className="text-text-primary font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
