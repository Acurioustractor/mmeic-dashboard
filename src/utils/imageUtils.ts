// Image orientation and sizing utilities

export type Orientation = 'landscape' | 'portrait' | 'square';
export type Size = 'small' | 'medium' | 'large';

/**
 * Get image dimensions and determine orientation
 * @param imageUrl URL of the image
 * @returns Promise with dimensions and orientation
 */
export const getImageDimensions = (imageUrl: string): Promise<{
  width: number;
  height: number;
  orientation: Orientation;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      let orientation: Orientation = 'landscape';
      
      // Determine orientation
      if (width > height) {
        orientation = 'landscape';
      } else if (height > width) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }
      
      resolve({ width, height, orientation });
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Determine the size classification based on the image dimensions
 * @param width Image width
 * @param height Image height
 * @param orientation Image orientation
 * @returns Size classification (small, medium, large)
 */
export const determineSize = (
  width: number, 
  height: number, 
  orientation: Orientation
): Size => {
  // Calculate the area of the image
  const area = width * height;
  
  // Size thresholds (can be adjusted)
  const SMALL_THRESHOLD = 250000;  // e.g., 500×500
  const LARGE_THRESHOLD = 800000;  // e.g., 800×1000
  
  if (area < SMALL_THRESHOLD) {
    return 'small';
  } else if (area > LARGE_THRESHOLD) {
    return 'large';
  } else {
    return 'medium';
  }
};

/**
 * Determine if a file is an image based on its extension
 * @param filename Filename to check
 * @returns Boolean indicating if the file is an image
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const lowerCaseFilename = filename.toLowerCase();
  return imageExtensions.some(ext => lowerCaseFilename.endsWith(ext));
};

// Create an object with the utility functions
const imageUtils = {
  getImageDimensions,
  determineSize,
  isImageFile
};

export default imageUtils; 