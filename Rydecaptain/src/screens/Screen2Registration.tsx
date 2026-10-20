import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CornerDecorations } from '../components/CornerDecorations';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

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
  { flag: '🇺🇸', code: '+1', name: 'United States', digits: 10 },
  { flag: '🇬🇧', code: '+44', name: 'United Kingdom', digits: 10 },
  { flag: '🇦🇪', code: '+971', name: 'UAE', digits: 9 },
  { flag: '🇸🇬', code: '+65', name: 'Singapore', digits: 8 },
];

const SAMPLE_AVATARS = [
  {
    id: 'avatar1',
    label: 'Driver Arun',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar2',
    label: 'Driver Rajesh',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar3',
    label: 'Driver Priya',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'avatar4',
    label: 'Driver Michael',
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

  // Modals & Errors
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleContinue = () => {
    let hasError = false;

    // Validate Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError('Please enter your full name (minimum 2 characters)');
      hasError = true;
    } else {
      setNameError('');
    }

    // Validate Phone
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== selectedCountry.digits) {
      setPhoneError(
        `Please enter a valid ${selectedCountry.digits}-digit mobile number for ${selectedCountry.name}`
      );
      hasError = true;
    } else {
      setPhoneError('');
    }

    if (hasError) return;

    onContinue({
      fullName: fullName.trim(),
      mobileNumber: cleanPhone,
      avatarUrl,
    });
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
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subtitle}>create your account</Text>
        </View>

        {/* Full Name Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (nameError) setNameError('');
            }}
            placeholder="Enter full name"
            placeholderTextColor="#99B5B5"
            style={[styles.input, !!nameError && styles.inputError]}
          />
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>

        {/* Mobile Number Field with Country Code Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Enter Your Mobile Number *</Text>
          <View style={[styles.phoneInputRow, !!phoneError && styles.inputError]}>
            {/* Country Code Trigger */}
            <TouchableOpacity
              onPress={() => setIsCountryModalOpen(true)}
              style={styles.flagSlot}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <Feather name="chevron-down" size={13} color="#075B64" style={{ marginLeft: 2 }} />
              <View style={styles.pipe} />
            </TouchableOpacity>

            <TextInput
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text.replace(/\D/g, '').slice(0, selectedCountry.digits));
                if (phoneError) setPhoneError('');
              }}
              placeholder={`Enter ${selectedCountry.digits}-digit number`}
              placeholderTextColor="#99B5B5"
              keyboardType="phone-pad"
              maxLength={selectedCountry.digits}
              style={styles.phoneTextInput}
            />
          </View>
          {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
        </View>

        {/* Profile Image Section */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Profile Image</Text>
          <View style={styles.uploadBox}>
            <View style={styles.uploadLeft}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.thumbImage} />
              ) : (
                <View style={styles.uploadIconWrap}>
                  <Feather name="user" size={24} color="#075B64" />
                </View>
              )}
              <View style={styles.uploadTextWrap}>
                <Text style={styles.uploadTitle}>
                  {avatarUrl ? 'Photo Attached' : 'No Photo Selected'}
                </Text>
                <Text style={styles.uploadSub}>JPG / PNG • Verified Driver ID</Text>
              </View>
            </View>

            <View style={styles.uploadActions}>
              <TouchableOpacity
                onPress={() => setIsPhotoModalOpen(true)}
                style={styles.sampleBadge}
                activeOpacity={0.7}
              >
                <Text style={styles.sampleBadgeText}>
                  {avatarUrl ? 'Change' : 'Select'}
                </Text>
              </TouchableOpacity>

              {avatarUrl ? (
                <TouchableOpacity
                  onPress={() => setAvatarUrl('')}
                  style={styles.removeBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.btnArea}>
          <Button
            title="Continue"
            withArrow
            variant="amber"
            size="lg"
            onPress={handleContinue}
          />
        </View>
      </ScrollView>

      {/* Country Code Modal */}
      <Modal
        visible={isCountryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCountryModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setIsCountryModalOpen(false)}>
                <Feather name="x" size={20} color="#075B64" />
              </TouchableOpacity>
            </View>

            {COUNTRY_CODES.map((country) => (
              <TouchableOpacity
                key={country.code}
                onPress={() => {
                  setSelectedCountry(country);
                  setIsCountryModalOpen(false);
                }}
                style={[
                  styles.countryRow,
                  selectedCountry.code === country.code && styles.countryRowActive,
                ]}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryDial}>{country.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Profile Photo Selection Modal */}
      <Modal
        visible={isPhotoModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Driver Avatar</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Feather name="x" size={20} color="#075B64" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Choose from verified profile avatar samples or attach a driver photo:
            </Text>

            <View style={styles.avatarGrid}>
              {SAMPLE_AVATARS.map((av) => (
                <TouchableOpacity
                  key={av.id}
                  onPress={() => {
                    setAvatarUrl(av.url);
                    setIsPhotoModalOpen(false);
                    Alert.alert('Avatar Selected', `${av.label} selected as profile image.`);
                  }}
                  style={[
                    styles.avatarGridItem,
                    avatarUrl === av.url && styles.avatarGridItemActive,
                  ]}
                >
                  <Image source={{ uri: av.url }} style={styles.avatarGridImg} />
                  <Text style={styles.avatarGridLabel}>{av.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#075B64',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#075B64',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.85,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#075B64',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#075B64',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 5,
    marginLeft: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  flagSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
  },
  pipe: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(111, 165, 165, 0.4)',
    marginLeft: 8,
    marginRight: 8,
  },
  phoneTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '700',
    color: '#075B64',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#6FA5A5',
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DDF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#075B64',
  },
  uploadSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(7, 91, 100, 0.7)',
    marginTop: 2,
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sampleBadge: {
    backgroundColor: '#DDF0F0',
    borderWidth: 1,
    borderColor: '#6FA5A5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sampleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075B64',
  },
  removeBtn: {
    padding: 6,
  },
  btnArea: {
    marginTop: 20,
    alignItems: 'center',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#075B64',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 16,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  countryRowActive: {
    backgroundColor: '#DDF0F0',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#075B64',
  },
  countryDial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  avatarGridItem: {
    width: '47%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  avatarGridItemActive: {
    borderColor: '#F5B83D',
    backgroundColor: '#FFFBEB',
  },
  avatarGridImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  avatarGridLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#075B64',
  },
});
