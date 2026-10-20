import React, { useState } from 'react';
import { User, Phone, Check, ChevronDown, Trash2 } from 'lucide-react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { Button } from '../common/Button';

interface Screen2RegistrationProps {
  onBack: () => void;
  onContinue: (data: { fullName: string; mobileNumber: string; avatarUrl: string }) => void;
  initialData?: {
    fullName: string;
    mobileNumber: string;
    avatarUrl: string;
  };
}

const COUNTRY_CODES = [
  { flag: '🇮🇳', code: '+91', name: 'India', digits: 10 },
  { flag: '🇺🇸', code: '+1', name: 'USA', digits: 10 },
  { flag: '🇬🇧', code: '+44', name: 'UK', digits: 10 },
  { flag: '🇦🇪', code: '+971', name: 'UAE', digits: 9 },
  { flag: '🇸🇬', code: '+65', name: 'Singapore', digits: 8 },
];

const SAMPLE_AVATARS = [
  {
    id: 'avatar1',
    label: 'Arun',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar2',
    label: 'Rajesh',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar3',
    label: 'Priya',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar4',
    label: 'Michael',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
];

export const Screen2Registration: React.FC<Screen2RegistrationProps> = ({
  onBack,
  onContinue,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(initialData?.mobileNumber || '');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialData?.avatarUrl || SAMPLE_AVATARS[0].url
  );

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError('Please enter your full name (minimum 2 characters)');
      hasErr = true;
    } else {
      setNameError('');
    }

    const clean = mobileNumber.replace(/\D/g, '');
    if (clean.length !== selectedCountry.digits) {
      setPhoneError(`Please enter a valid ${selectedCountry.digits}-digit number`);
      hasErr = true;
    } else {
      setPhoneError('');
    }

    if (hasErr) return;

    onContinue({
      fullName: fullName.trim(),
      mobileNumber: clean,
      avatarUrl,
    });
  };

  return (
    <div className="relative min-h-0 h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-y-auto select-none">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 max-w-[340px] w-full mx-auto my-auto py-2">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[#075B64] tracking-tight">
            Welcome
          </h1>
          <p className="text-sm font-semibold text-[#075B64]/80 mt-1">
            create your account
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#075B64] mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Enter full name"
                className={`w-full px-4 py-3 rounded-xl border ${
                  nameError ? 'border-red-500 bg-red-50/50' : 'border-[#6FA5A5] bg-white/80'
                } text-[#075B64] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B83D] transition-all`}
              />
              <User className="absolute right-3.5 top-3.5 w-4 h-4 text-[#075B64]/50 pointer-events-none" />
            </div>
            {nameError && <p className="text-[11px] font-bold text-red-600 mt-1">{nameError}</p>}
          </div>

          {/* Mobile Number with Country Picker */}
          <div>
            <label className="block text-xs font-bold text-[#075B64] mb-1.5">
              Enter Your Mobile Number *
            </label>
            <div
              className={`flex items-center rounded-xl border ${
                phoneError ? 'border-red-500 bg-red-50/50' : 'border-[#6FA5A5] bg-white/80'
              } transition-all`}
            >
              {/* Country Selector Button */}
              <button
                type="button"
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className="flex items-center px-3 py-3 border-r border-[#6FA5A5]/40 text-xs font-bold text-[#075B64] hover:bg-white/90 rounded-l-xl transition-colors"
              >
                <span className="mr-1 text-base">{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-[#075B64]/70" />
              </button>

              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, selectedCountry.digits));
                  if (phoneError) setPhoneError('');
                }}
                placeholder={`Enter ${selectedCountry.digits}-digit mobile number`}
                className="w-full px-3 py-3 bg-transparent text-[#075B64] font-semibold text-sm focus:outline-none rounded-r-xl"
              />
              <Phone className="w-4 h-4 text-[#075B64]/50 mr-3 pointer-events-none shrink-0" />
            </div>
            {phoneError && <p className="text-[11px] font-bold text-red-600 mt-1">{phoneError}</p>}

            {/* Country Selector Dropdown */}
            {isCountryOpen && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border border-[#6FA5A5]/30 p-1 divide-y divide-slate-100 z-30">
                {COUNTRY_CODES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c);
                      setIsCountryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg ${
                      selectedCountry.code === c.code
                        ? 'bg-[#DDF0F0] text-[#075B64]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {c.flag} {c.name}
                    </span>
                    <span className="text-slate-500">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Image Section */}
          <div>
            <label className="block text-xs font-bold text-[#075B64] mb-1.5">
              Profile Image
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#6FA5A5] bg-white/80">
              <div className="flex items-center space-x-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-11 h-11 rounded-lg object-cover border border-[#6FA5A5]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-[#DDF0F0] flex items-center justify-center text-[#075B64]">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-[#075B64]">
                    {avatarUrl ? 'Photo Attached' : 'No Photo Selected'}
                  </p>
                  <p className="text-[10px] text-[#075B64]/70 font-medium">
                    JPG / PNG / PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoOpen(!isPhotoOpen)}
                  className="text-xs font-bold text-[#075B64] bg-[#DDF0F0] hover:bg-[#6FA5A5]/30 px-3 py-1.5 rounded-lg border border-[#6FA5A5]/40 transition-colors"
                >
                  {avatarUrl ? 'Change' : 'Select'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Avatar Selection Picker Modal */}
            {isPhotoOpen && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border border-[#6FA5A5]/30 p-3 z-30">
                <p className="text-xs font-bold text-[#075B64] mb-2">
                  Choose Driver Avatar:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(av.url);
                        setIsPhotoOpen(false);
                      }}
                      className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all ${
                        avatarUrl === av.url
                          ? 'border-[#F5B83D] bg-amber-50'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-[10px] font-bold text-[#075B64] mt-1">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="amber"
              size="lg"
              withArrow
              className="w-full text-sm font-black shadow-md shadow-[#F5B83D]/30"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>

      <div className="h-4" />
    </div>
  );
};
