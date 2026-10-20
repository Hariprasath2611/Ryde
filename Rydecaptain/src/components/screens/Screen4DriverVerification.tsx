import React, { useState, useEffect } from 'react';
import { CornerDecorations } from '../common/CornerDecorations';
import { Header } from '../common/Header';
import { Button } from '../common/Button';
import { CheckCircle2, ShieldCheck, FileText, Check, AlertCircle } from 'lucide-react';
import { DriverProfile } from '../../types';

interface Screen4DriverVerificationProps {
  onBack: () => void;
  onProceed: () => void;
  driver?: DriverProfile;
}

const DOCUMENT_OPTIONS = [
  { id: 'aadhaar', name: 'Aadhaar Card' },
  { id: 'pan', name: 'PAN Card' },
  { id: 'voter', name: 'Voter ID' },
];

export const Screen4DriverVerification: React.FC<Screen4DriverVerificationProps> = ({
  onBack,
  onProceed,
  driver,
}) => {
  const driverName = driver?.fullName || 'Arun Kumar';
  const driverPhone = driver?.mobileNumber || '9876543210';

  const [licenseNumber, setLicenseNumber] = useState('DL-0420110012345');
  const [selectedIdType, setSelectedIdType] = useState(DOCUMENT_OPTIONS[0]);
  const [idNumber, setIdNumber] = useState('4488 9922 1104');

  // Document attachments
  const [licenseDoc, setLicenseDoc] = useState<string | null>('DL_Front_Copy.pdf (1.2 MB)');
  const [identityDoc, setIdentityDoc] = useState<string | null>('Aadhaar_Verified.pdf (850 KB)');

  // OTP
  const [otp, setOtp] = useState('9021');
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [resendActive, setResendActive] = useState(false);

  // Checkbox & Errors
  const [confirmed, setConfirmed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  useEffect(() => {
    if (timerSeconds > 0) {
      const timer = setTimeout(() => setTimerSeconds(timerSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendActive(true);
    }
  }, [timerSeconds]);

  const handleResend = () => {
    setTimerSeconds(45);
    setResendActive(false);
    alert('Demo OTP Sent! Code: 9021');
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!licenseNumber.trim() || licenseNumber.trim().length < 8) {
      newErrors.licenseNumber = 'Please enter a valid Driving License Number';
    }
    if (!licenseDoc) {
      newErrors.licenseDoc = 'Please upload your driving license document';
    }
    if (!idNumber.trim() || idNumber.trim().length < 8) {
      newErrors.idNumber = `Please enter a valid ${selectedIdType.name} number`;
    }
    if (!identityDoc) {
      newErrors.identityDoc = `Please upload your ${selectedIdType.name} document`;
    }
    if (otp !== '9021') {
      newErrors.otp = 'Invalid OTP. Enter demo code 9021';
    }
    if (!confirmed) {
      newErrors.confirmed = 'Please confirm that the submitted details are correct';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccessOpen(true);
    }, 1000);
  };

  return (
    <div className="relative min-h-0 h-full flex flex-col justify-between bg-[#DDF0F0] px-6 py-4 overflow-y-auto select-none">
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <div className="relative z-10 max-w-[340px] w-full mx-auto my-auto py-2">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-[#075B64] tracking-tight">
            Driver Verification
          </h1>
          <p className="text-sm font-semibold text-[#075B64]/80 mt-1">
            Verified Credentials & Documents
          </p>
        </div>

        {/* Driver Identity Card */}
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/80 border border-[#6FA5A5]/30 mb-4 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#DDF0F0] flex items-center justify-center text-[#075B64]">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-sm font-black text-[#075B64]">{driverName}</p>
            <p className="text-xs text-[#075B64]/80 font-semibold">
              📱 +91 {driverPhone} • Registered Captain
            </p>
          </div>
        </div>

        <form onSubmit={handleProceed} className="space-y-4">
          {/* Section 1: Driving License */}
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#6FA5A5]/30 space-y-2">
            <p className="text-xs font-black text-[#075B64] uppercase tracking-wide">
              1. Driving License Verification
            </p>

            <div>
              <label className="block text-[11px] font-bold text-[#075B64] mb-1">
                Driving License Number *
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => {
                  setLicenseNumber(e.target.value.toUpperCase());
                  if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
                }}
                placeholder="e.g. DL-0420110012345"
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  errors.licenseNumber ? 'border-red-500 bg-red-50' : 'border-[#6FA5A5] bg-white'
                } text-xs font-bold text-[#075B64] focus:outline-none`}
              />
              {errors.licenseNumber && (
                <p className="text-[10px] font-bold text-red-600 mt-0.5">{errors.licenseNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#075B64] mb-1">
                Upload License Document *
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#6FA5A5] bg-white">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#075B64]" />
                  <div>
                    <p className="text-xs font-bold text-[#075B64]">
                      {licenseDoc ? '✓ Document Uploaded' : 'No File Chosen'}
                    </p>
                    <p className="text-[10px] text-slate-500">{licenseDoc || 'PDF or JPG format'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLicenseDoc('DL_TN01_2022003891.pdf (1.2 MB)');
                    if (errors.licenseDoc) setErrors({ ...errors, licenseDoc: '' });
                  }}
                  className="text-xs font-bold text-[#075B64] bg-[#DDF0F0] px-2.5 py-1 rounded border border-[#6FA5A5]/30 hover:bg-[#6FA5A5]/20"
                >
                  {licenseDoc ? 'Replace' : 'Upload'}
                </button>
              </div>
              {errors.licenseDoc && (
                <p className="text-[10px] font-bold text-red-600 mt-0.5">{errors.licenseDoc}</p>
              )}
            </div>
          </div>

          {/* Section 2: Identity Document */}
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#6FA5A5]/30 space-y-2">
            <p className="text-xs font-black text-[#075B64] uppercase tracking-wide">
              2. Government ID Proof
            </p>

            <div className="flex space-x-2">
              {DOCUMENT_OPTIONS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedIdType(doc)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedIdType.id === doc.id
                      ? 'bg-[#075B64] text-white'
                      : 'bg-[#DDF0F0] text-[#075B64]'
                  }`}
                >
                  {doc.name}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#075B64] mb-1">
                {selectedIdType.name} Number *
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => {
                  setIdNumber(e.target.value);
                  if (errors.idNumber) setErrors({ ...errors, idNumber: '' });
                }}
                placeholder={`Enter ${selectedIdType.name} number`}
                className={`w-full px-3 py-2.5 rounded-lg border ${
                  errors.idNumber ? 'border-red-500 bg-red-50' : 'border-[#6FA5A5] bg-white'
                } text-xs font-bold text-[#075B64] focus:outline-none`}
              />
              {errors.idNumber && (
                <p className="text-[10px] font-bold text-red-600 mt-0.5">{errors.idNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#075B64] mb-1">
                Attach {selectedIdType.name} Copy *
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#6FA5A5] bg-white">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#075B64]" />
                  <div>
                    <p className="text-xs font-bold text-[#075B64]">
                      {identityDoc ? '✓ ID Attached' : 'No File Chosen'}
                    </p>
                    <p className="text-[10px] text-slate-500">{identityDoc || 'PDF or Image'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIdentityDoc('Govt_ID_Proof.pdf (950 KB)');
                    if (errors.identityDoc) setErrors({ ...errors, identityDoc: '' });
                  }}
                  className="text-xs font-bold text-[#075B64] bg-[#DDF0F0] px-2.5 py-1 rounded border border-[#6FA5A5]/30 hover:bg-[#6FA5A5]/20"
                >
                  {identityDoc ? 'Replace' : 'Upload'}
                </button>
              </div>
              {errors.identityDoc && (
                <p className="text-[10px] font-bold text-red-600 mt-0.5">{errors.identityDoc}</p>
              )}
            </div>
          </div>

          {/* Section 3: Demo OTP */}
          <div className="p-3.5 rounded-xl bg-white/70 border border-[#6FA5A5]/30">
            <p className="text-xs font-black text-[#075B64] uppercase tracking-wide mb-1">
              3. Verification OTP
            </p>
            <p className="text-[11px] text-[#075B64]/80 mb-2">
              Enter demo code <span className="font-extrabold text-[#075B64]">9021</span>:
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (errors.otp) setErrors({ ...errors, otp: '' });
                }}
                maxLength={4}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-center font-black tracking-widest text-lg ${
                  errors.otp ? 'border-red-500 bg-red-50' : 'border-[#6FA5A5] bg-white'
                } text-[#075B64] focus:outline-none`}
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={!resendActive}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold text-white transition-colors ${
                  resendActive ? 'bg-[#075B64] hover:bg-[#05434a]' : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                {resendActive ? 'Resend' : `Wait ${timerSeconds}s`}
              </button>
            </div>
            {errors.otp && <p className="text-[10px] font-bold text-red-600 mt-1">{errors.otp}</p>}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 px-1">
            <button
              type="button"
              onClick={() => {
                setConfirmed(!confirmed);
                if (errors.confirmed) setErrors({ ...errors, confirmed: '' });
              }}
              className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                confirmed ? 'bg-[#075B64] border-[#075B64]' : 'bg-white border-[#075B64]'
              }`}
            >
              {confirmed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </button>
            <p className="text-xs font-bold text-[#075B64] leading-snug">
              I confirm all submitted documents and information are accurate.
            </p>
          </div>
          {errors.confirmed && (
            <p className="text-[10px] font-bold text-red-600 px-1">{errors.confirmed}</p>
          )}

          {/* Proceed Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="amber"
              size="lg"
              withArrow={!isVerifying}
              className="w-full text-sm font-black shadow-md shadow-[#F5B83D]/30"
            >
              {isVerifying ? 'Verifying...' : 'Proceed to Dashboard'}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-full text-center shadow-xl animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-[#075B64] mb-1">
              Verification Successful!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Welcome aboard, Captain {driverName}! Your credentials and driving license are verified.
            </p>
            <Button
              onClick={() => {
                setIsSuccessOpen(false);
                onProceed();
              }}
              variant="amber"
              size="md"
              className="w-full text-sm font-bold"
            >
              Go to Home Dashboard →
            </Button>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};
