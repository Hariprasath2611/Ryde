import React from 'react';
import { X, ShieldCheck, Star, Phone, Award, LogOut, CheckCircle2 } from 'lucide-react';
import { DriverProfile } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  driver,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#DDF0F0] border-2 border-[#6FA5A5] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/80 border-b border-[#6FA5A5]/30">
          <h3 className="font-extrabold text-[#075B64] text-base">Driver Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={driver.avatarUrl}
                alt={driver.fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-[#075B64] shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Verified Driver">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <h2 className="text-xl font-black text-[#075B64] mt-2">{driver.fullName}</h2>
            <p className="text-xs font-semibold text-slate-500 flex items-center mt-0.5">
              <Phone className="w-3 h-3 mr-1" />
              +91 {driver.mobileNumber}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-white/80 rounded-2xl p-3 border border-[#6FA5A5]/40 text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Rating</span>
              <p className="text-sm font-extrabold text-[#075B64] flex items-center">
                <Star className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D] mr-1" />
                {driver.rating}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Trips</span>
              <p className="text-sm font-extrabold text-[#075B64]">{driver.totalTripsToday}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Earning</span>
              <p className="text-sm font-extrabold text-emerald-700">₹{driver.todayEarnings}</p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-[#7EAFA8] text-white rounded-2xl p-3.5 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-[#F5B83D] mr-1" />
                KYC Verification
              </span>
              <span className="bg-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">
                APPROVED
              </span>
            </div>
            <div className="text-[11px] text-white/90 space-y-1">
              <p>Aadhar: {driver.aadharNumber}</p>
              <p>License: {driver.licenseFileName || 'DL_TN01_2022003891.pdf'}</p>
            </div>
          </div>

          {/* Action: Logout */}
          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-full border-2 border-red-500 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out & Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
