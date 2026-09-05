import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { formatDate } from '../../constants/mockData';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  id?: string;
  minDate?: string;
}

const MONTH_NAMES_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const WEEK_DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export function CustomDatePicker({
  value,
  onChange,
  label,
  id = 'date-picker',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial selected date
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // In JS 0 is Sunday, 1 is Monday. We want 0 to be Monday:
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const handleSelectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(formatDate(d));
    setIsOpen(false);
  };

  const setToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatDate(today));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" id={id}>
      {label && (
        <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => {
          if (value) {
            const cur = new Date(value + 'T00:00:00');
            setViewYear(cur.getFullYear());
            setViewMonth(cur.getMonth());
          }
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-between px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-900 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20"
      >
        <span className="font-medium text-stone-900">{value || 'Wybierz datę'}</span>
        <CalendarIcon className="w-4 h-4 text-stone-400 ml-2 shrink-0" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-stone-900 text-base tracking-tight">
                {MONTH_NAMES_PL[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEK_DAYS_PL.map(wd => (
                <div key={wd} className="text-[11px] font-semibold text-stone-400 py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                const curDateStr = formatDate(new Date(viewYear, viewMonth, day));
                const isSelected = curDateStr === value;
                const isToday = curDateStr === formatDate(new Date());

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-xs shadow-rose-200'
                        : isToday
                        ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={setToday}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 py-1 px-2"
              >
                Dziś
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 py-1 px-2"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
