import React, { useRef, useCallback, useEffect } from 'react';

interface PixelOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const PixelOtpInput: React.FC<PixelOtpInputProps> = ({ value, onChange, length = 4 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const slots = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
    if (inputRef.current) {
      inputRef.current.selectionStart = inputRef.current.value.length;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(value.slice(0, -1));
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  }, [value, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const filtered = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
    onChange(filtered);
    if (filtered.length >= length) {
      e.currentTarget.blur();
    }
  }, [length, onChange]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        maxLength={length}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        autoFocus
        autoCapitalize="characters"
        autoComplete="off"
        inputMode="text"
      />
      <div
        className="flex gap-2 justify-center select-none"
        onClick={handleContainerClick}
      >
        {slots.map((char, i) => (
          <div
            key={i}
            className={`
              w-14 h-16 flex items-center justify-center
              text-2xl font-bold font-mono uppercase
              border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)]
              transition-all duration-100
              ${char
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface border-gray-300 dark:border-gray-600 text-text-primary'
              }
              ${value.length === i
                ? 'ring-2 ring-primary/50 border-primary'
                : ''
              }
              dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]
            `}
          >
            {char}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PixelOtpInput;
