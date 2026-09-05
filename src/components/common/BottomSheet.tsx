import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  id = 'bottom-sheet',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" id={id}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal Container */}
      <div className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-rose-100/80 z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-rose-200/80" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-3.5 border-b border-rose-100/60">
          <div>
            <h3 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
