import React from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Car, CheckCircle2, ChevronRight, Clock, MapPin, Flag, Wallet } from 'lucide-react';
import { RecentTrip, BottomNavTab } from '../../types';

interface TripsHistoryScreenProps {
  recentTrips: RecentTrip[];
  unreadNotifications: number;
  avatarUrl: string;
  pendingBookingsCount: number;
  onNavigateToHome: () => void;
  onNavigateToBookings: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
}

export const TripsHistoryScreen: React.FC<TripsHistoryScreenProps> = ({
  recentTrips,
  unreadNotifications,
  avatarUrl,
  pendingBookingsCount,
  onNavigateToHome,
  onNavigateToBookings,
  onNotificationsClick,
  onProfileClick,
}) => {
  const totalEarned = recentTrips.reduce((acc, t) => acc + t.fare, 0);

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'home') onNavigateToHome();
    if (tab === 'bookings') onNavigateToBookings();
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] overflow-hidden text-left">
      <CornerDecorations />

      <Header
        showBack
        onBack={onNavigateToHome}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      <div className="relative z-10 flex-1 px-5 py-2 overflow-y-auto max-w-sm mx-auto w-full space-y-4">
        {/* Title */}
        <div className="pt-1">
          <h1 className="text-xl font-black text-[#075B64] tracking-wider uppercase">
            MY TRIPS
          </h1>
          <p className="text-xs font-semibold text-[#075B64]/70 mt-0.5">
            Past completed trips & fares
          </p>
        </div>

        {/* Total Earned Header Card */}
        <div className="bg-[#76A6A5] rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wider">
              Completed Trips Total
            </span>
            <p className="text-2xl font-black text-white mt-0.5">
              ₹{totalEarned.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#F5B83D]" />
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          {recentTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-[#8CB8B8]/80 border border-[#6FA5A5]/60 rounded-xl p-3.5 shadow-xs transition-all hover:bg-[#8CB8B8]"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#6FA5A5]/40 text-xs">
                <span className="font-black text-[#075B64] flex items-center">
                  <Car className="w-3.5 h-3.5 mr-1" />
                  {trip.id}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {trip.date}, {trip.time}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#075B64]">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F5B83D] shrink-0" />
                  <span className="font-semibold truncate">{trip.pickupLocation}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#075B64] shrink-0" />
                  <span className="font-semibold truncate">{trip.destination}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#6FA5A5]/40">
                <span className="text-xs text-slate-600 font-medium">
                  {trip.vehicle}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-[#075B64]">
                    ₹{trip.fare}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {trip.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav
        activeTab="trips"
        onTabChange={handleTabChange}
        pendingBookingsCount={pendingBookingsCount}
      />
    </div>
  );
};
