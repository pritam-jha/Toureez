/**
 * @file app/(vendor)/packages/[id]/images.tsx
 * @description Package gallery image manager.
 *
 * Displays all uploaded images in a grid. Vendors can:
 *  - Upload new images via Cloudinary (up to maxPackageImages limit)
 *  - Set any image as the cover photo
 *  - Delete images from the gallery
 *
 * The cover image is shown with a star overlay.
 */

import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  useVendorPackage,
  useSavePackageImage,
  useDeletePackageImage,
  useSetPackageCoverImage,
} from '../../../../hooks/useVendorPackages';
import { pickAndUploadImage } from '../../../../lib/cloudinary';
import { Header } from '../../../../components/ui/Header';
import { InlineLoader } from '../../../../components/ui/LoadingSpinner';
import { Colors } from '../../../../constants/colors';
import { Shadows } from '../../../../constants/shadows';
import { Config } from '../../../../constants/config';
import type { VendorPackageImage } from '../../../../types';

// ── Image tile ────────────────────────────────────────────────────────────────

interface ImageTileProps {
  image: VendorPackageImage;
  onSetCover: () => void;
  onDelete: () => void;
  isSettingCover: boolean;
  isDeleting: boolean;
}

function ImageTile({ image, onSetCover, onDelete, isSettingCover, isDeleting }: ImageTileProps): React.ReactElement {
  return (
    <View style={[tileStyles.tile, Shadows.sm]}>
      <Image source={{ uri: image.url }} style={tileStyles.image} resizeMode="cover" />

      {/* Cover badge */}
      {image.is_cover && (
        <View style={tileStyles.coverBadge}>
          <Ionicons name="star" size={10} color={Colors.textWhite} />
          <Text style={tileStyles.coverText}>Cover</Text>
        </View>
      )}

      {/* Action overlay */}
      <View style={tileStyles.overlay}>
        {!image.is_cover && (
          <Pressable
            style={tileStyles.actionBtn}
            onPress={onSetCover}
            disabled={isSettingCover || isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Set as cover photo"
          >
            <Ionicons
              name={isSettingCover ? 'hourglass-outline' : 'star-outline'}
              size={16}
              color={Colors.textWhite}
            />
          </Pressable>
        )}
        <Pressable
          style={[tileStyles.actionBtn, tileStyles.deleteBtn]}
          onPress={onDelete}
          disabled={isSettingCover || isDeleting}
          accessibilityRole="button"
          accessibilityLabel="Delete image"
        >
          <Ionicons
            name={isDeleting ? 'hourglass-outline' : 'trash-outline'}
            size={16}
            color={Colors.textWhite}
          />
        </Pressable>
      </View>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
});

// ── Add image tile ────────────────────────────────────────────────────────────

interface AddTileProps {
  onPress: () => void;
  isUploading: boolean;
  disabled: boolean;
}

function AddTile({ onPress, isUploading, disabled }: AddTileProps): React.ReactElement {
  return (
    <Pressable
      style={[tileStyles.tile, addStyles.tile, disabled && addStyles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Upload new image"
    >
      <Ionicons
        name={isUploading ? 'cloud-upload-outline' : 'camera-outline'}
        size={28}
        color={disabled ? Colors.textLight : Colors.primary}
      />
      <Text style={[addStyles.label, disabled && addStyles.labelDisabled]}>
        {isUploading ? 'Uploading…' : 'Add Photo'}
      </Text>
    </Pressable>
  );
}

const addStyles = StyleSheet.create({
  tile: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSoft,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  labelDisabled: {
    color: Colors.textLight,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ImagesScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pkg, isLoading } = useVendorPackage(id ?? '');
  const saveImage = useSavePackageImage();
  const deleteImage = useDeletePackageImage();
  const setCoverImage = useSetPackageCoverImage();

  const [uploading, setUploading] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const images = pkg?.images ?? [];
  const atLimit = images.length >= Config.maxPackageImages;

  const handleUpload = async (): Promise<void> => {
    if (atLimit) {
      Alert.alert('Limit Reached', `You can upload a maximum of ${Config.maxPackageImages} images per package.`);
      return;
    }
    setUploading(true);
    try {
      const result = await pickAndUploadImage();
      if (result !== null) {
        await saveImage.mutateAsync({
          packageId: id ?? '',
          url: result.secure_url,
          public_id: result.public_id,
          is_cover: images.length === 0, // auto-cover for first image
        });
      }
    } catch {
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = (imageId: string): void => {
    setActiveImageId(imageId);
    void setCoverImage.mutateAsync({ packageId: id ?? '', imageId })
      .catch(() => Alert.alert('Failed', 'Could not set cover image.'))
      .finally(() => setActiveImageId(null));
  };

  const handleDelete = (image: VendorPackageImage): void => {
    Alert.alert(
      'Delete Image',
      image.is_cover
        ? 'This is your cover photo. If deleted, the next image will become the cover.'
        : 'Delete this image from the gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setActiveImageId(image.id);
            void deleteImage.mutateAsync({ packageId: id ?? '', imageId: image.id })
              .catch(() => Alert.alert('Failed', 'Could not delete image.'))
              .finally(() => setActiveImageId(null));
          },
        },
      ],
    );
  };

  if (isLoading || pkg == null) {
    return (
      <View style={styles.flex}>
        <Header title="Gallery Images" showBack />
        <InlineLoader message="Loading images…" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Header
        title={`Gallery (${images.length}/${Config.maxPackageImages})`}
        showBack
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Gallery Tips</Text>
          <Text style={styles.tipsBody}>
            • Add clear, high-quality photos of destinations and activities.{'\n'}
            • Set your best photo as the cover — it appears in search results.{'\n'}
            • Include images of accommodation, food, and group activities.
          </Text>
        </View>

        {/* Image grid */}
        <View style={styles.grid}>
          {images.map((image) => (
            <ImageTile
              key={image.id}
              image={image}
              onSetCover={() => handleSetCover(image.id)}
              onDelete={() => handleDelete(image)}
              isSettingCover={activeImageId === image.id && setCoverImage.isPending}
              isDeleting={activeImageId === image.id && deleteImage.isPending}
            />
          ))}
          {!atLimit && (
            <AddTile
              onPress={() => void handleUpload()}
              isUploading={uploading}
              disabled={uploading}
            />
          )}
        </View>

        {atLimit && (
          <View style={styles.limitBanner}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.limitText}>
              Maximum of {Config.maxPackageImages} images reached. Delete an image to add more.
            </Text>
          </View>
        )}

        {images.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyBody}>
              Add photos to make your package more attractive to travelers.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  tipsCard: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  tipsBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 10,
    padding: 12,
  },
  limitText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
