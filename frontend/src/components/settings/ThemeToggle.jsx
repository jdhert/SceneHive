import React from 'react'

function ThemeToggle({ theme, onChange }) {
  const options = [
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
    { value: 'system', label: '시스템' },
  ]

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            theme === option.value
              ? 'bg-white/25 text-white font-medium'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
