import React, { useState, useEffect } from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FileUpload } from '../common/FileUpload';
import {
  BookingRequest,
  VehicleHandoverData,
} from '../../types';
import {
  CheckCircle2,
  Phone,
  MessageSquare,
  Navigation,
  MapPin,
  Flag,
  Car,
  User,
  ShieldCheck,
  Camera,
  Gauge,
  Fuel,
  Compass,
  AlertTriangle,
  Star,
  Wallet,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* STEP 1: Booking Accepted Confirmation                                      */
/* -------------------------------------------------------------------------- */
export const Workflow1BookingAccepted: React.FC<{
  booking: BookingRequest;
  onNext: () => void;
  onBack: () => void;
}> = ({ booking, onNext, onBack }) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-4">
        {/* Animated Checkmark Circle */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h1 className="text-2xl font-black text-[#075B64]">
          Booking Accepted!
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1 max-w-[260px]">
          Trip #{booking.id} assigned to you. Customer has been notified that you are on your way.
        </p>

        {/* Trip Card Preview */}
        <div className="bg-[#7EAFA8] text-white rounded-2xl p-4 w-full mt-6 shadow-md text-left">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
            <span className="font-bold flex items-center">
              <User className="w-3.5 h-3.5 mr-1" />
              {booking.customerName}
            </span>
            <span className="bg-[#075B64]/40 px-2 py-0.5 rounded text-[11px] font-bold">
              ₹{booking.estimatedFare}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#F5B83D] shrink-0" />
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Pickup</span>
                <span className="font-bold">{booking.pickupLocation}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Flag className="w-4 h-4 text-white shrink-0" />
              <div>
                <span className="text-[10px] text-white/70 block uppercase">Drop</span>
                <span className="font-bold">{booking.destination}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            withArrow
            onClick={onNext}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Navigate to Pickup
          </Button>
        </div>
      </div>

      <div className="relative z-10 pb-2 text-[11px] text-[#075B64]/70 font-semibold">
        Step 1 of 12 • Driver Trip Workflow
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 2: Customer Pickup & Trip Details                                     */
/* -------------------------------------------------------------------------- */
export const Workflow2PickupDetails: React.FC<{
  booking: BookingRequest;
  onArrived: () => void;
  onBack: () => void;
}> = ({ booking, onArrived, onBack }) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-5 py-4 overflow-hidden text-left">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold text-[#F5B83D] bg-[#075B64] px-2 py-0.5 rounded uppercase tracking-wider">
                En Route to Pickup
              </span>
              <h2 className="text-xl font-black text-[#075B64] mt-1">
                Heading to {booking.pickupLocation}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#075B64]">ETA</span>
              <p className="text-lg font-black text-[#F5B83D]">4 mins</p>
            </div>
          </div>

          {/* Styled Route Map Simulation */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-[#6FA5A5] shadow-md bg-slate-800 my-3">
            {/* Map Canvas Background */}
            <div className="absolute inset-0 bg-[#1e293b] opacity-90 flex items-center justify-center">
              {/* Simulated Map Streets */}
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path d="M 0 50 L 400 50" stroke="#334155" strokeWidth="8" />
                <path d="M 0 140 L 400 140" stroke="#334155" strokeWidth="12" />
                <path d="M 120 0 L 120 200" stroke="#334155" strokeWidth="10" />
                <path d="M 280 0 L 280 200" stroke="#334155" strokeWidth="8" />
                {/* Active GPS Route */}
                <path
                  d="M 60 140 L 120 140 L 120 50 L 280 50"
                  stroke="#F5B83D"
                  strokeWidth="5"
                  strokeDasharray="8 4"
                  fill="none"
                />
                {/* Driver Vehicle Marker */}
                <circle cx="60" cy="140" r="10" fill="#075B64" stroke="#FFF" strokeWidth="3" />
                {/* Destination Pin */}
                <circle cx="280" cy="50" r="8" fill="#F5B83D" stroke="#FFF" strokeWidth="2.5" />
              </svg>

              {/* Turn Banner Overlay */}
              <div className="absolute top-3 left-3 bg-[#075B64]/95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-[#F5B83D] rotate-45" />
                <span>In 250m turn right on North Usman Rd</span>
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#DDF0F0] border border-[#6FA5A5] flex items-center justify-center font-bold text-[#075B64]">
                  {booking.customerName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#075B64]">{booking.customerName}</p>
                  <p className="text-[11px] text-slate-500 flex items-center">
                    <Star className="w-3 h-3 text-[#F5B83D] fill-[#F5B83D] mr-1" />
                    {booking.customerRating} Rating
                  </p>
                </div>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="w-9 h-9 rounded-full bg-[#DDF0F0] hover:bg-[#6FA5A5]/30 text-[#075B64] flex items-center justify-center shadow-xs"
                  title="Call Customer"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Messaging ${booking.customerName}: "I have arrived near your pickup location."`)}
                  className="w-9 h-9 rounded-full bg-[#DDF0F0] hover:bg-[#6FA5A5]/30 text-[#075B64] flex items-center justify-center shadow-xs"
                  title="Message Customer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Arrived Action Button */}
        <div className="pt-4">
          <Button
            variant="amber"
            size="lg"
            onClick={onArrived}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            I Have Arrived At Pickup
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 3: Arrival at Pickup Location                                         */
/* -------------------------------------------------------------------------- */
export const Workflow3ArrivedPickup: React.FC<{
  booking: BookingRequest;
  onProceedToOtp: () => void;
  onBack: () => void;
}> = ({ booking, onProceedToOtp, onBack }) => {
  const [waitingSeconds, setWaitingSeconds] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => setWaitingSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-2">
        <div className="w-16 h-16 rounded-full bg-[#075B64]/10 border-2 border-[#075B64] flex items-center justify-center text-[#075B64] mb-3">
          <MapPin className="w-8 h-8 text-[#F5B83D] stroke-[2.5]" />
        </div>

        <span className="text-[11px] font-bold text-white bg-emerald-600 px-3 py-0.5 rounded-full uppercase tracking-wider">
          Arrived At Pickup
        </span>

        <h1 className="text-xl font-black text-[#075B64] mt-2">
          Waiting for {booking.customerName}
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-0.5">
          {booking.pickupLocation}
        </p>

        {/* Waiting Timer Card */}
        <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-4 w-full mt-5 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-[#075B64]">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Waiting Time</span>
          </div>
          <p className="text-2xl font-black text-[#075B64] mt-1 tracking-widest font-mono">
            {formatTime(waitingSeconds)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Free waiting time: 5 mins • Customer has been notified
          </p>
        </div>

        {/* Customer verification prompt */}
        <div className="bg-[#7EAFA8] text-white rounded-xl p-3.5 w-full mt-4 text-left shadow-xs">
          <p className="text-xs font-bold flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-[#F5B83D]" />
            Safety & Vehicle Verification
          </p>
          <p className="text-[11px] text-white/90 mt-1">
            Ask {booking.customerName} for their 4-digit ride OTP and inspect vehicle condition before starting the trip.
          </p>
        </div>

        {/* CTA */}
        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            withArrow
            onClick={onProceedToOtp}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Verify Customer OTP
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 4: Customer OTP Verification                                          */
/* -------------------------------------------------------------------------- */
export const Workflow4CustomerOtp: React.FC<{
  booking: BookingRequest;
  onVerified: () => void;
  onBack: () => void;
}> = ({ booking, onVerified, onBack }) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    setError(null);
  };

  const handleFillExpectedOtp = () => {
    const chars = booking.customerOtp.split('');
    setOtpDigits(chars);
    setError(null);
  };

  const handleVerify = () => {
    const code = otpDigits.join('');
    if (code.length < 4) {
      setError('Please enter the 4-digit customer OTP');
      return;
    }
    if (code !== booking.customerOtp) {
      setError(`Invalid OTP. Please ask customer (Mock OTP: ${booking.customerOtp})`);
      return;
    }
    onVerified();
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-4">
        <div className="w-16 h-16 rounded-full bg-[#075B64]/10 border-2 border-[#075B64] flex items-center justify-center text-[#075B64] mb-3">
          <ShieldCheck className="w-8 h-8 text-[#075B64] stroke-[2.2]" />
        </div>

        <h1 className="text-2xl font-black text-[#075B64]">
          Customer OTP
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1 max-w-[260px]">
          Ask {booking.customerName} for the 4-digit trip OTP shown on their phone
        </p>

        {/* 4 Digit OTP Slots */}
        <div className="bg-[#8EB7B7]/40 border border-[#6FA5A5] rounded-xl p-5 my-5 w-full shadow-sm">
          <div className="flex items-center justify-center gap-3">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder="•"
                className="w-12 h-14 text-center text-2xl font-black text-[#075B64] bg-white rounded-xl border-2 border-[#6FA5A5] focus:border-[#F5B83D] focus:ring-2 focus:ring-[#F5B83D]/30 focus:outline-none"
              />
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleFillExpectedOtp}
              className="text-xs font-bold text-[#075B64] bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              Fill Customer OTP ({booking.customerOtp})
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
            {error}
          </p>
        )}

        <div className="w-full">
          <Button
            variant="amber"
            size="lg"
            onClick={handleVerify}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Verify & Proceed to Checklist
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 5: Vehicle Handover Checklist                                         */
/* -------------------------------------------------------------------------- */
export const Workflow5VehicleHandover: React.FC<{
  booking: BookingRequest;
  onChecklistComplete: (data: VehicleHandoverData) => void;
  onBack: () => void;
}> = ({ booking, onChecklistComplete, onBack }) => {
  const [fuel, setFuel] = useState<number>(75);
  const [odometer, setOdometer] = useState<string>('42850');
  const [photoSelected, setPhotoSelected] = useState<boolean>(true);
  const [scratchesChecked, setScratchesChecked] = useState<boolean>(true);
  const [acWorking, setAcWorking] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChecklistComplete({
      fuelLevel: fuel,
      odometerReading: odometer,
      odometerPhoto: 'odometer_verified.jpg',
      frontPhoto: 'front.jpg',
      rearPhoto: 'rear.jpg',
      interiorPhoto: 'interior.jpg',
      existingScratchesChecked: scratchesChecked,
      acWorking,
      cleanlinessChecked: true,
    });
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-5 py-4 overflow-hidden text-left">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 overflow-y-auto max-w-sm mx-auto w-full py-2 space-y-4">
        <div>
          <h1 className="text-xl font-black text-[#075B64]">
            Vehicle Handover Checklist
          </h1>
          <p className="text-xs font-semibold text-[#075B64]/80 mt-0.5">
            Inspect {booking.vehicleModel} ({booking.vehicleRegNumber})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fuel Level */}
          <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#075B64] flex items-center">
                <Fuel className="w-4 h-4 mr-1.5 text-[#F5B83D]" />
                Fuel Gauge Level
              </span>
              <span className="text-xs font-black text-[#075B64] bg-[#DDF0F0] px-2 py-0.5 rounded">
                {fuel}% Tank
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={fuel}
              onChange={(e) => setFuel(Number(e.target.value))}
              className="w-full accent-[#075B64] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>E (Empty)</span>
              <span>1/2</span>
              <span>F (Full)</span>
            </div>
          </div>

          {/* Odometer Reading */}
          <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm">
            <Input
              label="Starting Odometer (KM)"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ''))}
              suffix={<Gauge className="w-4 h-4 text-[#075B64]" />}
              placeholder="e.g. 42850"
            />
          </div>

          {/* Vehicle Photos Upload Box */}
          <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm space-y-2">
            <span className="text-xs font-bold text-[#075B64] flex items-center">
              <Camera className="w-4 h-4 mr-1.5 text-[#075B64]" />
              Vehicle Condition Photos
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['Front', 'Rear', 'Odometer'].map((label, idx) => (
                <div
                  key={idx}
                  onClick={() => setPhotoSelected(true)}
                  className="border border-[#6FA5A5] rounded-lg p-2 text-center bg-[#DDF0F0]/50 hover:bg-[#DDF0F0] cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-[#075B64] block">{label}</span>
                  <span className="text-[9px] text-slate-500">Captured</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Inspection Checks */}
          <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm space-y-2.5">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scratchesChecked}
                onChange={(e) => setScratchesChecked(e.target.checked)}
                className="w-4 h-4 text-[#075B64] accent-[#075B64] rounded"
              />
              <span className="text-xs font-semibold text-[#075B64]">
                Existing scratches / dents recorded with customer
              </span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acWorking}
                onChange={(e) => setAcWorking(e.target.checked)}
                className="w-4 h-4 text-[#075B64] accent-[#075B64] rounded"
              />
              <span className="text-xs font-semibold text-[#075B64]">
                AC & electricals verified in working condition
              </span>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="amber"
              size="lg"
              className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
            >
              Complete Handover
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 6: Start Trip Confirmation                                            */
/* -------------------------------------------------------------------------- */
export const Workflow6StartTripConfirm: React.FC<{
  booking: BookingRequest;
  onStartTrip: () => void;
  onBack: () => void;
}> = ({ booking, onStartTrip, onBack }) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-4">
        <div className="w-20 h-20 rounded-full bg-[#F5B83D]/20 border-4 border-[#F5B83D] flex items-center justify-center text-[#F5B83D] mb-4">
          <Car className="w-10 h-10 text-[#075B64] stroke-[2]" />
        </div>

        <h1 className="text-2xl font-black text-[#075B64]">
          Ready to Start Trip?
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1 max-w-[260px]">
          Vehicle handover complete. Customer {booking.customerName} is seated and ready.
        </p>

        {/* Route Summary Card */}
        <div className="bg-[#7EAFA8] text-white rounded-2xl p-4 w-full mt-6 shadow-md text-left space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
            <span className="font-bold">Destination</span>
            <span className="font-extrabold text-[#F5B83D]">{booking.distance}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs">
              <MapPin className="w-4 h-4 text-[#F5B83D] shrink-0" />
              <span>{booking.pickupLocation}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <Flag className="w-4 h-4 text-white shrink-0" />
              <span className="font-bold">{booking.destination}</span>
            </div>
          </div>
        </div>

        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            onClick={onStartTrip}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Start Trip Now 🚗
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 7: Active Trip Screen with Map Interface                              */
/* -------------------------------------------------------------------------- */
export const Workflow7ActiveTripMap: React.FC<{
  booking: BookingRequest;
  onDestinationReached: () => void;
}> = ({ booking, onDestinationReached }) => {
  const [speed, setSpeed] = useState(44);
  const [distanceRemaining, setDistanceRemaining] = useState('4.2 km');

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(38 + Math.floor(Math.random() * 12));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-slate-900 text-white overflow-hidden">
      {/* Top Navigation Overlay */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent">
        <div className="bg-[#075B64] border border-[#6FA5A5]/40 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B83D] text-[#075B64] flex items-center justify-center font-black">
              <Navigation className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                In 350m turn slight left
              </p>
              <p className="text-sm font-extrabold text-white">
                Towards {booking.destination}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-white/70 uppercase">Speed</span>
            <p className="text-base font-black text-[#F5B83D] leading-none">
              {speed} <span className="text-[10px]">km/h</span>
            </p>
          </div>
        </div>
      </div>

      {/* Styled Interactive Map Center */}
      <div className="relative flex-1 w-full bg-[#1b2432] flex items-center justify-center overflow-hidden">
        {/* Dynamic Road Grids */}
        <svg className="w-full h-full opacity-80" viewBox="0 0 400 600">
          {/* Background Blocks */}
          <rect x="20" y="40" width="80" height="120" rx="6" fill="#243042" />
          <rect x="280" y="80" width="100" height="160" rx="6" fill="#243042" />
          <rect x="30" y="260" width="110" height="140" rx="6" fill="#243042" />
          <rect x="260" y="320" width="110" height="180" rx="6" fill="#243042" />

          {/* Road Network */}
          <path d="M 0 200 L 400 200" stroke="#374151" strokeWidth="16" />
          <path d="M 200 0 L 200 600" stroke="#374151" strokeWidth="22" />
          <path d="M 0 440 L 400 440" stroke="#374151" strokeWidth="18" />

          {/* Active Navigation Route Path */}
          <path
            d="M 200 520 L 200 200 L 320 200 L 320 80"
            stroke="#F5B83D"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* Destination Marker */}
          <circle cx="320" cy="80" r="12" fill="#075B64" stroke="#FFF" strokeWidth="3" />
          <circle cx="320" cy="80" r="4" fill="#F5B83D" />

          {/* Live Driver Vehicle Marker */}
          <circle cx="200" cy="380" r="14" fill="#075B64" stroke="#F5B83D" strokeWidth="3.5" />
          <polygon points="200,368 206,388 194,388" fill="#FFF" />
        </svg>

        {/* Floating Compass */}
        <div className="absolute right-4 top-24 w-10 h-10 rounded-full bg-slate-800/90 border border-slate-600 flex items-center justify-center text-slate-300 shadow">
          <Compass className="w-5 h-5 text-[#F5B83D]" />
        </div>
      </div>

      {/* Bottom Driver HUD Controls */}
      <div className="relative z-20 bg-[#DDF0F0] text-slate-800 p-5 rounded-t-3xl shadow-2xl border-t-2 border-[#6FA5A5]">
        <div className="flex items-center justify-between pb-3 border-b border-[#6FA5A5]/30">
          <div>
            <span className="text-[10px] font-bold text-[#075B64] uppercase tracking-wide">
              Trip in Progress
            </span>
            <h3 className="text-base font-black text-[#075B64]">
              {booking.customerName}
            </h3>
          </div>

          <div className="flex items-center space-x-3 text-right">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Remaining</span>
              <span className="text-sm font-black text-[#075B64]">{distanceRemaining}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Est. Fare</span>
              <span className="text-sm font-black text-emerald-700">₹{booking.estimatedFare}</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            variant="amber"
            size="lg"
            onClick={onDestinationReached}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Destination Reached 🏁
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 8: Destination Reached                                                */
/* -------------------------------------------------------------------------- */
export const Workflow8DestinationReached: React.FC<{
  booking: BookingRequest;
  onNext: () => void;
  onBack: () => void;
}> = ({ booking, onNext, onBack }) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-600 flex items-center justify-center text-emerald-600 mb-4">
          <Flag className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h1 className="text-2xl font-black text-[#075B64]">
          Destination Reached!
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1 max-w-[260px]">
          Safely arrived at {booking.destination}.
        </p>

        {/* Final Trip Route Recap */}
        <div className="bg-[#7EAFA8] text-white rounded-2xl p-4 w-full mt-6 shadow-md text-left">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
            <span className="font-bold">{booking.customerName}</span>
            <span className="bg-[#075B64]/40 px-2 py-0.5 rounded text-[11px] font-bold">
              Completed {booking.distance}
            </span>
          </div>

          <div className="mt-3 text-xs space-y-1.5">
            <p className="text-white/80">
              Please inspect the vehicle with customer before ending the trip.
            </p>
          </div>
        </div>

        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            withArrow
            onClick={onNext}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Vehicle Handover & Return
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 9: Final Vehicle Condition & Handover Check                           */
/* -------------------------------------------------------------------------- */
export const Workflow9FinalCheck: React.FC<{
  booking: BookingRequest;
  onConfirmed: () => void;
  onBack: () => void;
}> = ({ booking, onConfirmed, onBack }) => {
  const [endOdo, setEndOdo] = useState('42868');
  const [belongingsChecked, setBelongingsChecked] = useState(true);
  const [noNewDamages, setNoNewDamages] = useState(true);
  const [fuelChecked, setFuelChecked] = useState(true);

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-5 py-4 overflow-hidden text-left">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 overflow-y-auto max-w-sm mx-auto w-full py-2 space-y-4">
        <div>
          <h1 className="text-xl font-black text-[#075B64]">
            Final Handover Check
          </h1>
          <p className="text-xs font-semibold text-[#075B64]/80 mt-0.5">
            Handover {booking.vehicleModel} back to customer
          </p>
        </div>

        {/* Final Odometer Input */}
        <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm">
          <Input
            label="Final Odometer Reading (KM)"
            value={endOdo}
            onChange={(e) => setEndOdo(e.target.value.replace(/\D/g, ''))}
            suffix={<Gauge className="w-4 h-4 text-[#075B64]" />}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Trip distance: 18 km recorded
          </p>
        </div>

        {/* Handover Checklist */}
        <div className="bg-white/90 border border-[#6FA5A5] rounded-xl p-3.5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-[#075B64] uppercase block">
            Return Inspection Items
          </span>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={belongingsChecked}
              onChange={(e) => setBelongingsChecked(e.target.checked)}
              className="w-4 h-4 text-[#075B64] accent-[#075B64] rounded"
            />
            <span className="text-xs font-semibold text-[#075B64]">
              No customer belongings left in vehicle
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={noNewDamages}
              onChange={(e) => setNoNewDamages(e.target.checked)}
              className="w-4 h-4 text-[#075B64] accent-[#075B64] rounded"
            />
            <span className="text-xs font-semibold text-[#075B64]">
              Customer verified vehicle returned in original condition
            </span>
          </label>

          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={fuelChecked}
              onChange={(e) => setFuelChecked(e.target.checked)}
              className="w-4 h-4 text-[#075B64] accent-[#075B64] rounded"
            />
            <span className="text-xs font-semibold text-[#075B64]">
              Fuel gauge verified with customer
            </span>
          </label>
        </div>

        <div className="pt-2">
          <Button
            variant="amber"
            size="lg"
            onClick={onConfirmed}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Confirm Handover & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 10: End Trip Confirmation                                             */
/* -------------------------------------------------------------------------- */
export const Workflow10EndTripConfirm: React.FC<{
  booking: BookingRequest;
  onEndTrip: () => void;
  onBack: () => void;
}> = ({ booking, onEndTrip, onBack }) => {
  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-4">
        <div className="w-16 h-16 rounded-full bg-[#075B64]/10 border-2 border-[#075B64] flex items-center justify-center text-[#075B64] mb-3">
          <CheckCircle2 className="w-9 h-9 text-[#075B64]" />
        </div>

        <h1 className="text-2xl font-black text-[#075B64]">
          End Trip Confirmation
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1 max-w-[260px]">
          Confirm conclusion of Trip #{booking.id}
        </p>

        {/* Fare Summary */}
        <div className="bg-white/95 border-2 border-[#6FA5A5] rounded-2xl p-4 w-full mt-5 shadow-sm text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-500">Trip Fare</span>
            <span className="text-xl font-black text-[#075B64]">₹{booking.estimatedFare}</span>
          </div>
          <div className="pt-2 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Customer Name:</span>
              <span className="font-bold text-slate-800">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Vehicle:</span>
              <span className="font-bold text-slate-800">{booking.vehicleModel}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold text-emerald-700">Online / Wallet Paid</span>
            </div>
          </div>
        </div>

        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            onClick={onEndTrip}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Complete & End Trip
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 11: Driver Earnings & Payment Status                                  */
/* -------------------------------------------------------------------------- */
export const Workflow11EarningsPayment: React.FC<{
  booking: BookingRequest;
  onProceedToFeedback: () => void;
}> = ({ booking, onProceedToFeedback }) => {
  const driverPayout = Math.round(booking.estimatedFare * 0.85);

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mb-2">
          <Wallet className="w-8 h-8" />
        </div>

        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full uppercase tracking-wider">
          Payment Credited
        </span>

        <h1 className="text-3xl font-black text-[#075B64] mt-2">
          ₹{driverPayout}
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-0.5">
          Added to your Ryde Driver Wallet
        </p>

        {/* Detailed Breakdown Card */}
        <div className="bg-[#7EAFA8] text-white rounded-2xl p-4 w-full mt-4 shadow-md text-left space-y-2 text-xs">
          <div className="flex justify-between pb-2 border-b border-white/20 font-bold">
            <span>Trip Total</span>
            <span>₹{booking.estimatedFare}</span>
          </div>
          <div className="flex justify-between text-white/90">
            <span>Base Fare</span>
            <span>₹100</span>
          </div>
          <div className="flex justify-between text-white/90">
            <span>Distance Fare ({booking.distance})</span>
            <span>₹{booking.estimatedFare - 100}</span>
          </div>
          <div className="flex justify-between text-white/90">
            <span>Platform Commission (15%)</span>
            <span>- ₹{booking.estimatedFare - driverPayout}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/20 font-black text-sm text-[#F5B83D]">
            <span>Net Driver Payout</span>
            <span>₹{driverPayout}</span>
          </div>
        </div>

        <div className="w-full mt-6">
          <Button
            variant="amber"
            size="lg"
            withArrow
            onClick={onProceedToFeedback}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Rate Customer & Feedback
          </Button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* STEP 12: Customer Rating & Feedback                                        */
/* -------------------------------------------------------------------------- */
export const Workflow12RatingFeedback: React.FC<{
  booking: BookingRequest;
  onSubmit: (rating: number, feedback: string) => void;
}> = ({ booking, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [feedbackTags, setFeedbackTags] = useState<string[]>(['Polite Customer', 'On Time']);
  const tags = ['Polite Customer', 'On Time', 'Clean Vehicle', 'Clear Directions', 'Helpful'];

  const toggleTag = (t: string) => {
    if (feedbackTags.includes(t)) {
      setFeedbackTags(feedbackTags.filter((x) => x !== t));
    } else {
      setFeedbackTags([...feedbackTags, t]);
    }
  };

  return (
    <div className="relative min-h-[640px] h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-hidden text-center">
      <CornerDecorations />
      <Header />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-2">
        <h1 className="text-2xl font-black text-[#075B64]">
          Rate Your Customer
        </h1>
        <p className="text-xs font-semibold text-[#075B64]/80 mt-1">
          How was your trip experience with {booking.customerName}?
        </p>

        {/* Star Rating Selectors */}
        <div className="flex items-center justify-center space-x-2 my-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-9 h-9 ${
                  star <= rating
                    ? 'text-[#F5B83D] fill-[#F5B83D]'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Quick Tag Pills */}
        <div className="flex flex-wrap gap-2 justify-center max-w-[280px] mb-5">
          {tags.map((tag) => {
            const isSelected = feedbackTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  isSelected
                    ? 'bg-[#075B64] text-white border-[#075B64]'
                    : 'bg-white text-[#075B64] border-[#6FA5A5] hover:bg-[#DDF0F0]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className="w-full">
          <Button
            variant="amber"
            size="lg"
            onClick={() => onSubmit(rating, feedbackTags.join(', '))}
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Submit & Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
