import { useState, useMemo } from 'react';
import { PlannedMealItem, UserGoals, PantryItem, MealSlot } from '../../types';
import { DonutChart } from './DonutChart';
import { AddMealModal } from './AddMealModal';
import { GoalsModal } from './GoalsModal';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { formatDate } from '../../constants/mockData';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Archive,
  ChevronLeft,
  ChevronRight,
  ScanBarcode,
} from 'lucide-react';

interface PlannerTabProps {
  plannedMeals: PlannedMealItem[];
  goals: UserGoals;
  pantry: PantryItem[];
  onAddMeal: (meal: Omit<PlannedMealItem, 'id'>) => void;
  onDeleteMeal: (id: string, restorePantry?: boolean) => void;
  onSaveGoals: (goals: Partial<UserGoals>) => void;
  onOpenBarcodeScanner?: () => void;
}

export function PlannerTab({
  plannedMeals,
  goals,
  pantry,
  onAddMeal,
  onDeleteMeal,
  onSaveGoals,
  onOpenBarcodeScanner,
}: PlannerTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [activeSlotForAdd, setActiveSlotForAdd] = useState<MealSlot>('lunch');

  // Generate 7-day horizontal strip around selectedDate
  const dateStrip = useMemo(() => {
    const current = new Date(selectedDate);
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
    const todayStr = formatDate(new Date());

    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      const dateStr = formatDate(d);
      days.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [selectedDate]);

  // Meals for selected date
  const dayMeals = useMemo(() => {
    return plannedMeals.filter(m => m.date === selectedDate);
  }, [plannedMeals, selectedDate]);

  // Nutritional totals for selected date
  const totals = useMemo(() => {
    return dayMeals.reduce(
      (acc, m) => {
        acc.kcal += m.kcal || 0;
        acc.protein += m.protein || 0;
        acc.fat += m.fat || 0;
        acc.carbs += m.carbs || 0;
        return acc;
      },
      { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }, [dayMeals]);

  const slotsConfig: { id: MealSlot; title: string; icon: string }[] = [
    { id: 'breakfast', title: 'Śniadanie', icon: '🥣' },
    { id: 'second_breakfast', title: 'II Śniadanie', icon: '🥪' },
    { id: 'lunch', title: 'Obiad', icon: '🍲' },
    { id: 'dinner', title: 'Kolacja', icon: '🥗' },
  ];

  const handleOpenAddForSlot = (slot: MealSlot) => {
    setActiveSlotForAdd(slot);
    setIsAddMealModalOpen(true);
  };

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };

  // Macro progress percentages
  const proteinPercent = Math.min(100, Math.round((totals.protein / (goals.proteinGoal || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / (goals.fatGoal || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbs / (goals.carbsGoal || 1)) * 100));

  return (
    <div className="space-y-4 pb-24" id="planner-tab-content">
      {/* Date Navigation Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-rose-600 transition-colors px-3 py-1 rounded-lg hover:bg-rose-50/50"
            id="btn-open-planner-calendar"
          >
            <CalendarIcon className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-sm text-stone-900">{selectedDate}</span>
          </button>

          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Optional expanded date picker */}
        {isDatePickerOpen && (
          <div className="pt-2 border-t border-stone-150">
            <CustomDatePicker
              value={selectedDate}
              onChange={d => {
                setSelectedDate(d);
                setIsDatePickerOpen(false);
              }}
              id="planner-day-picker"
            />
          </div>
        )}

        {/* Horizontal 7-day strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1">
          {dateStrip.map(d => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDate(d.dateStr)}
                className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center ${
                  isSelected
                    ? 'bg-rose-500 text-white shadow-xs shadow-rose-200'
                    : 'hover:bg-rose-50/60 text-stone-600'
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase ${
                    isSelected ? 'text-rose-100' : 'text-stone-400'
                  }`}
                >
                  {d.dayName}
                </span>
                <span className="text-xs font-bold mt-0.5">{d.dayNum}</span>
                {d.isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Barcode Scanner */}
      {onOpenBarcodeScanner && (
        <button
          type="button"
          onClick={onOpenBarcodeScanner}
          className="w-full py-2.5 px-4 bg-white hover:bg-rose-50/40 text-stone-800 border border-rose-100/80 rounded-xl font-medium text-xs flex items-center justify-between transition-all shadow-2xs"
          id="btn-planner-snack-scanner"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-stone-900">Skaner kodów kreskowych</span>
              <span className="hidden sm:inline text-stone-500 ml-2">
                Zeskanuj produkt, aby dodać do dziennika
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60">
            Skanuj
          </span>
        </button>
      )}

      {/* Calories & Macro Dashboard Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Bilans Kaloryczny Dnia
          </div>
          <button
            type="button"
            onClick={() => setIsGoalsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-rose-600 bg-stone-50 hover:bg-rose-50/50 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
            id="btn-edit-diet-goals"
          >
            <Sliders className="w-3.5 h-3.5 text-stone-500" />
            <span>Cele (TDEE)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
          {/* Donut Chart */}
          <div className="shrink-0">
            <DonutChart
              consumedKcal={totals.kcal}
              targetKcal={goals.kcalGoal || 2000}
            />
          </div>

          {/* Macro Progress Bars */}
          <div className="flex-1 w-full space-y-3">
            {/* Protein */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Białko</span>
                <span className="text-[11px] text-stone-500">
                  <strong className="text-stone-900 font-bold">{Math.round(totals.protein)}g</strong> / {goals.proteinGoal || 120}g
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Tłuszcz</span>
                <span className="text-[11px] text-stone-500">
                  <strong className="text-stone-900 font-bold">{Math.round(totals.fat)}g</strong> / {goals.fatGoal || 60}g
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Węglowodany</span>
                <span className="text-[11px] text-stone-500">
                  <strong className="text-stone-900 font-bold">{Math.round(totals.carbs)}g</strong> / {goals.carbsGoal || 200}g
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slots Accordion / Sections */}
      <div className="space-y-3">
        {slotsConfig.map(slot => {
          const mealsInSlot = dayMeals.filter(m => m.mealSlot === slot.id);
          const slotKcal = mealsInSlot.reduce((sum, m) => sum + (m.kcal || 0), 0);

          return (
            <div
              key={slot.id}
              className="bg-white rounded-2xl border border-rose-100/80 shadow-xs overflow-hidden"
              id={`meal-slot-${slot.id}`}
            >
              {/* Header */}
              <div className="p-3.5 sm:p-4 bg-stone-50/70 flex items-center justify-between border-b border-rose-100/60">
                <div className="flex items-center gap-2">
                  <span className="text-base">{slot.icon}</span>
                  <span className="font-bold text-sm sm:text-base text-stone-900">{slot.title}</span>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-md border border-rose-200/60">
                    {slotKcal} kcal
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddForSlot(slot.id)}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs shadow-rose-200"
                  id={`btn-add-meal-${slot.id}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj</span>
                </button>
              </div>

              {/* Meals List */}
              <div className="p-3 sm:p-4">
                {mealsInSlot.length === 0 ? (
                  <div className="py-3 text-center text-xs text-stone-400">
                    Brak zaplanowanych dań
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mealsInSlot.map(meal => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50/40 border border-stone-200/70 text-xs transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-stone-900 truncate">
                              {meal.name}
                            </span>
                            {meal.isPantrySource && (
                              <span className="text-[10px] bg-rose-50 text-rose-800 font-medium px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 border border-rose-200/60">
                                <Archive className="w-2.5 h-2.5" /> Spiżarnia
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {meal.amount} {meal.unit} · B:{meal.protein}g · T:{meal.fat}g · W:
                            {meal.carbs}g
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-bold text-stone-900">{meal.kcal} kcal</span>
                          <button
                            type="button"
                            onClick={() => {
                              const restore = meal.isPantrySource
                                ? window.confirm(
                                    `Czy chcesz zwrócić ${meal.amount} ${meal.unit} "${meal.name}" z powrotem do stanu spiżarni?`
                                  )
                                : false;
                              onDeleteMeal(meal.id, restore);
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                            title="Usuń posiłek"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={isAddMealModalOpen}
        onClose={() => setIsAddMealModalOpen(false)}
        date={selectedDate}
        defaultSlot={activeSlotForAdd}
        pantry={pantry}
        onAddMeal={onAddMeal}
      />

      {/* Goals Modal */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={goals}
        onSaveGoals={onSaveGoals}
      />
    </div>
  );
}
