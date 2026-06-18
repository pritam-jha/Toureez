/**
 * @file app/review/[bookingId].tsx
 * @description Write Review screen — Step 1 of the review flow.
 *
 * Layout:
 *   - Custom header with back button + "Write a Review" title
 *   - Package mini-card (cover image, title, company, travel date, VerifiedBadge)
 *   - 5 RatingCategory rows (guide, hotel, food, transport, value)
 *   - Auto-computed overall rating display (read-only large stars)
 *   - Optional title input (max 100 chars)
 *   - Optional body textarea (max 1000 chars) with character counter
 *   - Submit button (disabled until ≥1 rating, loading state)
 *
 * Guards:
 *   - Redirects to /(tabs)/bookings if bookingId is missing
 *   - Shows error toast on submission failure
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RatingCategory } from '../../components/reviews/RatingCategory';
import { StarRating } from '../../components/reviews/StarRating';
import { VerifiedBadge } from '../../components/reviews/VerifiedBadge';
import { Toast } from '../../components/ui/Toast';
import { Colors } from '../../constants/colors';
import { uploadImage } from '../../lib/cloudinary';
import {
  computeOverallRating,
  hasAtLeastOneRating,
  useSubmitReview,
} from '../../hooks/useReviews';
import { useBookingDetail } from '../../hooks/useBookings';
import type { ReviewImage } from '../../types';

const MAX_REVIEW_IMAGES = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

interface RatingsState {
  guide: number;
  hotel: number;
  food: number;
  transport: number;
  value: number;
}

const INITIAL_RATINGS: RatingsState = {
  guide: 0,
  hotel: 0,
  food: 0,
  transport: 0,
  value: 0,
};

const RATING_CATEGORIES: {
  key: keyof RatingsState;
  label: string;
  subtitle: string;
}[] = [
  {
    key: 'guide',
    label: 'Guide / Tour Manager',
    subtitle: 'Knowledge, friendliness, support',
  },
  {
    key: 'hotel',
    label: 'Hotel / Accommodation',
    subtitle: 'Cleanliness, comfort, location',
  },
  {
    key: 'food',
    label: 'Food & Meals',
    subtitle: 'Quality, variety, taste',
  },
  {
    key: 'transport',
    label: 'Transport',
    subtitle: 'Comfort, punctuality, cleanliness',
  },
  {
    key: 'value',
    label: 'Value for Money',
    subtitle: 'Worth the price paid?',
  },
];

// ── Package mini-card ─────────────────────────────────────────────────────────

interface PackageMiniCardProps {
  title: string;
  companyName: string;
  coverImage: string | null;
  travelDate: string;
}

function PackageMiniCard({
  title,
  companyName,
  coverImage,
  travelDate,
}: PackageMiniCardProps): React.ReactElement {
  const formattedDate = useMemo(() => {
    try {
      return new Date(travelDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return travelDate;
    }
  }, [travelDate]);

  return (
    <View style={cardStyles.card}>
      {coverImage ? (
        <Image
          source={{ uri: coverImage }}
          style={cardStyles.image}
          resizeMode="cover"
          accessibilityLabel={`Cover image for ${title}`}
        />
      ) : (
        <View style={[cardStyles.image, cardStyles.imageFallback]}>
          <Ionicons name="image-outline" size={24} color={Colors.textTertiary} />
        </View>
      )}
      <View style={cardStyles.info}>
        <Text style={cardStyles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={cardStyles.company} numberOfLines={1}>
          {companyName}
        </Text>
        <View style={cardStyles.dateRow}>
          <Ionicons
            name="calendar-outline"
            size={13}
            color={Colors.textSecondary}
          />
          <Text style={cardStyles.date} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>
        <VerifiedBadge is_verified />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    padding: 12,
  },
  image: {
    borderRadius: 8,
    height: 80,
    width: 80,
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  company: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  date: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});

// ── Overall rating display ────────────────────────────────────────────────────

interface OverallRatingDisplayProps {
  rating: number;
}

function OverallRatingDisplay({
  rating,
}: OverallRatingDisplayProps): React.ReactElement {
  return (
    <View style={overallStyles.container}>
      <Text style={overallStyles.label} numberOfLines={1}>
        Your overall rating
      </Text>
      <View style={overallStyles.row}>
        <Text style={overallStyles.number} numberOfLines={1}>
          {rating > 0 ? rating.toFixed(1) : '—'}
        </Text>
        <StarRating
          rating={rating}
          size="large"
          interactive={false}
          accessibilityLabel={`Overall rating: ${rating.toFixed(1)} out of 5`}
        />
      </View>
      {rating === 0 ? (
        <Text style={overallStyles.hint} numberOfLines={1}>
          Rate at least one category above
        </Text>
      ) : null}
    </View>
  );
}

const overallStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  number: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 8,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WriteReviewScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  const rawBookingId = params.bookingId;
  const id =
    typeof rawBookingId === 'string'
      ? rawBookingId
      : Array.isArray(rawBookingId)
      ? rawBookingId[0] ?? ''
      : '';

  const { data: booking, isLoading: bookingLoading } = useBookingDetail(id);
  const submitMutation = useSubmitReview();

  const [ratings, setRatings] = useState<RatingsState>(INITIAL_RATINGS);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({ visible: false, message: '', type: 'error' });

  const bodyInputRef = useRef<TextInput>(null);

  // Guard: redirect if no bookingId
  useEffect(() => {
    if (!id) {
      router.replace('/(tabs)/bookings' as never);
    }
  }, [id]);

  // Show error toast on mutation failure
  useEffect(() => {
    if (submitMutation.error) {
      setToast({
        visible: true,
        message: submitMutation.error.message,
        type: 'error',
      });
    }
  }, [submitMutation.error]);

  const overallRating = useMemo(
    () =>
      computeOverallRating({
        rating_guide: ratings.guide || undefined,
        rating_hotel: ratings.hotel || undefined,
        rating_food: ratings.food || undefined,
        rating_transport: ratings.transport || undefined,
        rating_value: ratings.value || undefined,
      }),
    [ratings]
  );

  const canSubmit = useMemo(
    () =>
      hasAtLeastOneRating({
        rating_guide: ratings.guide || undefined,
        rating_hotel: ratings.hotel || undefined,
        rating_food: ratings.food || undefined,
        rating_transport: ratings.transport || undefined,
        rating_value: ratings.value || undefined,
      }) && !submitMutation.isPending,
    [ratings, submitMutation.isPending]
  );

  const handleRate = useCallback(
    (key: keyof RatingsState) => (value: number) => {
      setRatings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAddPhoto = useCallback(async () => {
    if (images.length >= MAX_REVIEW_IMAGES || isUploadingImage) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      setToast({
        visible: true,
        message: 'Photo library access is required to add photos. Please enable it in Settings.',
        type: 'error',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (!asset?.uri) return;

    setIsUploadingImage(true);
    const { data, error } = await uploadImage(asset.uri, 'reviews');
    setIsUploadingImage(false);

    if (error || !data) {
      setToast({
        visible: true,
        message: error ?? 'Failed to upload photo. Please try again.',
        type: 'error',
      });
      return;
    }

    setImages((prev) => [...prev, { url: data.secure_url, public_id: data.public_id }]);
  }, [images.length, isUploadingImage]);

  const handleRemovePhoto = useCallback((publicId: string) => {
    setImages((prev) => prev.filter((img) => img.public_id !== publicId));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!booking || !canSubmit) return;

    submitMutation.mutate({
      booking_id: booking.id,
      package_id: booking.package_id,
      rating_guide: ratings.guide || undefined,
      rating_hotel: ratings.hotel || undefined,
      rating_food: ratings.food || undefined,
      rating_transport: ratings.transport || undefined,
      rating_value: ratings.value || undefined,
      title: reviewTitle.trim() || undefined,
      body: reviewBody.trim() || undefined,
      images: images.length > 0 ? images : undefined,
    });
  }, [booking, canSubmit, ratings, reviewTitle, reviewBody, images, submitMutation]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings' as never);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (bookingLoading || !booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading booking details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const packageTitle = booking.package?.title ?? 'Your Package';
  const companyName = booking.company?.name ?? '';
  const coverImage = booking.package?.cover_image ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Write a Review
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Package mini-card */}
          <PackageMiniCard
            title={packageTitle}
            companyName={companyName}
            coverImage={coverImage}
            travelDate={booking.travel_date}
          />

          {/* Rating categories */}
          <Text style={styles.sectionLabel}>Rate Your Experience</Text>
          <View style={styles.categoriesCard}>
            {RATING_CATEGORIES.map((cat) => (
              <RatingCategory
                key={cat.key}
                label={cat.label}
                subtitle={cat.subtitle}
                rating={ratings[cat.key]}
                onRate={handleRate(cat.key)}
                optional={ratings[cat.key] === 0}
              />
            ))}
          </View>

          {/* Overall rating */}
          <OverallRatingDisplay rating={overallRating} />

          {/* Review title */}
          <Text style={styles.sectionLabel}>Review Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Summarise your experience (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={reviewTitle}
            onChangeText={setReviewTitle}
            maxLength={100}
            returnKeyType="next"
            onSubmitEditing={() => bodyInputRef.current?.focus()}
            accessibilityLabel="Review title"
          />

          {/* Review body */}
          <View style={styles.bodyLabelRow}>
            <Text style={styles.sectionLabel}>Your Review</Text>
            <Text style={styles.charCounter} numberOfLines={1}>
              {reviewBody.length}/1000
            </Text>
          </View>
          <TextInput
            ref={bodyInputRef}
            style={styles.bodyInput}
            placeholder="Tell others about your trip (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={reviewBody}
            onChangeText={setReviewBody}
            maxLength={1000}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Review body"
          />

          {/* Photos */}
          <View style={styles.bodyLabelRow}>
            <Text style={styles.sectionLabel}>Add Photos</Text>
            <Text style={styles.charCounter} numberOfLines={1}>
              {images.length}/{MAX_REVIEW_IMAGES}
            </Text>
          </View>
          <View style={styles.photoRow}>
            {images.map((img) => (
              <View key={img.public_id} style={styles.photoThumbWrap}>
                <Image source={{ uri: img.url }} style={styles.photoThumb} />
                <Pressable
                  style={styles.photoRemoveButton}
                  onPress={() => handleRemovePhoto(img.public_id)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={14} color={Colors.white} />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_REVIEW_IMAGES ? (
              <Pressable
                style={styles.photoAddButton}
                onPress={handleAddPhoto}
                disabled={isUploadingImage}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
                )}
              </Pressable>
            ) : null}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit ? styles.submitButtonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Submit review"
            accessibilityState={{ disabled: !canSubmit }}
          >
            {submitMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.submitButtonText}>Submitting…</Text>
              </>
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color={Colors.white} />
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  sectionLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginBottom: 10,
  },
  categoriesCard: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  titleInput: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bodyLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  charCounter: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  bodyInput: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    height: 140,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  photoThumbWrap: {
    height: 72,
    width: 72,
  },
  photoThumb: {
    borderRadius: 10,
    height: 72,
    width: 72,
  },
  photoRemoveButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 20,
  },
  photoAddButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 32 : 24,
  },
});
