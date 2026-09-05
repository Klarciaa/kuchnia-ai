import { useState, useMemo, FormEvent } from 'react';
import { ShoppingItem, UnitType } from '../../types';
import { CustomSelect } from '../common/CustomSelect';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ScanBarcode,
} from 'lucide-react';

interface ShoppingTabProps {
  shoppingList: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  onDeleteItem: (id: string) => void;
  onTransferCheckedToPantry: () => void;
  onClearChecked: () => void;
  onOpenBarcodeScanner?: () => void;
}

export function ShoppingTab({
  shoppingList,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onTransferCheckedToPantry,
  onClearChecked,
  onOpenBarcodeScanner,
}: ShoppingTabProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<UnitType>('szt');
  const [newItemCategory, setNewItemCategory] = useState('Inne');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    shoppingList.forEach(item => {
      const cat = item.category || 'Inne';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [shoppingList]);

  // Calculations
  const totalItemsCount = shoppingList.length;
  const checkedItems = shoppingList.filter(i => i.checked);
  const checkedCount = checkedItems.length;

  const estimatedTotal = useMemo(() => {
    return shoppingList.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [shoppingList]);

  const handleManualAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddItem({
      name: newItemName.trim(),
      amount: Number(newItemAmount) || 1,
      unit: newItemUnit,
      category: newItemCategory,
      price: Number(newItemPrice) || 0,
      isAuto: false,
    });

    setNewItemName('');
    setNewItemAmount(1);
    setNewItemPrice(0);
  };

  const handleTransfer = () => {
    if (checkedCount === 0) return;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#FFE4E6', '#F59E0B'],
    });
    onTransferCheckedToPantry();
  };

  const unitOptions = [
    { value: 'szt', label: 'szt' },
    { value: 'g', label: 'g' },
    { value: 'ml', label: 'ml' },
    { value: 'opak', label: 'opak' },
  ];

  const categoryOptions = [
    { value: 'Nabiał', label: '🧀 Nabiał' },
    { value: 'Warzywa i owoce', label: '🥦 Warzywa i owoce' },
    { value: 'Pieczywo', label: '🥖 Pieczywo' },
    { value: 'Mięso i ryby', label: '🥩 Mięso i ryby' },
    { value: 'Sypkie i makarony', label: '🌾 Sypkie i makarony' },
    { value: 'Napoje', label: '🥤 Napoje' },
    { value: 'Przyprawy', label: '🧂 Przyprawy' },
    { value: 'Inne', label: '📦 Inne' },
  ];

  return (
    <div className="space-y-4 pb-24" id="shopping-tab-content">
      {/* Top Banner with Stats */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
              Lista zakupów
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
              {checkedCount} / {totalItemsCount} kupione
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Szacowany koszt: <strong className="text-stone-800 font-semibold">{estimatedTotal.toFixed(2)} zł</strong>
          </p>
        </div>

        {onOpenBarcodeScanner && (
          <button
            type="button"
            onClick={onOpenBarcodeScanner}
            className="flex items-center gap-2 px-3.5 py-2 bg-stone-50 hover:bg-rose-50/50 text-stone-700 border border-stone-200 rounded-xl text-xs font-medium transition-colors self-start sm:self-auto"
            id="btn-shopping-barcode-scanner"
          >
            <ScanBarcode className="w-4 h-4 text-rose-500" />
            <span>Skanuj kod</span>
          </button>
        )}
      </div>

      {/* Magic Transfer Button Banner when items are checked */}
      {checkedCount > 0 && (
        <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-900 pl-1">
            <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Kupiono {checkedCount} {checkedCount === 1 ? 'produkt' : 'produkty'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearChecked}
              className="px-2.5 py-1.5 text-stone-500 hover:text-rose-600 text-xs font-medium rounded-lg hover:bg-white/60 transition-colors"
              title="Wyczyść zaznaczone"
            >
              Wyczyść
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              className="py-1.5 px-3.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shadow-rose-200 flex items-center gap-1.5"
              id="btn-transfer-to-pantry"
            >
              <span>Przenieś do spiżarni</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      <form
        onSubmit={handleManualAdd}
        className="p-4 bg-white rounded-2xl border border-rose-100/80 shadow-xs space-y-3 relative z-20"
      >
        <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
          Szybkie dodawanie
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            placeholder="Wpisz nazwę produktu (np. Mleko, Masło)..."
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:outline-none placeholder:text-stone-400 transition-all"
            id="input-shopping-item-name"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shrink-0 shadow-xs shadow-rose-200"
            id="btn-add-shopping-item"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Amount & Unit */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0.1"
              step="any"
              value={newItemAmount}
              onChange={e => setNewItemAmount(parseFloat(e.target.value) || 1)}
              className="w-14 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-bold text-center"
              title="Ilość"
            />
            <CustomSelect
              value={newItemUnit}
              onChange={val => setNewItemUnit(val as UnitType)}
              options={unitOptions}
              className="w-20"
              buttonClassName="py-1.5 px-2 text-xs font-semibold"
            />
          </div>

          {/* Category */}
          <div className="flex-1 min-w-[140px]">
            <CustomSelect
              value={newItemCategory}
              onChange={val => setNewItemCategory(val)}
              options={categoryOptions}
              className="w-full"
              buttonClassName="py-1.5 px-2.5 text-xs"
            />
          </div>

          {/* Price */}
          <div className="w-24 shrink-0">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Cena (zł)"
              value={newItemPrice || ''}
              onChange={e => setNewItemPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400"
            />
          </div>
        </div>
      </form>

      {/* Shopping List grouped by Category */}
      {totalItemsCount === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 text-stone-400">
          <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <p className="font-bold text-base text-stone-700">Twoja lista zakupów jest pusta</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Gdy zapasy w spiżarni spadną poniżej 25% lub w przepisie zabraknie składników, pojawią
            się tutaj automatycznie!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.entries(groupedItems) as [string, ShoppingItem[]][]).map(([cat, items]) => (
            <div
              key={cat}
              className="bg-white rounded-2xl border border-rose-100/80 shadow-xs overflow-hidden"
            >
              <div className="p-3 sm:px-4 bg-stone-50/70 border-b border-rose-100/60 flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-stone-800">
                  {cat} ({items.length})
                </span>
                <span className="text-xs text-rose-700/80 font-semibold">
                  ~{items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2)} zł
                </span>
              </div>

              <div className="p-2 sm:p-3 space-y-1.5">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      item.checked
                        ? 'bg-stone-50/60 text-stone-400 border border-transparent'
                        : 'bg-white hover:bg-rose-50/30 border border-stone-200/60'
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer select-none min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggleItem(item.id)}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-stone-300 cursor-pointer accent-rose-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium truncate ${
                              item.checked ? 'line-through text-stone-400' : 'text-stone-900 font-semibold'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.isAuto && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 font-medium px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 border border-rose-200/60">
                              <Sparkles className="w-2.5 h-2.5 text-rose-500" /> Auto
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500">
                          {item.amount} {item.unit}
                          {item.price ? ` · ~${item.price.toFixed(2)} zł` : ''}
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                      title="Usuń z listy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
