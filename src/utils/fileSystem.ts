/**
 * Simplified file system utilities that won't cause browser compatibility issues
 */

// Define the interface for our file system utilities
interface FileSystem {
  readFile: (filePath: string) => Promise<string>;
  listFiles: (directory: string) => Promise<string[]>;
}

// Simple utility to fetch text content
export const readFile = async (filePath: string): Promise<string> => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to read file ${filePath}`);
    }
    return response.text();
  } catch (error) {
    console.error('Error reading file:', error);
    return '';
  }
};

// Simple utility to list files (returns predefined lists for specific directories)
export const listFiles = async (directory: string): Promise<string[]> => {
  console.log(`Listing files in ${directory} (static implementation)`);
  
  // For the gallery directory, return default image paths
  if (directory.includes('gallery')) {
    return [
      '/images/gallery/cultural-workshop.jpg',
      '/images/gallery/beach-activities.jpg',
      '/images/gallery/storytelling-circle.jpg',
      '/images/gallery/art-session.jpg',
      '/images/gallery/bush-tucker.jpg',
      '/images/gallery/dance-performance.jpg',
      '/images/gallery/weaving-workshop.jpg',
      '/images/gallery/group-discussion.jpg',
      '/images/gallery/beach-cleanup.jpg',
      '/images/gallery/painting-session.jpg',
      '/images/gallery/elder-teaching.jpg',
      '/images/gallery/community-gathering.jpg',
      '/images/gallery/cultural-ceremony.jpg',
      '/images/gallery/traditional-fishing.jpg',
      '/images/gallery/cultural-exchange.jpg'
    ];
  }
  
  // For transcripts directory
  if (directory.includes('transcripts')) {
    return [
      '/transcripts/main-documentary.md',
      '/transcripts/elder-wisdom.md',
      '/transcripts/connection-to-country.md',
      '/transcripts/traditional-knowledge.md',
      '/transcripts/youth-perspectives.md',
      '/transcripts/community-healing.md'
    ];
  }
  
  // Default empty list for other directories
  return [];
};

// Export a static file system object
const fileSystem: FileSystem = {
  readFile,
  listFiles
};

export default fileSystem; 