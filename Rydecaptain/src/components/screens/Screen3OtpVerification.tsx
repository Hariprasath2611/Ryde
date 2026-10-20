import React, { useState, useRef, useEffect } from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { Button } from '../common/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Screen3OtpVerificationProps {
  onBack: () => void;
  onProceed: () => void;
  mobileNumber?: string;
}

export const Screen3OtpVerification: React.FC<Screen3OtpVerificationProps> = ({
  onBack,
  onProceed,
  mobileNumber = '9876543210',
}) => {
  const [digits, setDigits] = useState<string[]>(['4', '4', '4', '4', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [showResentToast, setShowResentToast] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setError(null);

    // Auto focus next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFillDemo = () => {
    setDigits(['4', '4', '4', '4', '8', '9']);
    setError(null);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setShowResentToast(true);
    setTimeout(() => setShowResentToast(false), 3000);
  };

  const handleProceed = () => {
    const enteredOtp = digits.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    // Verification succeeded
    onProceed();
  };

  return (
    <div className="relative min-h-0 h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-2 overflow-hidden">
      <CornerDecorations />

      {/* Header */}
      <Header showBack onBack={onBack} />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-4">
        {/* Heading */}
        <div className="text-left mb-6">
          <h1 className="text-2xl font-black text-[#075B64] tracking-tight">
            Enter OTP
          </h1>
          <p className="text-xs font-semibold text-[#075B64]/80 mt-1">
            We sent a verification code to +91 {mobileNumber}
          </p>
        </div>

        {/* OTP Container - styled exactly like Reference Screen 3 */}
        <div className="bg-[#8EB7B7]/40 border border-[#6FA5A5] rounded-xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 max-w-[280px] mx-auto">
            {digits.map((digit, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                <input
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`
                    w-9 h-11 text-center text-xl font-black text-[#075B64] bg-white/80 rounded-lg
                    border-b-4 transition-all duration-150 focus:outline-none focus:bg-white
                    ${digit ? 'border-[#075B64]' : 'border-[#6FA5A5]'}
                    focus:border-[#F5B83D] focus:ring-2 focus:ring-[#F5B83D]/30
                  `}
                />
              </div>
            ))}
          </div>

          {/* Quick Demo Helper */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-[#075B64] bg-white/70 hover:bg-white px-2.5 py-1 rounded-md shadow-xs transition-colors"
            >
              Fill Demo OTP (444489)
            </button>
          </div>
        </div>

        {/* Resend Link with Underline */}
        <div className="text-center my-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className={`
              text-xs font-bold transition-all
              ${
                resendCooldown > 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-[#075B64] underline underline-offset-4 hover:text-[#053b41]'
              }
            `}
          >
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend'}
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 flex items-center justify-center space-x-1.5 text-xs font-bold text-red-600 bg-red-50 py-2 px-3 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showResentToast && (
          <div className="mb-4 flex items-center justify-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>New OTP sent to your registered mobile number!</span>
          </div>
        )}

        {/* Proceed Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleProceed}
            variant="amber"
            size="lg"
            className="text-base font-extrabold shadow-md shadow-[#F5B83D]/30"
          >
            Proceed
          </Button>
        </div>
      </div>

      {/* Pagination Dots (Right Active) */}
      <div className="relative z-10 pb-4 flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-[#6FA5A5]/70" />
        <span className="w-2 h-2 rounded-full bg-[#6FA5A5]/70" />
        <span className="w-6 h-2 rounded-full bg-[#F5B83D] transition-all" />
      </div>
    </div>
  );
};
