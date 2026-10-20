import React from 'react';
import { Home, CalendarCheck, Navigation } from 'lucide-react';
import { BottomNavTab } from '../../types';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  pendingBookingsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingBookingsCount = 0,
}) => {
  const tabs: { id: BottomNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'trips', label: 'Trips', icon: Navigation },
  ];

  return (
    <nav className="relative z-20 w-full bg-white/95 backdrop-blur-md border-t border-[#6FA5A5]/30 px-6 py-2 shadow-lg">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all duration-200
                ${isActive ? 'text-[#075B64]' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5] text-[#075B64]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.id === 'bookings' && pendingBookingsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F5B83D] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                    {pendingBookingsCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-semibold tracking-tight transition-colors ${
                  isActive ? 'text-[#075B64] font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B83D] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
