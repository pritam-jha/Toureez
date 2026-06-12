/**
 * @file app/booking/detail/[id].tsx
 * @description Authenticated booking detail and cancellation screen.
 */

import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { BookingDetailHeader } from '../../../components/bookings/BookingDetailHeader';
import { BookingStatusBadge } from '../../../components/bookings/BookingStatusBadge';
import { BookingTimeline } from '../../../components/bookings/BookingTimeline';
import { CancellationCard } from '../../../components/bookings/CancellationCard';
import { PaymentDetailsCard } from '../../../components/bookings/PaymentDetailsCard';
import { TravelerDetailsCard } from '../../../components/bookings/TravelerDetailsCard';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Toast } from '../../../components/ui/Toast';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { useBookingDetail, useCancelBooking, useDownloadInvoice } from '../../../hooks/useBookings';
import { useReviewEligibility } from '../../../hooks/useReviews';
import { formatINR } from '../../../utils/currency';
import type { Booking } from '../../../types';

function formatDate(value: string, dateOnly = false): string {
  const date = dateOnly
    ? new Date(`${value.slice(0, 10)}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

interface DetailRowProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

function DetailRow({
  label,
  value,
  icon,
}: DetailRowProps): React.ReactElement {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={styles.detailRowCopy}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={styles.detailRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function PackageCard({ booking }: { booking: Booking }): React.ReactElement {
  const pkg = booking.package;
  const company = booking.company;

  const openPackage = useCallback(() => {
    router.push({
      pathname: '/package/[id]' as never,
      params: { id: booking.package_id },
    });
  }, [booking.package_id]);

  return (
    <View style={styles.packageCard}>
      {pkg?.cover_image ? (
        <Image
          source={{ uri: pkg.cover_image }}
          style={styles.packageImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.packageImageFallback}>
          <Ionicons name="image-outline" size={34} color={Colors.textTertiary} />
        </View>
      )}

      <View style={styles.packageBody}>
        <Text style={styles.packageTitle} numberOfLines={3}>
          {pkg?.title ?? 'Travel package'}
        </Text>

        <View style={styles.companyRow}>
          <Text style={styles.companyName} numberOfLines={1}>
            {company?.name ?? 'Travel partner'}
          </Text>
          {company?.is_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.info} />
              <Text style={styles.verifiedLabel}>Verified</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.packageMeta}>
          <View style={styles.packageMetaItem}>
            <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.packageMetaText} numberOfLines={2}>
              {pkg
                ? `${pkg.location.city}, ${pkg.location.state}`
                : 'Location unavailable'}
            </Text>
          </View>
          <View style={styles.packageMetaItem}>
            <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.packageMetaText} numberOfLines={1}>
              {pkg
                ? `${pkg.duration_days} days / ${pkg.duration_nights} nights`
                : 'Duration unavailable'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openPackage}
          style={({ pressed }) => [
            styles.packageLink,
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="link"
          accessibilityLabel="View package"
        >
          <Text style={styles.packageLinkText}>View Package</Text>
          <Ionicons name="arrow-forward" size={15} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function TravelInfoCard({ booking }: { booking: Booking }): React.ReactElement {
  return (
    <View style={styles.travelCard}>
      <Text style={styles.sectionTitle}>Travel Info</Text>
      <DetailRow
        label="Travel date"
        value={formatDate(booking.travel_date, true)}
        icon="calendar-outline"
      />
      <DetailRow
        label="Booking date"
        value={formatDate(booking.created_at)}
        icon="receipt-outline"
      />
      <DetailRow
        label="Travelers"
        value={`${booking.num_travelers}`}
        icon="people-outline"
      />
      {booking.special_requests ? (
        <DetailRow
          label="Special requests"
          value={booking.special_requests}
          icon="chatbubble-ellipses-outline"
        />
      ) : null}
    </View>
  );
}

// ── Write Review Section ──────────────────────────────────────────────────────

/**
 * Shown on completed bookings. Uses useReviewEligibility to determine whether
 * the user can still write a review (hides if already reviewed).
 */
function WriteReviewSection({
  booking,
}: {
  booking: Booking;
}): React.ReactElement | null {
  const { data: eligibility, isLoading } = useReviewEligibility(
    booking.package_id
  );

  const handleWriteReview = useCallback(() => {
    if (eligibility?.booking_id) {
      router.push(`/review/${eligibility.booking_id}` as never);
    }
  }, [eligibility]);

  // Only show for completed bookings
  if (booking.status !== 'completed') return null;

  // Don't flash the button while eligibility is loading
  if (isLoading) return null;

  // Already reviewed — hide the CTA
  if (!eligibility?.can_review) return null;

  return (
    <View style={reviewStyles.card}>
      <View style={reviewStyles.headerRow}>
        <View style={reviewStyles.iconWrap}>
          <Ionicons name="star-outline" size={18} color={Colors.primary} />
        </View>
        <View style={reviewStyles.textWrap}>
          <Text style={reviewStyles.title}>How was your trip?</Text>
          <Text style={reviewStyles.subtitle}>
            Share your experience to help other travelers
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleWriteReview}
        style={({ pressed }) => [
          reviewStyles.button,
          pressed ? reviewStyles.buttonPressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Write a review for this booking"
      >
        <Ionicons name="create-outline" size={17} color={Colors.white} />
        <Text style={reviewStyles.buttonText}>Write a Review</Text>
      </Pressable>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.primary + '30',
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    padding: 16,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
});

// ── Pay Balance card ──────────────────────────────────────────────────────────

/**
 * Shown on confirmed bookings with an outstanding balance. Links to the
 * pay-balance screen to settle the remaining amount via Razorpay.
 */
function PayBalanceCard({ booking }: { booking: Booking }): React.ReactElement | null {
  if (
    booking.payment_status === 'paid' ||
    booking.balance_amount <= 0 ||
    booking.status !== 'confirmed'
  ) {
    return null;
  }

  const handlePayBalance = (): void => {
    router.push(`/booking/pay-balance/${booking.id}` as never);
  };

  return (
    <View style={payBalanceStyles.card}>
      <View style={payBalanceStyles.headerRow}>
        <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
        <Text style={payBalanceStyles.title}>Balance Due</Text>
        <Text style={payBalanceStyles.amount}>{formatINR(booking.balance_amount)}</Text>
      </View>
      <Text style={payBalanceStyles.subtext}>
        Due before {formatDate(booking.travel_date, true)}
      </Text>
      <Pressable
        onPress={handlePayBalance}
        style={({ pressed }) => [
          payBalanceStyles.button,
          pressed ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Pay outstanding balance"
      >
        <Text style={payBalanceStyles.buttonText}>Pay Balance Now</Text>
      </Pressable>
    </View>
  );
}

const payBalanceStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent + '60',
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  amount: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 10,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
});

// ── Loading / auth states ─────────────────────────────────────────────────────

function LoadingState(): React.ReactElement {
  return (
    <View style={styles.centerState}>
      <LoadingSpinner />
      <Text style={styles.stateTitle}>Loading booking details</Text>
    </View>
  );
}

function AuthState(): React.ReactElement {
  const login = useCallback(() => {
    router.replace('/(auth)/login' as never);
  }, []);

  return (
    <View style={styles.centerState}>
      <View style={styles.stateIcon}>
        <Ionicons name="lock-closed-outline" size={30} color={Colors.primary} />
      </View>
      <Text style={styles.stateTitle}>Login to view this booking</Text>
      <Button label="Login" onPress={login} style={styles.stateButton} />
    </View>
  );
}

export default function BookingDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const bookingQuery = useBookingDetail(id);
  const cancelBooking = useCancelBooking();
  const { downloadInvoice, isDownloading, error: invoiceError } = useDownloadInvoice();
  const booking = bookingQuery.data;

  const goBack = useCallback(() => {
    router.back();
  }, []);

  const handleShare = useCallback(async () => {
    if (!booking) return;

    try {
      await Share.share({
        title: 'My NEXTTRP Booking',
        message:
          `Booking ${booking.booking_reference}\n` +
          `Travel date: ${formatDate(booking.travel_date, true)}\n` +
          `Travelers: ${booking.num_travelers}\n` +
          `Amount: ${formatINR(booking.total_amount)}`,
      });
    } catch {
      // Share dismissal does not need a blocking UI error.
    }
  }, [booking]);

  const handleCancelBooking = useCallback(() => {
    if (booking) cancelBooking.mutate(booking.id);
  }, [booking, cancelBooking]);

  const handleRetry = useCallback(() => {
    void bookingQuery.refetch();
  }, [bookingQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <BookingDetailHeader
        bookingReference={booking?.booking_reference ?? 'Booking Detail'}
        onBack={goBack}
        onShare={() => void handleShare()}
      />

      {!authLoading && !user ? (
        <AuthState />
      ) : bookingQuery.isLoading || authLoading ? (
        <LoadingState />
      ) : bookingQuery.isError || !booking ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons name="alert-circle-outline" size={30} color={Colors.error} />
          </View>
          <Text style={styles.stateTitle}>Booking details could not be loaded</Text>
          <Text style={styles.stateCopy}>{bookingQuery.error?.message}</Text>
          <Button label="Retry" variant="outline" onPress={handleRetry} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <BookingStatusBadge
              status={booking.status}
              size="large"
              style={styles.statusBadge}
            />

            <PackageCard booking={booking} />
            <TravelInfoCard booking={booking} />
            <TravelerDetailsCard travelers={booking.traveler_details} />
            <PaymentDetailsCard booking={booking} />

            {(booking.status === 'completed' ||
              (booking.payment_status === 'paid' && booking.balance_amount <= 0)) && (
              <Pressable
                style={[styles.invoiceButton, isDownloading && styles.invoiceButtonDisabled]}
                onPress={() => void downloadInvoice(booking.id, booking.booking_reference)}
                disabled={isDownloading}
              >
                <Ionicons
                  name={isDownloading ? 'hourglass-outline' : 'document-text-outline'}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.invoiceButtonText}>
                  {isDownloading ? 'Generating Invoice…' : 'Download GST Invoice'}
                </Text>
                {!isDownloading && (
                  <Ionicons name="download-outline" size={16} color={Colors.primary} />
                )}
              </Pressable>
            )}

            {invoiceError !== null && (
              <Text style={styles.invoiceError}>{invoiceError}</Text>
            )}

            <PayBalanceCard booking={booking} />
            <BookingTimeline booking={booking} />
            <WriteReviewSection booking={booking} />
            <CancellationCard
              booking={booking}
              isCancelling={cancelBooking.isPending}
              errorMessage={cancelBooking.error?.message}
              onCancelBooking={handleCancelBooking}
            />
          </ScrollView>

          <Toast
            visible={cancelBooking.toast.visible}
            message={cancelBooking.toast.message}
            type="success"
            onHide={cancelBooking.hideToast}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  statusBadge: {
    marginBottom: 14,
  },
  packageCard: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  packageImage: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  packageImageFallback: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surfaceBorder,
    justifyContent: 'center',
    width: '100%',
  },
  packageBody: {
    padding: 16,
  },
  packageTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    marginBottom: 8,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  companyName: {
    color: Colors.textSecondary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginRight: 8,
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedLabel: {
    color: Colors.info,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    marginLeft: 4,
  },
  packageMeta: {
    marginBottom: 14,
  },
  packageMetaItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 6,
  },
  packageMetaText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 7,
  },
  packageLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  packageLinkText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    marginRight: 6,
  },
  travelCard: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 14,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailRowIcon: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    marginRight: 10,
    width: 32,
  },
  detailRowCopy: {
    flex: 1,
    minHeight: 32,
  },
  detailRowLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  detailRowValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 1,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginBottom: 14,
    width: 64,
  },
  stateTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  stateCopy: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 18,
    marginTop: 7,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: 18,
    minWidth: 160,
  },
  pressed: {
    opacity: 0.78,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: Colors.primaryUltraLight,
  },
  invoiceButtonDisabled: {
    opacity: 0.6,
  },
  invoiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  invoiceError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 14,
  },
});
