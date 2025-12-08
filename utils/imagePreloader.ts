// Image preloader utility for faster avatar and cover loading
import coverImage from '../assets/Cover.webp';
import { AVATARS_MALE, AVATARS_FEMALE } from '../constants';

// Preload a single image
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload all critical images
export const preloadAllImages = async (): Promise<void> => {
  const allImages = [
    coverImage,
    ...AVATARS_MALE,
    ...AVATARS_FEMALE
  ];

  // Preload in parallel
  await Promise.allSettled(allImages.map(preloadImage));
};

// Preload cover only (for splash screen)
export const preloadCover = (): Promise<void> => {
  return preloadImage(coverImage);
};

// Preload avatars by gender
export const preloadAvatarsByGender = async (isFemale: boolean): Promise<void> => {
  const avatars = isFemale ? AVATARS_FEMALE : AVATARS_MALE;
  await Promise.allSettled(avatars.map(preloadImage));
};

// Check if image is cached (already loaded)
export const isImageCached = (src: string): boolean => {
  const img = new Image();
  img.src = src;
  return img.complete;
};
