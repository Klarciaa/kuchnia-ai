import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  id?: string;
  dropUp?: boolean;
  alignRight?: boolean;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  placeholder = 'Wybierz...',
  id,
  dropUp = false,
  alignRight = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} id={id}>
      {label && (
        <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 active:scale-[0.99] ${buttonClassName}`}
      >
        <span className="truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-rose-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 min-w-full w-max max-w-[280px] max-h-60 overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-lg p-1 animate-in fade-in zoom-in-95 duration-150 ${
            alignRight ? 'right-0' : 'left-0'
          } ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                  isSelected
                    ? 'bg-rose-50 text-rose-800 font-semibold'
                    : 'text-stone-700 hover:bg-rose-50/40'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
