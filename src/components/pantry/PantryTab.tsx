import { useState, useMemo } from 'react';
import { PantryItem, StorageZone } from '../../types';
import { ProductCard } from './ProductCard';
import { AddProductModal } from './AddProductModal';
import { getEffectiveExpiry } from '../../utils/kitchenLogic';
import { LOW_STOCK_RATIO } from '../../constants/mockData';
import { Plus, Search, Refrigerator, Snowflake, Archive, Sparkles, Filter } from 'lucide-react';

interface PantryTabProps {
  pantry: PantryItem[];
  customCategories: string[];
  onAddProduct: (item: Omit<PantryItem, 'id'>) => void;
  onUpdateProduct: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteProduct: (id: string) => void;
  onMarkAsOpened: (id: string) => void;
  onAdjustAmount: (id: string, delta: number) => void;
  onAddCustomCategory: (cat: string) => void;
  onOpenAiChef: () => void;
}

export function PantryTab({
  pantry,
  customCategories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onMarkAsOpened,
  onAdjustAmount,
  onAddCustomCategory,
  onOpenAiChef,
}: PantryTabProps) {
  const [selectedZone, setSelectedZone] = useState<'all' | StorageZone>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  // Stats
  const stats = useMemo(() => {
    let warningCount = 0;
    let lowStockCount = 0;
    let totalValue = 0;

    pantry.forEach(item => {
      const exp = getEffectiveExpiry(item);
      if (exp.status === 'warning' || exp.status === 'expired') {
        warningCount++;
      }
      const ratio = item.totalAmount > 0 ? item.currentAmount / item.totalAmount : 0;
      if (ratio <= LOW_STOCK_RATIO || item.currentAmount === 0) {
        lowStockCount++;
      }
      if (item.price) {
        totalValue += (item.currentAmount / (item.totalAmount || 1)) * item.price;
      }
    });

    return { warningCount, lowStockCount, totalValue };
  }, [pantry]);

  // Extract unique categories in pantry
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    pantry.forEach(i => cats.add(i.category));
    return Array.from(cats);
  }, [pantry]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return pantry.filter(item => {
      if (selectedZone !== 'all' && item.zone !== selectedZone) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (
        searchQuery.trim() &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    });
  }, [pantry, selectedZone, selectedCategory, searchQuery]);

  const handleEdit = (item: PantryItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleSaveModal = (data: Omit<PantryItem, 'id'>) => {
    if (editingItem) {
      onUpdateProduct(editingItem.id, data);
      setEditingItem(null);
    } else {
      onAddProduct(data);
    }
  };

  return (
    <div className="space-y-5" id="pantry-tab-content">
      {/* Top Summary Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
              Twoja Spiżarnia
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
              {pantry.length} produktów
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Zarządzaj zapasami w lodówce, zamrażalniku i szafkach kuchennych
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-2">
          {stats.warningCount > 0 && (
            <button
              type="button"
              onClick={onOpenAiChef}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/70 text-rose-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Krótka data ({stats.warningCount})</span>
            </button>
          )}

          <div className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-600 font-medium">
            Wartość: <strong className="text-stone-900 font-semibold">{stats.totalValue.toFixed(2)} zł</strong>
          </div>
        </div>
      </div>

      {/* Zone Filters and Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Zone Selector */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/80 rounded-xl border border-rose-100/60 sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedZone('all')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              selectedZone === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            id="zone-btn-all"
          >
            Wszystko
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('fridge')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedZone === 'fridge'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            id="zone-btn-fridge"
          >
            <Refrigerator className="w-3.5 h-3.5 text-rose-500" /> Lodówka
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('freezer')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedZone === 'freezer'
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            id="zone-btn-freezer"
          >
            <Snowflake className="w-3.5 h-3.5 text-sky-600" /> Zamrażalnik
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone('drawers')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedZone === 'drawers'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
            id="zone-btn-drawers"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" /> Szafki
          </button>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Szukaj produktu po nazwie..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 placeholder:text-stone-400 transition-all"
              id="input-search-pantry"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shadow-rose-200 shrink-0"
            id="btn-add-product-main"
          >
            <Plus className="w-4 h-4" /> Dodaj produkt
          </button>
        </div>
      </div>

      {/* Category Filter Pills (if categories exist) */}
      {availableCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Wszystkie ({pantry.length})
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-rose-50/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 text-stone-500">
          <Archive className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <p className="font-bold text-base text-stone-800">Brak produktów</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Nie znaleziono pasujących produktów w tej strefie. Zmień filtr lub dodaj nowy produkt.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors border border-emerald-200"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj pierwszy produkt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={onDeleteProduct}
              onMarkAsOpened={onMarkAsOpened}
              onAdjustAmount={onAdjustAmount}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveModal}
        editItem={editingItem}
        customCategories={customCategories}
        onAddCustomCategory={onAddCustomCategory}
      />
    </div>
  );
}
