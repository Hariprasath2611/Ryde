import React, { useState } from 'react';
import { Smartphone, Monitor, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { ScreenType } from '../../types';

interface DeviceFrameProps {
  children: React.ReactNode;
  activeScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  onResetDemo: () => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  activeScreen,
  onSelectScreen,
  onResetDemo,
}) => {
  const [isMobileMode, setIsMobileMode] = useState<boolean>(true);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const screens: { id: ScreenType; label: string; group: 'Reference Screens (Figma)' | 'Workflow Steps' }[] = [
    { id: 'splash', label: 'Screen 1: Splash / Welcome', group: 'Reference Screens (Figma)' },
    { id: 'registration', label: 'Screen 2: Driver Registration', group: 'Reference Screens (Figma)' },
    { id: 'otp', label: 'Screen 3: OTP Verification', group: 'Reference Screens (Figma)' },
    { id: 'verification', label: 'Screen 4: Driver Verification', group: 'Reference Screens (Figma)' },
    { id: 'dashboard', label: 'Screen 5: Home Dashboard', group: 'Reference Screens (Figma)' },
    { id: 'new_bookings', label: 'Screen 6: New Booking Cards', group: 'Reference Screens (Figma)' },
    { id: 'workflow_accepted', label: 'Workflow 1: Booking Accepted', group: 'Workflow Steps' },
    { id: 'workflow_pickup', label: 'Workflow 2: Customer Pickup Map', group: 'Workflow Steps' },
    { id: 'workflow_arrived', label: 'Workflow 3: Arrived At Pickup', group: 'Workflow Steps' },
    { id: 'workflow_customer_otp', label: 'Workflow 4: Customer OTP', group: 'Workflow Steps' },
    { id: 'workflow_vehicle_handover', label: 'Workflow 5: Vehicle Handover', group: 'Workflow Steps' },
    { id: 'workflow_start_trip', label: 'Workflow 6: Start Trip', group: 'Workflow Steps' },
    { id: 'workflow_active_trip', label: 'Workflow 7: Active Trip (Live Map)', group: 'Workflow Steps' },
    { id: 'workflow_destination_reached', label: 'Workflow 8: Destination Reached', group: 'Workflow Steps' },
    { id: 'workflow_final_handover', label: 'Workflow 9: Final Condition Check', group: 'Workflow Steps' },
    { id: 'workflow_end_trip', label: 'Workflow 10: End Trip Invoice', group: 'Workflow Steps' },
    { id: 'workflow_earnings', label: 'Workflow 11: Earnings & Wallet', group: 'Workflow Steps' },
    { id: 'workflow_feedback', label: 'Workflow 12: Customer Rating', group: 'Workflow Steps' },
  ];

  const currentScreenMeta = screens.find((s) => s.id === activeScreen);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start text-slate-100 font-sans selection:bg-[#F5B83D]">
      {/* Top Floating Demo Toolbar */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-50 flex items-center justify-between text-xs">
        {/* Left Branding and App Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-black text-sm">
            <span className="text-[#6FA5A5]">RY</span>
            <span className="text-[#F5B83D]">DE</span>
            <span className="text-slate-400 font-normal text-xs ml-1">Captain App</span>
          </div>
          <span className="hidden sm:inline-block bg-[#075B64] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            UI Reference Mode
          </span>
        </div>

        {/* Center Screen Quick Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow-xs"
          >
            <span className="font-bold truncate max-w-[200px] sm:max-w-[280px]">
              {currentScreenMeta?.label || 'Select Screen'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[70vh] overflow-y-auto">
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-[#F5B83D] uppercase tracking-wider">
                Reference Screens (Matches Attached UI)
              </div>
              {screens
                .filter((s) => s.group === 'Reference Screens (Figma)')
                .map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => {
                      onSelectScreen(screen.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      activeScreen === screen.id ? 'text-[#F5B83D] font-bold bg-slate-800/80' : 'text-slate-300'
                    }`}
                  >
                    <span>{screen.label}</span>
                    {activeScreen === screen.id && <Check className="w-3.5 h-3.5 text-[#F5B83D]" />}
                  </button>
                ))}

              <div className="p-2 border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-[#6FA5A5] uppercase tracking-wider mt-1">
                Driver Journey Workflow
              </div>
              {screens
                .filter((s) => s.group === 'Workflow Steps')
                .map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => {
                      onSelectScreen(screen.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      activeScreen === screen.id ? 'text-[#6FA5A5] font-bold bg-slate-800/80' : 'text-slate-300'
                    }`}
                  >
                    <span>{screen.label}</span>
                    {activeScreen === screen.id && <Check className="w-3.5 h-3.5 text-[#6FA5A5]" />}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right Controls: Device Mode Toggle & Reset */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setIsMobileMode(true)}
              className={`p-1.5 rounded-md transition-all ${
                isMobileMode ? 'bg-[#075B64] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Device Frame"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMobileMode(false)}
              className={`p-1.5 rounded-md transition-all ${
                !isMobileMode ? 'bg-[#075B64] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Fluid Full Screen"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onResetDemo}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
            title="Reset to Screen 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-semibold">Reset</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 w-full flex items-center justify-center p-0 md:p-6">
        {isMobileMode ? (
          /* Realistic Android Phone Mockup Frame */
          <div className="relative w-full max-w-[390px] h-[840px] max-h-[96vh] bg-black rounded-[46px] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
            {/* Top Speaker / Camera Notch */}
            <div className="absolute top-3.5 inset-x-0 flex justify-center items-center pointer-events-none z-40">
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
                <div className="w-8 h-1 rounded-full bg-slate-900" />
              </div>
            </div>

            {/* Android Status Bar */}
            <div className="relative z-30 flex items-center justify-between px-6 pt-2 pb-1 text-[11px] font-bold text-slate-700 select-none bg-[#DDF0F0] shrink-0">
              <span>10:58</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] tracking-tighter">5G</span>
                <span>📶</span>
                <span className="text-xs">🔋 100%</span>
              </div>
            </div>

            {/* Screen Inner Viewport */}
            <div className="relative flex-1 min-h-0 w-full bg-[#DDF0F0] overflow-hidden flex flex-col">
              {children}
            </div>

            {/* Android Bottom Navigation Pill Bar */}
            <div className="h-5 bg-[#DDF0F0] flex items-center justify-center pointer-events-none shrink-0 rounded-b-[38px]">
              <div className="w-32 h-1 bg-slate-400/60 rounded-full" />
            </div>
          </div>
        ) : (
          /* Full Viewport / Fluid Preview */
          <div className="w-full max-w-md h-[840px] max-h-[96vh] bg-[#DDF0F0] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#6FA5A5] flex flex-col">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
