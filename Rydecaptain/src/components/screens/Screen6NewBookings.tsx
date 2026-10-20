import React from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Button } from '../common/Button';
import {
  User,
  Car,
  MapPin,
  Flag,
  Clock,
  IndianRupee,
  AlertCircle,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { BookingRequest, BottomNavTab } from '../../types';

interface Screen6NewBookingsProps {
  bookings: BookingRequest[];
  unreadNotifications: number;
  avatarUrl: string;
  onAccept: (booking: BookingRequest) => void;
  onReject: (bookingId: string) => void;
  onNavigateToHome: () => void;
  onNavigateToTrips: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
}

export const Screen6NewBookings: React.FC<Screen6NewBookingsProps> = ({
  bookings,
  unreadNotifications,
  avatarUrl,
  onAccept,
  onReject,
  onNavigateToHome,
  onNavigateToTrips,
  onNotificationsClick,
  onProfileClick,
  onBack,
}) => {
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === 'home') onNavigateToHome();
    if (tab === 'trips') onNavigateToTrips();
  };

  return (
    <div className="relative h-full flex flex-col justify-between bg-[#DDF0F0] overflow-hidden min-h-0">
      <CornerDecorations />

      {/* Top Header */}
      <Header
        showBack
        onBack={onBack || onNavigateToHome}
        showActions
        unreadCount={unreadNotifications}
        avatarUrl={avatarUrl}
        onNotificationsClick={onNotificationsClick}
        onProfileClick={onProfileClick}
      />

      {/* Main Container */}
      <div className="relative z-10 flex-1 min-h-0 px-5 py-2 overflow-y-auto max-w-sm mx-auto w-full space-y-4">
        {/* Title */}
        <div className="text-left pt-1">
          <h1 className="text-xl font-black text-[#075B64] tracking-wider uppercase">
            NEW BOOKING
          </h1>
          <p className="text-xs font-semibold text-[#075B64]/70 mt-0.5">
            {pendingBookings.length} booking request{pendingBookings.length === 1 ? '' : 's'} waiting
          </p>
        </div>

        {/* Booking Cards List */}
        {pendingBookings.length === 0 ? (
          <div className="bg-white/80 border border-[#6FA5A5]/40 rounded-2xl p-8 text-center my-8 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#DDF0F0] flex items-center justify-center mx-auto text-[#075B64] mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#075B64]">No Pending Bookings</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
              You're all caught up! Stay online to receive the next customer trip.
            </p>
            <div className="mt-5">
              <Button
                variant="amber"
                size="sm"
                onClick={onNavigateToHome}
                className="max-w-[160px] mx-auto"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#7EAFA8] text-white rounded-2xl p-4 shadow-md border border-[#6FA5A5] transition-all hover:shadow-lg relative overflow-hidden"
              >
                {/* Subtle header badge */}
                <div className="flex items-center justify-between text-[11px] font-bold text-white/90 pb-2.5 mb-2.5 border-b border-white/20">
                  <span className="flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#F5B83D] mr-1" />
                    Trip ID: {booking.id}
                  </span>
                  <span className="bg-[#075B64]/40 px-2 py-0.5 rounded-full font-semibold">
                    {booking.distance} • ₹{booking.estimatedFare}
                  </span>
                </div>

                {/* 2-Column Info Grid matching Reference Screen 6 */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Left Column: Customer & Pick Up */}
                  <div className="space-y-3">
                    {/* Customer */}
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Customer
                      </p>
                      <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-sm text-white">
                        <User className="w-3.5 h-3.5 text-white/80 shrink-0" />
                        <span className="truncate">{booking.customerName}</span>
                      </div>
                    </div>

                    {/* Pick Up */}
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Pick Up
                      </p>
                      <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-sm text-white">
                        <MapPin className="w-3.5 h-3.5 text-[#F5B83D] shrink-0" />
                        <span className="truncate">{booking.pickupLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Vehicle & Drop */}
                  <div className="space-y-3">
                    {/* Vehicle */}
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Vehicle
                      </p>
                      <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-sm text-white">
                        <Car className="w-3.5 h-3.5 text-white/80 shrink-0" />
                        <span className="truncate">{booking.vehicleType}</span>
                      </div>
                    </div>

                    {/* Drop */}
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                        Drop
                      </p>
                      <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-sm text-white">
                        <Flag className="w-3.5 h-3.5 text-white/90 shrink-0" />
                        <span className="truncate">{booking.destination}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Amber ACCEPT & Dark Teal REJECT */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/20">
                  <Button
                    onClick={() => onAccept(booking)}
                    variant="amber"
                    size="md"
                    className="py-2.5 text-xs font-black uppercase tracking-wider shadow-sm"
                  >
                    ACCEPT
                  </Button>

                  <Button
                    onClick={() => onReject(booking.id)}
                    variant="teal"
                    size="md"
                    className="py-2.5 text-xs font-black uppercase tracking-wider bg-[#075B64] hover:bg-[#05444b] shadow-sm"
                  >
                    REJECT
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab="bookings"
        onTabChange={handleTabChange}
        pendingBookingsCount={pendingBookings.length}
      />
    </div>
  );
};
