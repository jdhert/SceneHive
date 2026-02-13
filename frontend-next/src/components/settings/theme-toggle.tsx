'use client';

import React from 'react';

interface ThemeToggleProps {
  theme: string;
  onChange: (theme: string) => void;
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const options = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === opt.value
              ? 'bg-white/30 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
