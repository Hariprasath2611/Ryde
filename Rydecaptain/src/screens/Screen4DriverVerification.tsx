import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { DriverProfile } from '../types';

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
  const [driverName] = useState(driver?.fullName || 'Arun Kumar');
  const [licenseNumber, setLicenseNumber] = useState('DL-0420110012345');
  const [idNumber, setIdNumber] = useState('4488 9922 1104');
  const [selectedIdType, setSelectedIdType] = useState(DOCUMENT_OPTIONS[0]);

  // Upload status
  const [licenseDoc, setLicenseDoc] = useState<string | null>('DL_Front_Copy.pdf (1.2 MB)');
  const [identityDoc, setIdentityDoc] = useState<string | null>('Aadhaar_Verified.pdf (850 KB)');

  // OTP
  const [otp, setOtp] = useState('9021');
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [isResendActive, setIsResendActive] = useState(false);

  // Checkbox & Errors
  const [confirmed, setConfirmed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (timerSeconds > 0) {
      const timer = setTimeout(() => setTimerSeconds(timerSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsResendActive(true);
    }
  }, [timerSeconds]);

  const handleResendOtp = () => {
    setTimerSeconds(45);
    setIsResendActive(false);
    Alert.alert('Demo OTP Sent', 'Demo verification OTP: 9021');
  };

  const handleProceed = () => {
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
      newErrors.otp = 'Invalid OTP. Please enter demo code 9021';
    }
    if (!confirmed) {
      newErrors.confirmed = 'Please confirm that the submitted details are correct';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Incomplete Verification', 'Please fill all required verification fields.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccessModalOpen(true);
    }, 1000);
  };

  const handleFinishSuccess = () => {
    setIsSuccessModalOpen(false);
    onProceed();
  };

  return (
    <View style={styles.container}>
      <CornerDecorations />
      <Header showBack onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.heading}>Driver Verification</Text>
          <Text style={styles.subtitle}>Verified Credentials & Documents</Text>
        </View>

        {/* Registered Driver Identity Banner */}
        <View style={styles.driverBanner}>
          <View style={styles.driverAvatarBadge}>
            <Ionicons name="person" size={20} color="#075B64" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverNameText}>{driverName}</Text>
            <Text style={styles.driverPhoneText}>
              📱 +91 {driver?.mobileNumber || '9876543210'} • Registration Complete
            </Text>
          </View>
        </View>

        {/* Section 1: Driving License Details */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>1. Driving License Verification</Text>

          <Text style={styles.label}>Driving License Number *</Text>
          <TextInput
            value={licenseNumber}
            onChangeText={(t) => {
              setLicenseNumber(t.toUpperCase());
              if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
            }}
            placeholder="e.g. DL-0420110012345"
            placeholderTextColor="#99B5B5"
            style={[styles.textInput, !!errors.licenseNumber && styles.inputError]}
          />
          {!!errors.licenseNumber && (
            <Text style={styles.errorText}>{errors.licenseNumber}</Text>
          )}

          {/* Upload License Document Box */}
          <Text style={[styles.label, { marginTop: 12 }]}>Upload License Document *</Text>
          <View style={[styles.uploadBox, !!errors.licenseDoc && styles.inputError]}>
            <View style={styles.uploadLeft}>
              <View style={styles.pdfIconCircle}>
                <Ionicons name="document-text" size={22} color="#075B64" />
              </View>
              <View style={styles.uploadTextWrap}>
                <Text style={styles.uploadTitle}>
                  {licenseDoc ? '✓ Document Uploaded' : 'Upload Document'}
                </Text>
                <Text style={styles.uploadSub}>
                  {licenseDoc || 'Tap to attach PDF or JPG file'}
                </Text>
              </View>
            </View>

            <View style={styles.uploadActions}>
              <TouchableOpacity
                onPress={() => {
                  setLicenseDoc('DL_TN01_2022003891.pdf (1.2 MB)');
                  if (errors.licenseDoc) setErrors({ ...errors, licenseDoc: '' });
                  Alert.alert('License Attached', 'DL_TN01_2022003891.pdf attached.');
                }}
                style={styles.actionPill}
              >
                <Text style={styles.actionPillText}>{licenseDoc ? 'Replace' : 'Upload'}</Text>
              </TouchableOpacity>
              {licenseDoc ? (
                <TouchableOpacity onPress={() => setLicenseDoc(null)} style={styles.removeBtn}>
                  <Feather name="x" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {!!errors.licenseDoc && <Text style={styles.errorText}>{errors.licenseDoc}</Text>}
        </View>

        {/* Section 2: Identity Document (Aadhaar / Voter ID) */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>2. Government ID Proof</Text>

          <View style={styles.tabRow}>
            {DOCUMENT_OPTIONS.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => setSelectedIdType(doc)}
                style={[
                  styles.tabPill,
                  selectedIdType.id === doc.id && styles.tabPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedIdType.id === doc.id && styles.tabTextActive,
                  ]}
                >
                  {doc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{selectedIdType.name} Number *</Text>
          <TextInput
            value={idNumber}
            onChangeText={(t) => {
              setIdNumber(t);
              if (errors.idNumber) setErrors({ ...errors, idNumber: '' });
            }}
            placeholder={`Enter ${selectedIdType.name} number`}
            placeholderTextColor="#99B5B5"
            style={[styles.textInput, !!errors.idNumber && styles.inputError]}
          />
          {!!errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}

          {/* Upload ID Document */}
          <Text style={[styles.label, { marginTop: 12 }]}>Attach {selectedIdType.name} Copy *</Text>
          <View style={[styles.uploadBox, !!errors.identityDoc && styles.inputError]}>
            <View style={styles.uploadLeft}>
              <View style={styles.pdfIconCircle}>
                <Ionicons name="shield-checkmark" size={22} color="#075B64" />
              </View>
              <View style={styles.uploadTextWrap}>
                <Text style={styles.uploadTitle}>
                  {identityDoc ? '✓ ID Attached' : 'Attach File'}
                </Text>
                <Text style={styles.uploadSub}>
                  {identityDoc || 'PDF / PNG / JPG format'}
                </Text>
              </View>
            </View>

            <View style={styles.uploadActions}>
              <TouchableOpacity
                onPress={() => {
                  setIdentityDoc('Govt_ID_Proof.pdf (950 KB)');
                  if (errors.identityDoc) setErrors({ ...errors, identityDoc: '' });
                  Alert.alert('ID Attached', 'Government ID document attached.');
                }}
                style={styles.actionPill}
              >
                <Text style={styles.actionPillText}>{identityDoc ? 'Replace' : 'Upload'}</Text>
              </TouchableOpacity>
              {identityDoc ? (
                <TouchableOpacity onPress={() => setIdentityDoc(null)} style={styles.removeBtn}>
                  <Feather name="x" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {!!errors.identityDoc && (
            <Text style={styles.errorText}>{errors.identityDoc}</Text>
          )}
        </View>

        {/* Section 3: Verification OTP */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>3. Demo Verification OTP</Text>
          <Text style={styles.otpHelperText}>
            Enter demo code <Text style={{ fontWeight: '900' }}>9021</Text> to verify your mobile identity:
          </Text>

          <View style={styles.otpRow}>
            <TextInput
              value={otp}
              onChangeText={(t) => {
                setOtp(t);
                if (errors.otp) setErrors({ ...errors, otp: '' });
              }}
              placeholder="Enter 4-digit code"
              placeholderTextColor="#99B5B5"
              keyboardType="numeric"
              maxLength={4}
              style={[styles.otpInput, !!errors.otp && styles.inputError]}
            />

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={!isResendActive}
              style={[styles.resendBtn, !isResendActive && styles.resendBtnDisabled]}
            >
              <Text style={styles.resendBtnText}>
                {isResendActive ? 'Resend' : `Wait ${timerSeconds}s`}
              </Text>
            </TouchableOpacity>
          </View>
          {!!errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
        </View>

        {/* Confirmation Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setConfirmed(!confirmed);
            if (errors.confirmed) setErrors({ ...errors, confirmed: '' });
          }}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Feather name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm all submitted documents and information are accurate.
          </Text>
        </TouchableOpacity>
        {!!errors.confirmed && <Text style={styles.errorText}>{errors.confirmed}</Text>}

        {/* Proceed Button */}
        <View style={styles.btnArea}>
          <Button
            title={isVerifying ? 'Verifying...' : 'Proceed to Dashboard'}
            withArrow={!isVerifying}
            variant="amber"
            size="lg"
            onPress={handleProceed}
          />
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleFinishSuccess}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check-circle" size={44} color="#10B981" />
            </View>
            <Text style={styles.successModalTitle}>Verification Successful!</Text>
            <Text style={styles.successModalSubtitle}>
              Welcome aboard, Captain {driverName}! Your driving license and documents have been verified.
            </Text>

            <TouchableOpacity onPress={handleFinishSuccess} style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>Go to Home Dashboard →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF0F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#075B64',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075B64',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.85,
  },
  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(7, 91, 100, 0.2)',
  },
  driverAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  driverNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#075B64',
  },
  driverPhoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#075B64',
    marginTop: 2,
  },
  cardSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(7, 91, 100, 0.15)',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#075B64',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075B64',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#075B64',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 4,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pdfIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#075B64',
  },
  uploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPill: {
    backgroundColor: '#DDF0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#075B64',
  },
  removeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: '#075B64',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#075B64',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  otpHelperText: {
    fontSize: 12,
    color: '#075B64',
    marginBottom: 10,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '900',
    color: '#075B64',
    backgroundColor: '#FFFFFF',
    letterSpacing: 4,
  },
  resendBtn: {
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#075B64',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#075B64',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#075B64',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#075B64',
    flex: 1,
    lineHeight: 16,
  },
  btnArea: {
    marginTop: 10,
    alignItems: 'center',
  },

  /* Success Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#075B64',
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  continueBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5B83D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#075B64',
  },
});
