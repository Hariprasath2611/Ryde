import React from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Button } from '../common/Button';
import {
  Car,
  Wallet,
  Star,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DriverProfile, RecentTrip, BottomNavTab } from '../../types';

interface Screen5HomeDashboardProps {
  driver: DriverProfile;
  recentTrips: RecentTrip[];
  unreadNotifications: number;
  pendingBookingsCount: number;
  onToggleOnline: () => void;
  onNavigateToBookings: () => void;
  onNavigateToTrips: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTripClick: (trip: RecentTrip) => void;
  onBack?: () => void;
}

export const Screen5HomeDashboard: React.FC<Screen5HomeDashboardProps> = ({
  driver,
  recentTrips,
  unreadNotifications,
  pendingBookingsCount,
  onToggleOnline,
  onNavigateToBookings,
  onNavigateToTrips,
  onNotificationsClick,
  onProfileClick,
  onTripClick,
  onBack,
}) => {
  const latestTrip = recentTrips[0];

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'bookings') onNavigateToBookings();
    if (tab === 'trips') onNavigateToTrips();
  };

  return (
    <div className="relative h-full flex flex-col justify-between bg-[#DDF0F0] overflow-hidden min-h-0">
      <CornerDecorations />

      {/* Top Navigation */}
      <Header
        showBack
        onBack={onBack}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={driver.avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      {/* Main Scrollable Body */}
      <div className="relative z-10 flex-1 min-h-0 px-5 py-2 overflow-y-auto max-w-sm mx-auto w-full space-y-3.5">
        {/* Welcome Text */}
        <div className="text-left pt-1">
          <p className="text-sm font-semibold text-[#075B64]/80">
            Welcome Back
          </p>
          <h1 className="text-2xl font-black text-[#075B64] tracking-tight">
            {driver.fullName}
          </h1>
        </div>

        {/* Large Online / Offline Status Card */}
        <div className="bg-[#76A6A5] rounded-2xl p-5 text-center shadow-md relative overflow-hidden transition-all duration-300">
          {/* Subtle decorative background ring */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  driver.isOnline ? 'bg-emerald-400 animate-ping-small' : 'bg-slate-300'
                }`}
              />
              <span className="text-xs font-semibold text-white/90 tracking-wide">
                {driver.isOnline ? "you're online & accepting rides" : "you're offline"}
              </span>
            </div>

            <div className="w-full max-w-[200px] mt-1">
              <Button
                onClick={onToggleOnline}
                variant={driver.isOnline ? 'teal' : 'amber'}
                size="md"
                withArrow={!driver.isOnline}
                className="py-2.5 text-sm font-bold shadow-sm"
              >
                {driver.isOnline ? 'Go Offline ⏸' : 'Go Online'}
              </Button>
            </div>

            {driver.isOnline && (
              <p className="text-[11px] text-white/80 font-medium mt-2 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-[#F5B83D]" />
                Auto-matching new customer trips nearby
              </p>
            )}
          </div>
        </div>

        {/* Summary Grid: Trips Today & Today's Earnings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Trips Today */}
          <div className="bg-[#8CB8B8]/80 backdrop-blur-xs border border-[#6FA5A5]/60 rounded-xl p-3.5 flex flex-col justify-between text-left shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-[#075B64] mb-2">
              <Car className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xl font-black text-[#075B64] leading-tight">
                {driver.totalTripsToday}
              </p>
              <p className="text-[11px] font-bold text-[#075B64]/80 mt-0.5">
                Trips Today
              </p>
            </div>
          </div>

          {/* Today Earning */}
          <div className="bg-[#8CB8B8]/80 backdrop-blur-xs border border-[#6FA5A5]/60 rounded-xl p-3.5 flex flex-col justify-between text-left shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-[#075B64] mb-2">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xl font-black text-[#075B64] leading-tight">
                ₹{driver.todayEarnings.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] font-bold text-[#075B64]/80 mt-0.5">
                Today Earning
              </p>
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="bg-[#8CB8B8]/70 border border-[#6FA5A5]/60 rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 shadow-xs">
          <Star className="w-4 h-4 text-[#F5B83D] fill-[#F5B83D]" />
          <span className="text-sm font-extrabold text-[#075B64]">
            {driver.rating.toFixed(1)} Rating
          </span>
          <span className="text-xs text-[#075B64]/70 font-medium">
            (142 reviews)
          </span>
        </div>

        {/* Recent Trip Card */}
        {latestTrip && (
          <div
            onClick={() => onTripClick(latestTrip)}
            className="bg-[#8CB8B8]/80 hover:bg-[#8CB8B8] transition-all cursor-pointer border border-[#6FA5A5]/60 rounded-xl p-3.5 text-left shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-md bg-white/70 flex items-center justify-center text-[#075B64]">
                  <Car className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#075B64]">
                  Recent Trip
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#075B64] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="pl-1">
              <p className="text-sm font-bold text-[#075B64] flex items-center">
                {latestTrip.route}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#6FA5A5]/40 text-xs">
                <span className="font-extrabold text-[#075B64]">
                  ₹{latestTrip.fare}
                </span>
                <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                  {latestTrip.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Pending Booking Banner if pending */}
        {pendingBookingsCount > 0 && (
          <div
            onClick={onNavigateToBookings}
            className="bg-white/90 border-2 border-[#F5B83D] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white transition-all shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-[#F5B83D] animate-ping" />
              <div className="text-left">
                <p className="text-xs font-black text-[#075B64]">
                  {pendingBookingsCount} New Booking Request{pendingBookingsCount > 1 ? 's' : ''}!
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Tap to review and accept
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#075B64] bg-[#DDF0F0] px-2.5 py-1 rounded-full">
              View →
            </span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="home"
        onTabChange={handleTabChange}
        pendingBookingsCount={pendingBookingsCount}
      />
    </div>
  );
};
