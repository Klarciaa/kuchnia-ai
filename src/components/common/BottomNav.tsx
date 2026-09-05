import { ActiveTab } from '../../types';
import { Refrigerator, ChefHat, CalendarDays, ShoppingBag } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  shoppingBadgeCount: number;
}

export function BottomNav({ activeTab, onTabChange, shoppingBadgeCount }: BottomNavProps) {
  const tabs = [
    { id: 'pantry' as ActiveTab, label: 'Spiżarnia', icon: Refrigerator },
    { id: 'recipes' as ActiveTab, label: 'Przepisy', icon: ChefHat },
    { id: 'planner' as ActiveTab, label: 'Planer', icon: CalendarDays },
    {
      id: 'shopping' as ActiveTab,
      label: 'Zakupy',
      icon: ShoppingBag,
      badge: shoppingBadgeCount,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100/80 safe-bottom shadow-lg shadow-rose-950/5"
      id="bottom-navigation-bar"
    >
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3.5 rounded-xl transition-all ${
                isActive
                  ? 'text-rose-600'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              id={`nav-tab-${tab.id}`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-2xl transition-all ${
                    isActive ? 'bg-rose-50 text-rose-600 scale-105 shadow-xs shadow-rose-100' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                </div>

                {/* Badge for Shopping or alerts */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in"
                    id="shopping-badge-count"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-rose-700' : 'font-medium text-stone-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
