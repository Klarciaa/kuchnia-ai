import { useState, useEffect } from 'react';
import { UserGoals } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CustomSelect } from '../common/CustomSelect';
import { calculateTDEEGoals } from '../../utils/kitchenLogic';
import { Flame, Calculator, Sparkles, Check } from 'lucide-react';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  onSaveGoals: (goals: Partial<UserGoals>) => void;
}

export function GoalsModal({
  isOpen,
  onClose,
  goals,
  onSaveGoals,
}: GoalsModalProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>(goals.mode || 'auto');

  // Auto form
  const [gender, setGender] = useState<'female' | 'male'>(goals.gender || 'female');
  const [weightKg, setWeightKg] = useState<number>(goals.weightKg || 65);
  const [heightCm, setHeightCm] = useState<number>(goals.heightCm || 168);
  const [age, setAge] = useState<number>(goals.age || 28);
  const [activityLevel, setActivityLevel] = useState<number>(goals.activityLevel || 1.55);
  const [goalType, setGoalType] = useState<'cut' | 'maintain' | 'bulk'>(
    goals.goalType || 'maintain'
  );

  // Manual values
  const [kcalGoal, setKcalGoal] = useState<number>(goals.kcalGoal || 2000);
  const [proteinGoal, setProteinGoal] = useState<number>(goals.proteinGoal || 130);
  const [fatGoal, setFatGoal] = useState<number>(goals.fatGoal || 65);
  const [carbsGoal, setCarbsGoal] = useState<number>(goals.carbsGoal || 220);

  useEffect(() => {
    setMode(goals.mode || 'auto');
    setGender(goals.gender || 'female');
    setWeightKg(goals.weightKg || 65);
    setHeightCm(goals.heightCm || 168);
    setAge(goals.age || 28);
    setActivityLevel(goals.activityLevel || 1.55);
    setGoalType(goals.goalType || 'maintain');
    setKcalGoal(goals.kcalGoal || 2000);
    setProteinGoal(goals.proteinGoal || 130);
    setFatGoal(goals.fatGoal || 65);
    setCarbsGoal(goals.carbsGoal || 220);
  }, [goals, isOpen]);

  // Live preview for auto mode
  const preview = calculateTDEEGoals({
    mode: 'auto',
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel,
    goalType,
    kcalGoal,
    proteinGoal,
    fatGoal,
    carbsGoal,
  });

  const handleSave = () => {
    if (mode === 'auto') {
      onSaveGoals({
        mode: 'auto',
        gender,
        weightKg,
        heightCm,
        age,
        activityLevel,
        goalType,
        ...preview,
      });
    } else {
      onSaveGoals({
        mode: 'manual',
        kcalGoal: Number(kcalGoal) || 2000,
        proteinGoal: Number(proteinGoal) || 120,
        fatGoal: Number(fatGoal) || 60,
        carbsGoal: Number(carbsGoal) || 200,
      });
    }
    onClose();
  };

  const activityOptions = [
    { value: '1.2', label: 'Siedzący tryb (brak ćwiczeń)' },
    { value: '1.375', label: 'Lekka aktywność (1-2 tren./tydz)' },
    { value: '1.55', label: 'Umiarkowana (3-4 tren./tydz)' },
    { value: '1.725', label: 'Wysoka (5-6 tren./tydz)' },
    { value: '1.9', label: 'Bardzo wysoka (zawodowa)' },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Cel Dietetyczny & TDEE"
      subtitle="Kalkulator zapotrzebowania kalorycznego"
      id="modal-goals-calculator"
    >
      <div className="space-y-4">
        {/* Mode Selector */}
        <div className="flex p-1 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'auto'
                ? 'bg-white text-[#D68C7A] shadow-xs'
                : 'text-[#9A8F85] hover:text-[#4A443E]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Kalkulator automatyczny (TDEE)
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'manual'
                ? 'bg-white text-[#4A443E] shadow-xs'
                : 'text-[#9A8F85] hover:text-[#4A443E]'
            }`}
          >
            Wpisz ręcznie
          </button>
        </div>

        {mode === 'auto' ? (
          /* Auto TDEE Form */
          <div className="space-y-3.5">
            {/* Gender */}
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                Płeć
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-[#D68C7A] text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A443E] hover:bg-[#F2ECE4]'
                  }`}
                >
                  👩 Kobieta
                </button>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-[#D68C7A] text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A443E] hover:bg-[#F2ECE4]'
                  }`}
                >
                  👨 Mężczyzna
                </button>
              </div>
            </div>

            {/* Weight, Height, Age */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Waga (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={weightKg}
                  onChange={e => setWeightKg(parseFloat(e.target.value) || 60)}
                  className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Wzrost (cm)
                </label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={heightCm}
                  onChange={e => setHeightCm(parseFloat(e.target.value) || 165)}
                  className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Wiek
                </label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={age}
                  onChange={e => setAge(parseInt(e.target.value) || 25)}
                  className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
            </div>

            {/* Activity Level */}
            <CustomSelect
              label="Poziom aktywności fizycznej"
              value={String(activityLevel)}
              onChange={v => setActivityLevel(parseFloat(v))}
              options={activityOptions}
            />

            {/* Goal Type */}
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                Cel sylwetkowy
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalType('cut')}
                  className={`py-2.5 px-1 text-center rounded-2xl text-xs font-bold transition-all ${
                    goalType === 'cut'
                      ? 'bg-[#D68C7A] text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A443E] hover:bg-[#F2ECE4]'
                  }`}
                >
                  📉 Redukcja (-18%)
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('maintain')}
                  className={`py-2.5 px-1 text-center rounded-2xl text-xs font-bold transition-all ${
                    goalType === 'maintain'
                      ? 'bg-[#7B8A75] text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A443E] hover:bg-[#F2ECE4]'
                  }`}
                >
                  ⚖️ Utrzymanie
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType('bulk')}
                  className={`py-2.5 px-1 text-center rounded-2xl text-xs font-bold transition-all ${
                    goalType === 'bulk'
                      ? 'bg-[#C27866] text-white shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A443E] hover:bg-[#F2ECE4]'
                  }`}
                >
                  💪 Masa (+15%)
                </button>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4A443E] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D68C7A]" />
                  Wyliczony dzienny bilans:
                </span>
                <span className="text-lg font-black text-[#D68C7A]">
                  {preview.kcalGoal} kcal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white p-2 rounded-xl border border-[#EBE6DF]">
                  <span className="text-[10px] text-[#9A8F85] block">Białko</span>
                  <strong className="text-[#4A443E]">{preview.proteinGoal}g</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EBE6DF]">
                  <span className="text-[10px] text-[#9A8F85] block">Tłuszcz</span>
                  <strong className="text-[#4A443E]">{preview.fatGoal}g</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EBE6DF]">
                  <span className="text-[10px] text-[#9A8F85] block">Węgle</span>
                  <strong className="text-[#4A443E]">{preview.carbsGoal}g</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Manual Inputs */
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
                Dzienny limit kalorii (Kcal)
              </label>
              <input
                type="number"
                value={kcalGoal}
                onChange={e => setKcalGoal(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm font-bold text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Białko (g)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={e => setProteinGoal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Tłuszcze (g)
                </label>
                <input
                  type="number"
                  value={fatGoal}
                  onChange={e => setFatGoal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1">
                  Węglowodany (g)
                </label>
                <input
                  type="number"
                  value={carbsGoal}
                  onChange={e => setCarbsGoal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-xs text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
          id="btn-save-goals"
        >
          <Check className="w-4 h-4" /> Zapisz cele w planerze
        </button>
      </div>
    </BottomSheet>
  );
}
