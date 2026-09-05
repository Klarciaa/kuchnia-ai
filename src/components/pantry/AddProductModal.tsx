import { useState, useEffect, FormEvent } from 'react';
import { PantryItem, StorageZone, UnitType } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { CustomSelect } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { addDays, DEFAULT_CATEGORIES } from '../../constants/mockData';
import { Plus, Search, Loader2 } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<PantryItem, 'id'>) => void;
  editItem?: PantryItem | null;
  customCategories: string[];
  onAddCustomCategory: (cat: string) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  onSave,
  editItem,
  customCategories,
  onAddCustomCategory,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [zone, setZone] = useState<StorageZone>('fridge');
  const [category, setCategory] = useState('Nabiał');
  const [currentAmount, setCurrentAmount] = useState<number>(250);
  const [totalAmount, setTotalAmount] = useState<number>(250);
  const [unit, setUnit] = useState<UnitType>('g');
  const [expiryDate, setExpiryDate] = useState(addDays(7));
  const [daysValidAfterOpen, setDaysValidAfterOpen] = useState<number | undefined>(undefined);
  const [kcalPer100g, setKcalPer100g] = useState<number>(100);
  const [proteinPer100g, setProteinPer100g] = useState<number>(5);
  const [fatPer100g, setFatPer100g] = useState<number>(3);
  const [carbsPer100g, setCarbsPer100g] = useState<number>(12);
  const [price, setPrice] = useState<number | undefined>(undefined);

  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // Search OpenFoodFacts suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setZone(editItem.zone);
      setCategory(editItem.category);
      setCurrentAmount(editItem.currentAmount);
      setTotalAmount(editItem.totalAmount);
      setUnit(editItem.unit);
      setExpiryDate(editItem.expiryDate);
      setDaysValidAfterOpen(editItem.daysValidAfterOpen);
      setKcalPer100g(editItem.kcalPer100g);
      setProteinPer100g(editItem.proteinPer100g);
      setFatPer100g(editItem.fatPer100g);
      setCarbsPer100g(editItem.carbsPer100g);
      setPrice(editItem.price);
    } else {
      setName('');
      setZone('fridge');
      setCategory('Nabiał');
      setCurrentAmount(250);
      setTotalAmount(250);
      setUnit('g');
      setExpiryDate(addDays(7));
      setDaysValidAfterOpen(undefined);
      setKcalPer100g(100);
      setProteinPer100g(5);
      setFatPer100g(3);
      setCarbsPer100g(12);
      setPrice(undefined);
    }
  }, [editItem, isOpen]);

  // Handle autocomplete search
  const handleNameChange = async (val: string) => {
    setName(val);
    if (val.trim().length >= 3 && !editItem) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/openfoodfacts/search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products?.slice(0, 4) || []);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (p: any) => {
    setName(p.name);
    if (p.kcalPer100g) setKcalPer100g(p.kcalPer100g);
    if (p.proteinPer100g !== undefined) setProteinPer100g(p.proteinPer100g);
    if (p.fatPer100g !== undefined) setFatPer100g(p.fatPer100g);
    if (p.carbsPer100g !== undefined) setCarbsPer100g(p.carbsPer100g);
    setSuggestions([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      zone,
      category,
      currentAmount: Number(currentAmount) || 0,
      totalAmount: Number(totalAmount) || Number(currentAmount) || 1,
      unit,
      expiryDate,
      daysValidAfterOpen: daysValidAfterOpen ? Number(daysValidAfterOpen) : undefined,
      kcalPer100g: Number(kcalPer100g) || 0,
      proteinPer100g: Number(proteinPer100g) || 0,
      fatPer100g: Number(fatPer100g) || 0,
      carbsPer100g: Number(carbsPer100g) || 0,
      price: price ? Number(price) : undefined,
    });
    onClose();
  };

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  const zoneOptions = [
    { value: 'fridge', label: '❄️ Lodówka' },
    { value: 'freezer', label: '🧊 Zamrażarka' },
    { value: 'drawers', label: '🥫 Szuflady (zapasy suche)' },
  ];

  const categoryOptions = allCategories.map(c => ({ value: c, label: c }));

  const unitOptions = [
    { value: 'g', label: 'Gramy (g)' },
    { value: 'ml', label: 'Mililitry (ml)' },
    { value: 'szt', label: 'Sztuki (szt)' },
    { value: 'opak', label: 'Opakowanie (opak)' },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'Edytuj produkt' : 'Dodaj produkt do spiżarni'}
      subtitle="Uzupełnij zapas i datę przydatności"
      id="modal-add-product"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input with suggestions */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
            Nazwa produktu *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="np. Twaróg chudy, Mleko migdałowe"
              className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] placeholder-[#9A8F85] focus:ring-2 focus:ring-[#D68C7A]/30 focus:border-[#D68C7A] focus:outline-none"
              id="input-product-name"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-3 text-[#9A8F85]">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-1 bg-white border border-[#EBE6DF] rounded-2xl shadow-lg p-1.5 space-y-1">
              <div className="text-[11px] font-bold text-[#9A8F85] px-2 py-1 flex items-center gap-1">
                <Search className="w-3 h-3" /> Podpowiedzi z bazy produktów:
              </div>
              {suggestions.map(s => (
                <button
                  key={s.code || s.name}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#F8EDE9] text-[#4A443E] rounded-xl transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold truncate">{s.name}</span>
                  <span className="text-[11px] text-[#9A8F85] ml-2 shrink-0">
                    {s.kcalPer100g} kcal/100g
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zone & Category */}
        <div className="grid grid-cols-2 gap-3">
          <CustomSelect
            label="Strefa przechowywania"
            value={zone}
            onChange={v => setZone(v as StorageZone)}
            options={zoneOptions}
            id="select-product-zone"
          />

          <div>
            <CustomSelect
              label="Kategoria"
              value={category}
              onChange={v => setCategory(v)}
              options={categoryOptions}
              id="select-product-category"
            />
          </div>
        </div>

        {/* Option to create custom category */}
        {!showAddCat ? (
          <button
            type="button"
            onClick={() => setShowAddCat(true)}
            className="text-xs font-semibold text-[#D68C7A] hover:underline flex items-center gap-1 -mt-1"
          >
            <Plus className="w-3 h-3" /> + Dodaj nową kategorię...
          </button>
        ) : (
          <div className="flex gap-2 items-center bg-[#FAF6F0] p-2.5 rounded-2xl border border-[#EBE6DF]">
            <input
              type="text"
              value={newCatInput}
              onChange={e => setNewCatInput(e.target.value)}
              placeholder="Wpisz nową kategorię"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
            />
            <button
              type="button"
              onClick={() => {
                if (newCatInput.trim()) {
                  onAddCustomCategory(newCatInput.trim());
                  setCategory(newCatInput.trim());
                  setNewCatInput('');
                  setShowAddCat(false);
                }
              }}
              className="px-3.5 py-1.5 bg-[#D68C7A] text-white text-xs font-bold rounded-xl hover:bg-[#C27866] transition-colors"
            >
              Dodaj
            </button>
            <button
              type="button"
              onClick={() => setShowAddCat(false)}
              className="text-xs text-[#9A8F85] hover:text-[#4A443E]"
            >
              Anuluj
            </button>
          </div>
        )}

        {/* Quantities & Unit */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
              Obecny stan
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={currentAmount}
              onChange={e => setCurrentAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
              id="input-current-amount"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
              Pełne opak.
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={totalAmount}
              onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
              id="input-total-amount"
            />
          </div>
          <CustomSelect
            label="Jednostka"
            value={unit}
            onChange={v => setUnit(v as UnitType)}
            options={unitOptions}
            id="select-product-unit"
          />
        </div>

        {/* Expiry Date & Days Valid After Open */}
        <div className="grid grid-cols-2 gap-3">
          <CustomDatePicker
            label="Data ważności"
            value={expiryDate}
            onChange={d => setExpiryDate(d)}
            id="datepicker-expiry"
          />

          <div>
            <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
              Ważne po otwarciu
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                placeholder="np. 3"
                value={daysValidAfterOpen ?? ''}
                onChange={e =>
                  setDaysValidAfterOpen(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
                id="input-days-after-open"
              />
              <span className="text-xs text-[#9A8F85] shrink-0 font-medium">dni</span>
            </div>
          </div>
        </div>

        {/* Macros on 100g */}
        <div className="p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
          <div className="text-xs font-bold text-[#4A443E] mb-2">
            Wartości odżywcze na 100g (lub 1 szt):
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <span className="text-[10px] text-[#9A8F85] font-semibold">Kcal</span>
              <input
                type="number"
                min="0"
                value={kcalPer100g}
                onChange={e => setKcalPer100g(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#9A8F85] font-semibold">Białko (g)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={proteinPer100g}
                onChange={e => setProteinPer100g(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#9A8F85] font-semibold">Tłuszcz (g)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fatPer100g}
                onChange={e => setFatPer100g(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#9A8F85] font-semibold">Węgle (g)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={carbsPer100g}
                onChange={e => setCarbsPer100g(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E]"
              />
            </div>
          </div>
        </div>

        {/* Optional Price */}
        <div>
          <label className="block text-[11px] font-semibold text-[#9A8F85] uppercase tracking-wider mb-1.5">
            Cena zakupu (opcjonalnie PLN)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="np. 4.99"
              value={price ?? ''}
              onChange={e => setPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EBE6DF] rounded-2xl text-sm text-[#4A443E] focus:ring-2 focus:ring-[#D68C7A]/30 focus:outline-none"
              id="input-product-price"
            />
            <span className="absolute right-3.5 top-2.5 text-xs text-[#9A8F85] font-semibold">
              zł
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            id="btn-submit-product"
          >
            {editItem ? 'Zapisz zmiany' : 'Dodaj do spiżarni'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
