import React from 'react';
import { ShieldCheck, MapPin, Clock, ArrowRight } from 'lucide-react';
import { RydeLogo } from '../common/RydeLogo';

interface Screen1SplashProps {
  onGetStarted: () => void;
  onSkipToDashboard?: () => void;
}

export const Screen1Splash: React.FC<Screen1SplashProps> = ({
  onGetStarted,
}) => {
  return (
    <div className="relative min-h-0 h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-6 overflow-hidden select-none">
      {/* Top Left Corner Decoration (Teal arc with Amber stroke) */}
      <div className="pointer-events-none absolute -top-10 -left-10 z-0">
        <svg width="180" height="180" viewBox="0 0 160 160" fill="none">
          <circle
            cx="40"
            cy="40"
            r="105"
            stroke="#ECA233"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          <circle cx="40" cy="40" r="82" fill="#5A9396" />
        </svg>
      </div>

      {/* Bottom Right Corner Decoration (Teal arc with Amber stroke) */}
      <div className="pointer-events-none absolute -bottom-12 -right-12 z-0">
        <svg width="200" height="200" viewBox="0 0 180 180" fill="none">
          <circle
            cx="140"
            cy="140"
            r="120"
            stroke="#ECA233"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          <circle cx="140" cy="140" r="95" fill="#5A9396" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col justify-between items-center h-full pt-8 pb-4">
        {/* Top Logo & Tagline */}
        <div className="text-center mt-2">
          <RydeLogo size="xl" withTagline />
        </div>

        {/* Center 3 Badges with Vertical Dividers */}
        <div className="flex items-center justify-between w-full max-w-[320px] my-auto">
          {/* Badge 1: Safe & Trusted Drivers */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            <div className="h-10 flex items-center justify-center mb-1 text-slate-800">
              <ShieldCheck className="w-8 h-8 stroke-[1.8]" />
            </div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              safe &<br />trusted Drivers
            </p>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 bg-slate-800/40" />

          {/* Badge 2: Live Tracking */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            <div className="h-10 flex items-center justify-center mb-1 text-slate-800">
              <MapPin className="w-8 h-8 fill-slate-800 stroke-none" />
            </div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              live<br />Tracking
            </p>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 bg-slate-800/40" />

          {/* Badge 3: On Time Every Time */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            <div className="h-10 flex items-center justify-center mb-1 text-slate-800">
              <Clock className="w-8 h-8 stroke-[1.8]" />
            </div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              On time<br />Every Time
            </p>
          </div>
        </div>

        {/* Dotted Loop Path & Get Started Button */}
        <div className="relative w-[310px] h-[210px] flex items-center justify-center my-1">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 310 220"
            fill="none"
          >
            {/* Curving Dotted Loop Path matching Image 1 */}
            <path
              d="M 15 210 C 50 195, 95 160, 128 128 C 150 95, 145 38, 112 28 C 80 18, 55 52, 60 95 C 66 128, 102 135, 128 128 C 168 132, 218 118, 252 70 C 264 52, 272 36, 276 18"
              stroke="#718096"
              strokeWidth="2.2"
              strokeDasharray="5 5"
              fill="none"
            />
            {/* Arrowhead */}
            <polygon points="264,28 280,12 286,28" fill="#718096" />
          </svg>

          {/* Prominent Amber "Get Started →" Button */}
          <button
            onClick={onGetStarted}
            className="relative z-20 flex items-center justify-center w-[220px] h-[50px] bg-[#ECA233] hover:bg-[#de9628] text-white font-extrabold text-base rounded-full shadow-lg shadow-[#ECA233]/40 transition-all active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 ml-2 stroke-[2.5]" />
          </button>
        </div>

        {/* Tagline Description */}
        <p className="text-center text-xs font-semibold text-slate-800 leading-relaxed max-w-[260px] my-2">
          Your journey starts here. Let's<br />make every ride safe and<br />effortless.
        </p>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center space-x-2 mt-4">
          <span className="w-8 h-2 rounded-full bg-[#ECA233]" />
          <span className="w-2 h-2 rounded-full bg-[#0E525A]" />
          <span className="w-2 h-2 rounded-full bg-[#0E525A]" />
        </div>
      </div>
    </div>
  );
};
