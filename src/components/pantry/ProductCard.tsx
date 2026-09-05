import { PantryItem } from '../../types';
import { getEffectiveExpiry } from '../../utils/kitchenLogic';
import { LOW_STOCK_RATIO } from '../../constants/mockData';
import { Edit2, Trash2, Droplets, Plus, Minus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
  onMarkAsOpened: (id: string) => void;
  onAdjustAmount: (id: string, delta: number) => void;
}

export function ProductCard({
  item,
  onEdit,
  onDelete,
  onMarkAsOpened,
  onAdjustAmount,
}: ProductCardProps) {
  const expiryInfo = getEffectiveExpiry(item);
  const ratio = item.totalAmount > 0 ? item.currentAmount / item.totalAmount : 0;
  const isLowStock = ratio <= LOW_STOCK_RATIO || item.currentAmount === 0;

  // Step delta for quick buttons based on unit
  const step = item.unit === 'szt' || item.unit === 'opak' ? 1 : 50;

  const zoneNames: Record<string, string> = {
    fridge: 'Lodówka',
    freezer: 'Zamrażalnik',
    drawers: 'Szafka',
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 border border-rose-100/80 shadow-[0_2px_8px_rgba(240,210,215,0.12)] hover:shadow-md transition-all flex flex-col justify-between"
      id={`pantry-card-${item.id}`}
    >
      {/* Top row: Name, Category/Zone, Actions */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-stone-900 text-base leading-snug truncate">
              {item.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 font-medium">
              <span className="text-rose-700/80 font-semibold">{item.category}</span>
              <span>·</span>
              <span>{zoneNames[item.zone] || item.zone}</span>
              {isLowStock && (
                <>
                  <span>·</span>
                  <span className="text-rose-600 font-semibold">Kończy się</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Edytuj produkt"
              id={`btn-edit-pantry-${item.id}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Usuń produkt"
              id={`btn-delete-pantry-${item.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quantity and Steppers */}
        <div className="bg-stone-50/80 rounded-xl p-3 my-2.5 border border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Ilość</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-stone-900">{item.currentAmount}</span>
                <span className="text-xs text-stone-500 font-medium">/ {item.totalAmount} {item.unit}</span>
              </div>
            </div>

            {/* Tactile minus/plus stepper */}
            <div className="flex items-center gap-1 bg-white border border-rose-100 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => onAdjustAmount(item.id, -step)}
                disabled={item.currentAmount <= 0}
                className="w-7 h-7 rounded-lg text-stone-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
                title={`Zmniejsz o ${step} ${item.unit}`}
                id={`btn-minus-${item.id}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onAdjustAmount(item.id, step)}
                className="w-7 h-7 rounded-lg text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
                title={`Zwiększ o ${step} ${item.unit}`}
                id={`btn-plus-${item.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Minimalist level indicator bar */}
          <div className="w-full h-1.5 rounded-full bg-stone-200/70 overflow-hidden mt-2.5">
            <div
              className={`h-full transition-all duration-300 ${
                ratio <= 0.25 ? 'bg-amber-400' : 'bg-gradient-to-r from-rose-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expiry & status footer */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          {expiryInfo.status === 'expired' ? (
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70 font-semibold text-[11px]">
              <AlertCircle className="w-3 h-3" />
              {expiryInfo.statusLabel}
            </span>
          ) : expiryInfo.status === 'warning' ? (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 font-semibold text-[11px]">
              <Clock className="w-3 h-3" />
              {expiryInfo.statusLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {expiryInfo.statusLabel}
            </span>
          )}
        </div>

        {/* Days valid after open */}
        {item.daysValidAfterOpen && item.daysValidAfterOpen > 0 ? (
          item.openedAt ? (
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-emerald-600" />
              Otwarte
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMarkAsOpened(item.id)}
              className="text-[11px] font-medium text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
              id={`btn-mark-open-${item.id}`}
            >
              <Droplets className="w-3 h-3" />
              Oznacz otwarcie
            </button>
          )
        ) : item.price ? (
          <span className="text-[11px] text-stone-500">{item.price.toFixed(2)} zł</span>
        ) : null}
      </div>
    </div>
  );
}
