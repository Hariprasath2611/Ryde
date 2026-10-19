import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, typography, shape } from '../theme/tokens';

export interface UploadFieldProps {
  label?: string;
  uploaded?: boolean;
  uploading?: boolean;
  progress?: number;
  fileName?: string;
  hint?: string;
  error?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const UploadField: React.FC<UploadFieldProps> = ({
  label,
  uploaded = false,
  uploading = false,
  progress = 0,
  hint = 'JPG, PNG or PDF',
  error,
  onPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={onPress}
        disabled={uploading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label || 'Upload file'}
        style={[
          styles.uploadBox,
          error ? styles.uploadBoxError : null,
          uploaded ? styles.uploadBoxUploaded : null,
        ]}
      >
        <View
          style={[
            styles.iconWrapper,
            uploaded ? styles.iconWrapperUploaded : null,
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : uploaded ? (
            <Text style={styles.checkIcon}>✓</Text>
          ) : (
            <Text style={styles.uploadArrow}>↑</Text>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleText}>
            {uploading
              ? `Uploading... ${Math.round(progress * 100)}%`
              : uploaded
              ? 'Uploaded'
              : 'Tap to upload'}
          </Text>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
    marginBottom: 8,
  },
  uploadBox: {
    height: 76,
    borderRadius: shape.fieldRadius,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  uploadBoxError: {
    borderColor: colors.danger,
  },
  uploadBoxUploaded: {
    backgroundColor: colors.white,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperUploaded: {
    backgroundColor: '#8EB5BA',
  },
  uploadArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.darkTeal,
  },
  checkIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.darkTeal,
  },
  hintText: {
    fontSize: typography.fontSize.micro,
    color: colors.mutedText,
    marginTop: 2,
  },
  errorText: {
    fontSize: typography.fontSize.micro,
    color: colors.danger,
    marginTop: 4,
  },
});

export default UploadField;
