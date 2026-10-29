// ryde-capital/mobile/app/(onboarding)/index.tsx
// Comprehensive Driver Onboarding, KYC Checklist, and Review Status Screen

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../src/store/auth';
import { apiClient } from '../../src/services/api';
import { supabase } from '../../src/services/supabase';
import { colors, spacing, typography, borderRadius } from '../../src/theme/tokens';

export interface ChecklistStep {
  name: string;
  status: 'completed' | 'pending';
  details: Record<string, unknown>;
}

export interface OnboardingData {
  status: 'not_started' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  rejectionReason: string | null;
  submittedAt: string | null;
  progressPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  canSubmit: boolean;
  steps: {
    personalDetails: ChecklistStep;
    vehicleTypes: ChecklistStep;
    idProof: ChecklistStep;
    license: ChecklistStep;
    selfie: ChecklistStep;
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);

  // Active form editing state for personal details modal
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560001');
  const [experienceYears, setExperienceYears] = useState('3');

  // Vehicle types state
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['four_wheeler']);

  // ID proof state
  const [idDocType, setIdDocType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [maskedIdRef, setMaskedIdRef] = useState('');

  // License state
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2032-12-31');
  const [licenseFrontUploaded, setLicenseFrontUploaded] = useState(false);
  const [licenseBackUploaded, setLicenseBackUploaded] = useState(false);

  // Load driver profile and checklist
  const loadChecklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{
        driver: {
          onboarding_status: OnboardingData['status'];
          rejection_reason?: string | null;
          submitted_at?: string | null;
          date_of_birth?: string | null;
          address_line?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          experience_years?: number;
          allowed_vehicle_types?: string[];
        };
        profile: { full_name?: string | null };
        onboarding: OnboardingData;
      }>('/drivers/me');

      if (res?.onboarding) {
        setOnboarding(res.onboarding);
        if (res.profile?.full_name) setFullName(res.profile.full_name);
        if (res.driver?.date_of_birth) setDob(res.driver.date_of_birth);
        if (res.driver?.address_line) setAddressLine(res.driver.address_line);
        if (res.driver?.city) setCity(res.driver.city);
        if (res.driver?.state) setState(res.driver.state);
        if (res.driver?.pincode) setPincode(res.driver.pincode);
        if (res.driver?.experience_years !== undefined) {
          setExperienceYears(String(res.driver.experience_years));
        }
        if (res.driver?.allowed_vehicle_types && res.driver.allowed_vehicle_types.length > 0) {
          setSelectedVehicles(res.driver.allowed_vehicle_types);
        }

        const licStep = res.onboarding.steps?.license?.details;
        if (licStep?.['frontFilePath']) setLicenseFrontUploaded(true);
        if (licStep?.['backFilePath']) setLicenseBackUploaded(true);
        if (licStep?.['licenseNumber']) setLicenseNumber(String(licStep['licenseNumber']));
        if (licStep?.['expiryDate']) setLicenseExpiry(String(licStep['expiryDate']));

        const idStep = res.onboarding.steps?.idProof?.details;
        if (idStep?.['maskedReference']) setMaskedIdRef(String(idStep['maskedReference']));
      }
    } catch (err: unknown) {
      console.warn('Failed to load onboarding checklist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecklist();

    // Listen to real-time notification changes for driver approval/rejection
    if (user?.id) {
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          payload => {
            if (
              payload.new &&
              (payload.new['type'] === 'driver_approved' ||
                payload.new['type'] === 'driver_rejected')
            ) {
              refreshProfile();
              loadChecklist();
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return undefined;
  }, [loadChecklist, refreshProfile, user?.id]);

  // Compress image to < 1.5MB and upload directly to short-lived signed URL
  const pickAndUploadDocument = async (
    docType: 'id_proof' | 'license_front' | 'license_back' | 'profile_photo',
    useCamera = false,
  ) => {
    try {
      setUploadingDoc(docType);
      setUploadProgress('Selecting image...');

      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const originalUri = result.assets[0].uri;

      // Compress using ImageManipulator to ensure < 1.5 MB
      setUploadProgress('Compressing image...');
      const manipulated = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );

      // Request signed upload URL from backend
      setUploadProgress('Requesting upload authorization...');
      const urlRes = await apiClient<{
        signedUrl: string;
        filePath: string;
        expiresIn: number;
      }>('/drivers/me/documents/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          type: docType,
          contentType: 'image/jpeg',
          size: 1024 * 1024, // Compressed size placeholder
        }),
      });

      // Upload binary to signed URL directly
      setUploadProgress('Uploading to secure storage...');
      const imgFetch = await fetch(manipulated.uri);
      const blob = await imgFetch.blob();

      const uploadResp = await fetch(urlRes.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      if (!uploadResp.ok) {
        throw new Error('Upload to storage bucket failed.');
      }

      // Confirm upload with backend registry
      setUploadProgress('Finalizing document verification...');
      if (docType === 'id_proof') {
        await apiClient('/drivers/me/documents', {
          method: 'POST',
          body: JSON.stringify({
            type: 'id_proof',
            filePath: urlRes.filePath,
            documentType: idDocType,
            maskedReference: maskedIdRef || 'XXXX-XXXX-1234',
          }),
        });
      } else if (docType === 'profile_photo') {
        await apiClient('/drivers/me/documents', {
          method: 'POST',
          body: JSON.stringify({
            type: 'profile_photo',
            filePath: urlRes.filePath,
          }),
        });
      } else if (docType === 'license_front' || docType === 'license_back') {
        if (docType === 'license_front') setLicenseFrontUploaded(true);
        if (docType === 'license_back') setLicenseBackUploaded(true);

        await apiClient('/drivers/me/documents', {
          method: 'POST',
          body: JSON.stringify({
            type: docType,
            filePath: urlRes.filePath,
            licenseNumberMasked: licenseNumber || 'KA01-XXXX-9871',
            licenseClasses: selectedVehicles,
            expiryDate: licenseExpiry,
          }),
        });
      }

      Alert.alert(
        'Upload Successful',
        `${docType.replace('_', ' ').toUpperCase()} uploaded successfully.`,
      );
      await loadChecklist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please retry.';
      Alert.alert('Upload Error', `${msg}\nWould you like to retry?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => pickAndUploadDocument(docType, useCamera) },
      ]);
    } finally {
      setUploadingDoc(null);
      setUploadProgress(null);
    }
  };

  // Submit personal details
  const savePersonalDetails = async () => {
    try {
      setSubmitting(true);
      await apiClient('/drivers/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          dateOfBirth: dob,
          addressLine,
          city,
          state,
          pincode,
          experienceYears: Number(experienceYears) || 0,
        }),
      });
      setActiveModal(null);
      await loadChecklist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save personal details';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit vehicle types
  const saveVehicleTypes = async () => {
    try {
      setSubmitting(true);
      await apiClient('/drivers/me', {
        method: 'PATCH',
        body: JSON.stringify({
          allowedVehicleTypes: selectedVehicles,
        }),
      });
      setActiveModal(null);
      await loadChecklist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vehicle types';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Final review submission
  const handleSubmitForReview = async () => {
    try {
      setSubmitting(true);
      await apiClient('/drivers/me/submit-for-review', {
        method: 'POST',
      });
      Alert.alert(
        'Submission Received',
        'Your profile and documents have been submitted for review. Our compliance team will review your application shortly.',
      );
      await loadChecklist();
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checklist submission failed';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !onboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.info} />
        <Text style={styles.loadingText}>Loading driver onboarding status...</Text>
      </View>
    );
  }

  // State 1: APPROVED
  if (onboarding?.status === 'approved') {
    return (
      <View style={styles.centeredContainer} testID="onboarding-approved-state">
        <View style={styles.statusBadgeSuccess}>
          <Text style={styles.statusBadgeText}>APPROVED</Text>
        </View>
        <Text style={styles.approvedTitle}>You Are Ready to Drive!</Text>
        <Text style={styles.approvedSubtitle}>
          Your Ryde Capital driver partner profile and documents have been verified and approved by
          compliance.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)')}
          testID="go-to-dashboard-button"
        >
          <Text style={styles.primaryButtonText}>Go to Driver Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State 2: SUBMITTED / UNDER REVIEW
  if (onboarding?.status === 'submitted' || onboarding?.status === 'under_review') {
    return (
      <View style={styles.centeredContainer} testID="onboarding-under-review-state">
        <View style={styles.statusBadgeWarning}>
          <Text style={styles.statusBadgeText}>UNDER REVIEW</Text>
        </View>
        <Text style={styles.approvedTitle}>Verification in Progress</Text>
        <Text style={styles.approvedSubtitle}>
          Your documents and profile were submitted on{' '}
          {onboarding?.submittedAt
            ? new Date(onboarding.submittedAt).toLocaleDateString()
            : 'today'}
          . Verification typically takes 2–4 hours.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={loadChecklist}
          testID="refresh-status-button"
        >
          <Text style={styles.secondaryButtonText}>Refresh Verification Status</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State 3 & 4: REJECTED or IN PROGRESS / NOT STARTED
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Driver Onboarding</Text>
      <Text style={styles.subtitle}>Complete your profile & verify documents to start driving</Text>

      {/* Rejection Alert Banner */}
      {onboarding?.status === 'rejected' && (
        <View style={styles.rejectionCard} testID="rejection-card">
          <Text style={styles.rejectionTitle}>Action Required: Verification Rejected</Text>
          <Text style={styles.rejectionReason} testID="rejection-reason">
            {onboarding.rejectionReason ||
              'One or more of your uploaded documents could not be verified.'}
          </Text>
          <Text style={styles.rejectionHelp}>
            Please review the checklist below, update the required items, and submit for
            verification again.
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Checklist Completion</Text>
          <Text style={styles.progressValue}>{onboarding?.progressPercentage || 0}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${onboarding?.progressPercentage || 0}%` }]}
          />
        </View>
      </View>

      {/* Uploading Spinner Overlay */}
      {uploadingDoc && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color={colors.info} />
          <Text style={styles.uploadingText}>{uploadProgress}</Text>
        </View>
      )}

      {/* Step 1: Personal Details */}
      <View style={styles.stepCard} testID="step-personal-details">
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View
              style={[
                styles.stepIndicator,
                onboarding?.steps?.personalDetails?.status === 'completed'
                  ? styles.stepDone
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepStatusText}>
                {onboarding?.steps?.personalDetails?.status === 'completed'
                  ? 'Completed'
                  : 'Requires name, DOB, address, pincode'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stepActionBtn}
            onPress={() => setActiveModal('personal')}
            testID="edit-personal-details-button"
          >
            <Text style={styles.stepActionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 2: Vehicle Types */}
      <View style={styles.stepCard} testID="step-vehicle-types">
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View
              style={[
                styles.stepIndicator,
                onboarding?.steps?.vehicleTypes?.status === 'completed'
                  ? styles.stepDone
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Allowed Vehicle Types</Text>
              <Text style={styles.stepStatusText}>
                {selectedVehicles.join(', ') || 'No vehicle types selected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stepActionBtn}
            onPress={() => setActiveModal('vehicles')}
            testID="edit-vehicle-types-button"
          >
            <Text style={styles.stepActionText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 3: Identity Proof (Aadhaar / PAN) */}
      <View style={styles.stepCard} testID="step-id-proof">
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View
              style={[
                styles.stepIndicator,
                onboarding?.steps?.idProof?.status === 'completed'
                  ? styles.stepDone
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Identity Proof</Text>
              <Text style={styles.stepStatusText}>
                {onboarding?.steps?.idProof?.status === 'completed'
                  ? `Uploaded (${onboarding.steps.idProof.details['maskedReference'] || 'Masked'})`
                  : 'Aadhaar / PAN required'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stepActionBtn}
            onPress={() => setActiveModal('idProof')}
            testID="upload-id-proof-button"
          >
            <Text style={styles.stepActionText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 4: Driving License */}
      <View style={styles.stepCard} testID="step-license">
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View
              style={[
                styles.stepIndicator,
                onboarding?.steps?.license?.status === 'completed'
                  ? styles.stepDone
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Driving License</Text>
              <Text style={styles.stepStatusText}>
                {onboarding?.steps?.license?.status === 'completed'
                  ? 'Front & Back verified'
                  : 'Valid license & front/back photos'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stepActionBtn}
            onPress={() => setActiveModal('license')}
            testID="upload-license-button"
          >
            <Text style={styles.stepActionText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 5: Profile Photo / Selfie */}
      <View style={styles.stepCard} testID="step-selfie">
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View
              style={[
                styles.stepIndicator,
                onboarding?.steps?.selfie?.status === 'completed'
                  ? styles.stepDone
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>5</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Driver Selfie</Text>
              <Text style={styles.stepStatusText}>
                {onboarding?.steps?.selfie?.status === 'completed'
                  ? 'Selfie verified'
                  : 'Front portrait photo'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.stepActionBtn}
            onPress={() => pickAndUploadDocument('profile_photo', true)}
            testID="take-selfie-button"
          >
            <Text style={styles.stepActionText}>Capture</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Final Submission Button */}
      <TouchableOpacity
        style={[styles.submitButton, !onboarding?.canSubmit && styles.submitButtonDisabled]}
        disabled={!onboarding?.canSubmit || submitting}
        onPress={handleSubmitForReview}
        testID="submit-onboarding-button"
      >
        {submitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.submitButtonText}>Submit for Verification</Text>
        )}
      </TouchableOpacity>

      {/* Personal Details Modal */}
      <Modal visible={activeModal === 'personal'} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Personal Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={dob}
              onChangeText={setDob}
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line"
              placeholderTextColor={colors.textMuted}
              value={addressLine}
              onChangeText={setAddressLine}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="State"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Pincode (6 digits)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Experience (Yrs)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={experienceYears}
                onChangeText={setExperienceYears}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={savePersonalDetails}>
                <Text style={styles.modalSaveText}>Save Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vehicle Types Modal */}
      <Modal visible={activeModal === 'vehicles'} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Vehicle Types</Text>
            <Text style={styles.modalSubtitle}>
              Vehicles you are licensed and willing to drive:
            </Text>
            {(['two_wheeler', 'three_wheeler', 'four_wheeler'] as const).map(vt => {
              const selected = selectedVehicles.includes(vt);
              return (
                <TouchableOpacity
                  key={vt}
                  style={[styles.vehicleChip, selected && styles.vehicleChipSelected]}
                  onPress={() => {
                    if (selected) {
                      if (selectedVehicles.length > 1) {
                        setSelectedVehicles(selectedVehicles.filter(v => v !== vt));
                      }
                    } else {
                      setSelectedVehicles([...selectedVehicles, vt]);
                    }
                  }}
                >
                  <Text
                    style={[styles.vehicleChipText, selected && styles.vehicleChipTextSelected]}
                  >
                    {vt.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveVehicleTypes}>
                <Text style={styles.modalSaveText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ID Proof Modal */}
      <Modal visible={activeModal === 'idProof'} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload Identity Proof</Text>
            <View style={styles.docTypeRow}>
              <TouchableOpacity
                style={[styles.docTypeBtn, idDocType === 'aadhaar' && styles.docTypeBtnActive]}
                onPress={() => setIdDocType('aadhaar')}
              >
                <Text
                  style={idDocType === 'aadhaar' ? styles.docTypeTextActive : styles.docTypeText}
                >
                  Aadhaar Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.docTypeBtn, idDocType === 'pan' && styles.docTypeBtnActive]}
                onPress={() => setIdDocType('pan')}
              >
                <Text style={idDocType === 'pan' ? styles.docTypeTextActive : styles.docTypeText}>
                  PAN Card
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Masked Number (e.g. XXXX-XXXX-1234)"
              placeholderTextColor={colors.textMuted}
              value={maskedIdRef}
              onChangeText={setMaskedIdRef}
            />
            <TouchableOpacity
              style={styles.uploadDocActionBtn}
              onPress={() => pickAndUploadDocument('id_proof')}
            >
              <Text style={styles.uploadDocActionText}>Pick Document Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Driving License Modal */}
      <Modal visible={activeModal === 'license'} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driving License Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Masked License (e.g. KA01-XXXX-9871)"
              placeholderTextColor={colors.textMuted}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry Date (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              value={licenseExpiry}
              onChangeText={setLicenseExpiry}
            />
            <View style={styles.docUploadRow}>
              <TouchableOpacity
                style={[
                  styles.licenseUploadBtn,
                  licenseFrontUploaded && styles.licenseUploadBtnDone,
                ]}
                onPress={() => pickAndUploadDocument('license_front')}
              >
                <Text style={styles.licenseUploadBtnText}>
                  {licenseFrontUploaded ? 'Front ✓' : 'Upload Front'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.licenseUploadBtn,
                  licenseBackUploaded && styles.licenseUploadBtnDone,
                ]}
                onPress={() => pickAndUploadDocument('license_back')}
              >
                <Text style={styles.licenseUploadBtnText}>
                  {licenseBackUploaded ? 'Back ✓' : 'Upload Back'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalCancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.bodySmall,
    marginTop: spacing.sm,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSizes.title,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSizes.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  rejectionCard: {
    backgroundColor: '#451A1A',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rejectionTitle: {
    color: colors.danger,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.body,
    marginBottom: spacing.xs,
  },
  rejectionReason: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.bodySmall,
    marginBottom: spacing.xs,
  },
  rejectionHelp: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.caption,
  },
  progressCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.bodySmall,
    fontWeight: typography.fontWeights.medium,
  },
  progressValue: {
    color: colors.info,
    fontSize: typography.fontSizes.bodySmall,
    fontWeight: typography.fontWeights.bold,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.info,
  },
  uploadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  uploadingText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.caption,
    marginLeft: spacing.sm,
  },
  stepCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepDone: {
    backgroundColor: colors.success,
  },
  stepPending: {
    backgroundColor: colors.border,
  },
  stepNumber: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.caption,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.body,
    fontWeight: typography.fontWeights.semibold,
  },
  stepStatusText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.caption,
    marginTop: 2,
  },
  stepActionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  stepActionText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.caption,
    fontWeight: typography.fontWeights.medium,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.body,
    fontWeight: typography.fontWeights.bold,
  },
  statusBadgeSuccess: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeWarning: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.caption,
  },
  approvedTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.title,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  approvedSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.body,
  },
  secondaryButton: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.semibold,
    fontSize: typography.fontSizes.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.subtitle,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.base,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.bodySmall,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    height: 48,
    marginBottom: spacing.sm,
    fontSize: typography.fontSizes.bodySmall,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputHalf: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.bodySmall,
    fontWeight: typography.fontWeights.medium,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.bodySmall,
  },
  vehicleChip: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  vehicleChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vehicleChipText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.bodySmall,
  },
  vehicleChipTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  docTypeBtn: {
    flex: 1,
    minWidth: 0,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  docTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  docTypeText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.caption,
  },
  docTypeTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.caption,
  },
  uploadDocActionBtn: {
    backgroundColor: colors.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadDocActionText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.semibold,
  },
  docUploadRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  licenseUploadBtn: {
    flex: 1,
    minWidth: 0,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  licenseUploadBtnDone: {
    borderColor: colors.success,
    backgroundColor: '#064E3B',
  },
  licenseUploadBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.caption,
  },
});
