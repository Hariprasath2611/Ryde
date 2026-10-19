import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, shape } from '../../../src/theme/tokens';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { Header } from '../../../src/components/Header';
import { StarRating } from '../../../src/components/StarRating';
import { Chip } from '../../../src/components/Chip';
import { Button } from '../../../src/components/Button';
import { en } from '../../../src/i18n/en';
import { useAppStore } from '../../../src/store/useAppStore';
import { mockActiveTrip } from '../../../src/services/api/mock/data';

export default function RateCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTrip, setActiveTrip } = useAppStore();

  const trip = activeTrip || { ...mockActiveTrip, id: id || 'trip-202' };

  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');

  // Initial matching 22-Rate.png: Friendly and On time selected
  const [selectedTags, setSelectedTags] = useState<string[]>([
    en.rate.tags.friendly,
    en.rate.tags.onTime,
  ]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFinish = async () => {
    await setActiveTrip(null);
    router.replace('/(tabs)/home');
  };

  return (
    <ScreenBackground deco={true}>
      <Header showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topArea}>
            {/* Customer Avatar Circle */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {trip.customer.firstName[0].toUpperCase()}
              </Text>
            </View>

            <Text style={styles.customerName}>{trip.customer.firstName}</Text>
            <Text style={styles.subtitle}>{en.rate.title}</Text>

            {/* 5-star rating */}
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={36}
            />

            {/* Quick feedback chips */}
            <View style={styles.chipsContainer}>
              <View style={styles.chipsRow}>
                <Chip
                  label={en.rate.tags.friendly}
                  selected={selectedTags.includes(en.rate.tags.friendly)}
                  onPress={() => toggleTag(en.rate.tags.friendly)}
                />
                <Chip
                  label={en.rate.tags.onTime}
                  selected={selectedTags.includes(en.rate.tags.onTime)}
                  onPress={() => toggleTag(en.rate.tags.onTime)}
                />
                <Chip
                  label={en.rate.tags.respectful}
                  selected={selectedTags.includes(en.rate.tags.respectful)}
                  onPress={() => toggleTag(en.rate.tags.respectful)}
                />
              </View>

              <View style={styles.chipsRowCenter}>
                <Chip
                  label={en.rate.tags.clearInstructions}
                  selected={selectedTags.includes(en.rate.tags.clearInstructions)}
                  onPress={() => toggleTag(en.rate.tags.clearInstructions)}
                />
              </View>
            </View>

            {/* Comment field */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>{en.rate.commentLabel}</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={en.rate.commentPlaceholder}
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={colors.darkTeal}
                accessibilityLabel="Rating comment"
              />
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <Button
              title={en.rate.submit}
              variant="amber"
              onPress={handleFinish}
              accessibilityLabel="Submit rating"
            />
            <Button
              title={en.rate.skip}
              variant="text"
              onPress={handleFinish}
              accessibilityLabel="Skip rating"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#8EB5BA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  customerName: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '800',
    color: colors.darkTeal,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.mutedText,
    marginTop: 4,
    marginBottom: 12,
  },
  chipsContainer: {
    width: '100%',
    marginVertical: 14,
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipsRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  commentSection: {
    width: '100%',
    marginTop: 12,
  },
  commentLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '700',
    color: colors.darkTeal,
    marginBottom: 8,
  },
  commentInput: {
    height: 100,
    borderRadius: shape.fieldRadius,
    borderWidth: 2,
    borderColor: colors.darkTeal,
    backgroundColor: colors.white,
    padding: 14,
    fontSize: typography.fontSize.body,
    color: colors.ink,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
  },
});
