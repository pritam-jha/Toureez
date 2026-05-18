/**
 * @file components/package/CompanySection.tsx
 * @description Operator info card: logo, name, verified badge, rating,
 * expandable about text, and "View All Packages" link.
 */

import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';
import type { PackageDetail } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const ABOUT_COLLAPSED_LINES = 3;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CompanySectionProps {
  company: PackageDetail['company'];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CompanySection({
  company,
}: CompanySectionProps): React.ReactElement {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

  const handleTextLayout = useCallback(
    (e: { nativeEvent: { lines: unknown[] } }) => {
      if (!aboutExpanded && e.nativeEvent.lines.length > ABOUT_COLLAPSED_LINES) {
        setShowReadMore(true);
      }
    },
    [aboutExpanded]
  );

  const handleViewAll = useCallback(() => {
    router.push({
      pathname: '/(tabs)/search',
      params: { company: company.id },
    });
  }, [company.id]);

  const fullStars = Math.floor(company.avg_rating);
  const hasHalf = company.avg_rating - fullStars >= 0.5;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        About the Operator
      </Text>

      {/* Company card */}
      <View style={styles.card}>
        {/* Logo + name row */}
        <View style={styles.topRow}>
          {company.logo_url ? (
            <Image
              source={{ uri: company.logo_url }}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel={`${company.name} logo`}
            />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="business-outline" size={24} color={Colors.muted} />
            </View>
          )}

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.companyName} numberOfLines={1}>
                {company.name}
              </Text>
              {company.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.secondary}
                  />
                  <Text style={styles.verifiedText} numberOfLines={1}>
                    Verified
                  </Text>
                </View>
              )}
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }, (_, i) => {
                const filled = i < fullStars;
                const half = !filled && i === fullStars && hasHalf;
                return (
                  <Ionicons
                    key={i}
                    name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
                    size={13}
                    color={Colors.star}
                  />
                );
              })}
              <Text style={styles.ratingScore} numberOfLines={1}>
                {company.avg_rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount} numberOfLines={1}>
                ({company.total_reviews.toLocaleString('en-IN')} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* About text */}
        {company.slug ? (
          <View style={styles.aboutBlock}>
            <Text
              style={styles.aboutText}
              numberOfLines={aboutExpanded ? undefined : ABOUT_COLLAPSED_LINES}
              onTextLayout={handleTextLayout}
            >
              Trusted travel operator offering curated packages across India.
            </Text>
            {showReadMore && (
              <Pressable
                onPress={() => setAboutExpanded((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={aboutExpanded ? 'Show less' : 'Read more'}
                hitSlop={8}
              >
                <Text style={styles.readMoreText} numberOfLines={1}>
                  {aboutExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* View all packages */}
        <Pressable
          style={styles.viewAllButton}
          onPress={handleViewAll}
          accessibilityRole="button"
          accessibilityLabel={`View all packages by ${company.name}`}
        >
          <Text style={styles.viewAllText} numberOfLines={1}>
            View All Packages by {company.name}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={Colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 14,
  },
  logo: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 56,
    marginRight: 14,
    width: 56,
  },
  logoFallback: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginRight: 14,
    width: 56,
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  companyName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginRight: 8,
  },
  verifiedBadge: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  verifiedText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginLeft: 3,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ratingScore: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginLeft: 5,
  },
  reviewCount: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 3,
  },
  aboutBlock: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    padding: 14,
  },
  aboutText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 6,
  },
  viewAllButton: {
    alignItems: 'center',
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  viewAllText: {
    color: Colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginRight: 8,
  },
});
