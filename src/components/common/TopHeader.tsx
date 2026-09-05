import { Sparkles, ScanBarcode, Flame, RotateCcw, Refrigerator, ChefHat, CalendarDays, ShoppingBag } from 'lucide-react';
import { ActiveTab } from '../../types';

interface TopHeaderProps {
  onOpenAiChef: () => void;
  onOpenBarcodeScanner: () => void;
  onOpenGoalsModal?: () => void;
  onResetDemo: () => void;
  activeTab?: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
  shoppingBadgeCount?: number;
}

export function TopHeader({
  onOpenAiChef,
  onOpenBarcodeScanner,
  onOpenGoalsModal,
  onResetDemo,
  activeTab = 'pantry',
  onTabChange,
  shoppingBadgeCount = 0,
}: TopHeaderProps) {
  const desktopTabs = [
    { id: 'pantry' as ActiveTab, label: 'Spiżarnia', icon: Refrigerator },
    { id: 'recipes' as ActiveTab, label: 'Przepisy', icon: ChefHat },
    { id: 'planner' as ActiveTab, label: 'Planer posiłków', icon: CalendarDays },
    { id: 'shopping' as ActiveTab, label: 'Lista zakupów', icon: ShoppingBag, badge: shoppingBadgeCount },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-rose-100/80" id="main-header">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-xs shadow-rose-200">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none">
                Moja Kuchnia
              </h1>
              <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.2 rounded-full border border-rose-200/60">
                ✨ cozy
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5 hidden sm:block">
              Twój przyjazny asystent spiżarni i posiłków
            </p>
          </div>
        </div>

        {/* Desktop inline tabs */}
        {onTabChange && (
          <nav className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-2xl border border-rose-100/60" id="desktop-nav-tabs">
            {desktopTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-rose-600 shadow-xs shadow-rose-100'
                      : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAiChef}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors border border-rose-200/70 shadow-xs"
            title="AI Szefowa Kuchni - Co przygotować ze składników?"
            id="btn-header-ai-chef"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">AI Szefowa</span>
          </button>

          <button
            type="button"
            onClick={onOpenBarcodeScanner}
            className="p-2 bg-white hover:bg-rose-50/60 text-stone-700 hover:text-rose-600 rounded-xl border border-stone-200/80 transition-colors shadow-xs"
            title="Skaner kodów kreskowych"
            id="btn-header-scanner"
          >
            <ScanBarcode className="w-4 h-4" />
          </button>

          {onOpenGoalsModal && (
            <button
              type="button"
              onClick={onOpenGoalsModal}
              className="p-2 bg-white hover:bg-rose-50/60 text-stone-700 hover:text-rose-600 rounded-xl border border-stone-200/80 transition-colors shadow-xs"
              title="Cele kalorii i makro"
              id="btn-header-goals"
            >
              <Flame className="w-4 h-4 text-rose-500" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Czy chcesz przywrócić domyślne przykładowe produkty i przepisy?')) {
                onResetDemo();
              }
            }}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            title="Przywróć dane demo"
            id="btn-header-reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
