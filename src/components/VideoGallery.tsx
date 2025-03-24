import React, { useState, useEffect, useRef } from 'react';
import fileSystem from '../utils/fileSystem';
import TranscriptView from './TranscriptView';
import { getImageDimensions, determineSize, isImageFile } from '../utils/imageUtils';

interface StorytellerData {
  Name: string;
  Age: string;
  Gender: string;
  'Community Role': string;
  'Themes (from Media)': string;
  Quote: string;
  'Sentiment Score': string;
}

interface VideoItem {
  title: string;
  theme: string;
  embedCode: string;
  videoUrl: string;
  videoSrc: string;
  transcript: string;
  transcriptFile?: string;
  quote: string;
  storyteller: string;
  isMainVideo?: boolean;
}

interface PhotoItem {
  src: string;
  alt: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'landscape' | 'portrait' | 'square';
  isProcessed?: boolean;
}

const StoriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'photos'>('videos');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState<StorytellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Videos with embed codes
  const sampleVideos: VideoItem[] = [
    { 
      title: "Empowering the Next Generation: Breaking the Cycle of Injustice",
      theme: "Cultural Sovereignty & Justice", 
      embedCode: '<iframe src="https://share.descript.com/embed/pFmWjOo43aW" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/pFmWjOo43aW",
      videoSrc: "https://share.descript.com/embed/pFmWjOo43aW", 
      transcript: "This documentary explores how the MMEIC School Holiday Program empowers Indigenous youth by connecting them to culture, Country, and community.",
      transcriptFile: "main-documentary.md",
      quote: "Our school holiday programs are important just to teach our young people about who they are and what that means to be First Nations children.",
      storyteller: "Multiple Community Members, including Uncle Dale, Aunty Evie, Teagan, and Shaun Fisher",
      isMainVideo: true
    },
    { 
      title: "Cultural Connection and Self-Determination",
      theme: "Self-Determination & Cultural Practice", 
      embedCode: '<iframe src="https://share.descript.com/embed/wUA7cE0gV54" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/wUA7cE0gV54",
      videoSrc: "https://share.descript.com/embed/wUA7cE0gV54", 
      transcript: "Shaun Fisher discusses traditional food sources, cultural practices, and the importance of self-determination in reclaiming land and building strong foundations for the community.", 
      transcriptFile: "elder-wisdom.md",
      quote: "Self determination, to have stability and take back what was ours. We just repossessed the land. We just took it back and started building our houses, building our foundations strong so they didn't fall down and continue on that for the next generation.", 
      storyteller: "Shaun Fisher"
    },
    { 
      title: "Youth Engagement and Cultural Identity",
      theme: "Youth Programs & Cultural Identity", 
      embedCode: '<iframe src="https://share.descript.com/embed/Ce9ZU2BmNBt" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/Ce9ZU2BmNBt",
      videoSrc: "https://share.descript.com/embed/Ce9ZU2BmNBt", 
      transcript: "Alyssa Dawn Brewster shares her experience working with youth in the community, highlighting how the school holiday programs help young people develop cultural identity and lasting friendships.", 
      transcriptFile: "connection-to-country.md",
      quote: "It helps them to find themselves as a person, culturally, and have an amazing friendship that goes on for a lifetime.", 
      storyteller: "Alyssa Dawn Brewster"
    },
    { 
      title: "Holistic Justice and Knowledge Transmission",
      theme: "Holistic Justice & Community Connection", 
      embedCode: '<iframe src="https://share.descript.com/embed/3jMV1KgnDOf" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/3jMV1KgnDOf",
      videoSrc: "https://share.descript.com/embed/3jMV1KgnDOf", 
      transcript: "Tegan explains the community's holistic understanding of justice, emphasizing connections to Elders, land, and country. She highlights the importance of passing down stories, knowledge, and language to younger generations.", 
      transcriptFile: "traditional-knowledge.md",
      quote: "When we talk about justice as a community, we talk about justice holistically, and justice is not just about contact with the criminal justice system it's health justice, it's land justice, it's about our social and emotional wellbeing and our connection to place and our connection to community.", 
      storyteller: "Tegan"
    },
    { 
      title: "Breaking Cycles of Injustice",
      theme: "Cultural Pride & Healing Trauma", 
      embedCode: '<iframe src="https://share.descript.com/embed/73rWsbN6Yj6" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/73rWsbN6Yj6",
      videoSrc: "https://share.descript.com/embed/73rWsbN6Yj6", 
      transcript: "Uncle Dale discusses the importance of school holiday programs in teaching First Nations children about their identity and breaking cycles of injustice, systemic racism, and institutional discrimination.", 
      transcriptFile: "youth-perspectives.md",
      quote: "We need to start teaching our young people early about the importance of their self worth and self value so that we can hopefully encourage them to not encounter any institutions or systems that caused them detrimental or physical or emotional harm.", 
      storyteller: "Uncle Dale"
    },
    { 
      title: "Ancestral Connections and Cultural Traditions",
      theme: "Cultural Heritage & Ancestral Connection", 
      embedCode: '<iframe src="https://share.descript.com/embed/R7iQoZPRMZD" width="640" height="360" frameborder="0" allowfullscreen></iframe>',
      videoUrl: "https://share.descript.com/view/R7iQoZPRMZD",
      videoSrc: "https://share.descript.com/embed/R7iQoZPRMZD", 
      transcript: "Aunty Evie shares stories of her childhood, connecting the present to the past through memories of traditional camping grounds and the importance of honoring ancestors.", 
      transcriptFile: "community-healing.md",
      quote: "It's the way we were brought up as to our traditional way of looking and taking care of our old people even when they're gone. They're gone, but they're still there to look after us and we keep in touch with them all the time.", 
      storyteller: "Aunty Evie"
    }
  ];

  // Sample photos
  const samplePhotos: PhotoItem[] = [
    {
      src: "/images/gallery/cultural-workshop.jpg",
      alt: "Cultural Workshop",
      caption: "Elders sharing cultural art techniques with youth",
      size: "large",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/beach-activities.jpg",
      alt: "Beach Activities",
      caption: "Youth learning about marine environments during low tide",
      size: "medium",
      orientation: "portrait"
    },
    {
      src: "/images/gallery/storytelling-circle.jpg",
      alt: "Storytelling Circle",
      caption: "A community storytelling circle with Elders sharing wisdom",
      size: "medium",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/art-session.jpg",
      alt: "Art Session",
      caption: "Traditional art techniques being taught to young participants",
      size: "small",
      orientation: "portrait"
    },
    {
      src: "/images/gallery/bush-tucker.jpg",
      alt: "Bush Tucker Walk",
      caption: "Learning about native plants and their traditional uses",
      size: "medium",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/dance-performance.jpg",
      alt: "Dance Performance",
      caption: "Traditional dance performance during the program",
      size: "large",
      orientation: "portrait" 
    },
    {
      src: "/images/gallery/weaving-workshop.jpg",
      alt: "Weaving Workshop",
      caption: "Learning traditional weaving techniques from community experts",
      size: "large",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/group-discussion.jpg",
      alt: "Group Discussion",
      caption: "Community members discussing cultural perspectives and knowledge",
      size: "medium",
      orientation: "square"
    },
    {
      src: "/images/gallery/beach-cleanup.jpg",
      alt: "Beach Cleanup",
      caption: "Youth participating in environmental stewardship activities on Country",
      size: "small",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/painting-session.jpg",
      alt: "Painting Session",
      caption: "Creating artwork inspired by cultural stories and traditions",
      size: "medium",
      orientation: "portrait"
    },
    {
      src: "/images/gallery/elder-teaching.jpg",
      alt: "Elder Teaching",
      caption: "An Elder sharing traditional ecological knowledge with the younger generation",
      size: "large", 
      orientation: "landscape"
    },
    {
      src: "/images/gallery/community-gathering.jpg",
      alt: "Community Gathering",
      caption: "A community celebration at the end of the MMEIC School Holiday Program",
      size: "medium",
      orientation: "square"
    },
    {
      src: "/images/gallery/cultural-ceremony.jpg",
      alt: "Cultural Ceremony",
      caption: "An important cultural ceremony connecting youth to traditions",
      size: "large",
      orientation: "portrait"
    },
    {
      src: "/images/gallery/traditional-fishing.jpg",
      alt: "Traditional Fishing",
      caption: "Learning traditional fishing techniques and sustainable practices",
      size: "medium",
      orientation: "landscape"
    },
    {
      src: "/images/gallery/cultural-exchange.jpg",
      alt: "Cultural Exchange",
      caption: "Intergenerational knowledge sharing between youth and Elders",
      size: "small",
      orientation: "portrait"
    }
  ];

  // New function to load photos directly from the gallery directory
  const loadPhotosFromGallery = async () => {
    try {
      // Try to get gallery files from the simplified fileSystem utility
      const imageFiles = await fileSystem.listFiles('/images/gallery/');
      console.log('Found images:', imageFiles);
      
      if (imageFiles.length > 0) {
        // Initialize photos array with basic info
        const initialPhotos: PhotoItem[] = imageFiles.map(file => {
          const filename = file.split('/').pop() || '';
          const nameWithoutExtension = filename.split('.')[0];
          const formattedName = nameWithoutExtension
            .replace(/-/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
          
          return {
            src: file,
            alt: formattedName,
            caption: `${formattedName} - MMEIC School Holiday Program`,
            size: 'medium', // Default size
            orientation: 'landscape', // Default orientation
            isProcessed: true
          };
        });
        
        setPhotos(initialPhotos);
      } else {
        // Fallback to sample photos if no images found
        fallbackToSamplePhotos();
      }
    } catch (error) {
      console.error('Error loading photos from gallery:', error);
      fallbackToSamplePhotos();
    }
  };
  
  // Fallback function to use sample photos
  const fallbackToSamplePhotos = () => {
    console.log('Using sample photo data');
    setPhotos(samplePhotos);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First, load the photos
        await loadPhotosFromGallery();
        
        // Set videos array directly with sample videos
        setVideos(sampleVideos);
        
        // Find main video embed code from sample videos
        const mainVideoFromSamples = sampleVideos.find(video => video.isMainVideo);
        
        if (mainVideoFromSamples) {
          setActiveVideo(mainVideoFromSamples);
        } else if (sampleVideos.length > 0) {
          setActiveVideo(sampleVideos[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        fallbackToSampleData();
      } finally {
        setLoading(false);
      }
    };
    
    const fallbackToSampleData = () => {
      console.log("Using sample video data");
      fallbackToSamplePhotos();
      setVideos(sampleVideos);
      
      if (sampleVideos.length > 0) {
        setActiveVideo(sampleVideos[0]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleVideoSelect = (video: VideoItem) => {
    setActiveVideo(video);
    // Scroll to the video player container
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
    // Add class to body to prevent scrolling while lightbox is open
    document.body.classList.add('overflow-hidden');
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    } else {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const openTranscript = (transcriptFile: string) => {
    setCurrentTranscript(transcriptFile);
    setTranscriptOpen(true);
    // Add class to body to prevent scrolling while transcript is open
    document.body.classList.add('overflow-hidden');
  };

  const closeTranscript = () => {
    setTranscriptOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-amber-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    );
  }

  // Find the main video for special layout treatment
  const mainVideo = videos.find(video => video.isMainVideo);
  const supportingVideos = videos.filter(video => !video.isMainVideo);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-amber-700 mb-6">Community Stories</h1>
      
      {/* Tab Navigation */}
      <div className="flex mb-8">
        <button 
          className={`px-6 py-3 font-medium rounded-tl-lg rounded-tr-lg ${activeTab === 'videos' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('videos')}
        >
          Video Stories
        </button>
        <button 
          className={`px-6 py-3 font-medium rounded-tl-lg rounded-tr-lg ${activeTab === 'photos' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('photos')}
        >
          Photo Gallery
        </button>
      </div>
      
      {activeTab === 'videos' && (
        <div>
          {/* Video Player */}
          <div ref={videoContainerRef} className="mb-8">
            {activeVideo && (
              <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-black relative">
                  {/* Safe Video Player - use iframe directly with proper attributes */}
                  <iframe
                    src={activeVideo.videoSrc}
                    className="w-full h-full absolute inset-0"
                    title={activeVideo.title}
                    frameBorder="0"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
                
                <div className="p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-amber-700">{activeVideo.title}</h2>
                      <p className="text-sm text-gray-500">Theme: {activeVideo.theme}</p>
                    </div>
                    <div className="bg-amber-100 px-3 py-1 rounded-full">
                      <p className="text-sm text-amber-800">{activeVideo.storyteller}</p>
                    </div>
                  </div>
                  
                  <blockquote className="border-l-4 border-amber-500 pl-4 italic text-gray-700 my-4">
                    "{activeVideo.quote}"
                  </blockquote>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Summary</h3>
                      <p className="text-gray-600">{activeVideo.transcript}</p>
                    </div>
                    
                    {activeVideo.transcriptFile && (
                      <button 
                        onClick={() => openTranscript(activeVideo.transcriptFile || '')}
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Full Transcript
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Special section for supporting videos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-amber-700 mb-4">Supporting Stories</h2>
            <p className="text-gray-600 mb-4">
              These videos showcase individual community voices and their unique perspectives.
            </p>
        </div>
        
        {/* Video Thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {supportingVideos.map((video, index) => (
            <div 
              key={index} 
                className={`cursor-pointer rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg ${activeVideo === video ? 'ring-2 ring-amber-500' : ''}`}
                onClick={() => handleVideoSelect(video)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-800 relative group">
                  {/* Video Thumbnail - In production, use actual thumbnails */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-800/40 to-gray-900/60 group-hover:from-amber-700/50 group-hover:to-gray-800/70 transition-all">
                    <div className="text-white text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/80 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-lg">{video.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-amber-700">{video.title}</h3>
                      <p className="text-xs text-gray-500">Theme: {video.theme}</p>
                    </div>
                    <span className="text-xs bg-amber-100 px-2 py-1 rounded-full text-amber-800">{video.storyteller.split(',')[0]}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{video.quote}</p>
                  
                  {video.transcriptFile && (
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openTranscript(video.transcriptFile || '');
                        }}
                        className="text-xs text-amber-700 hover:text-amber-800 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Transcript
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
              </div>
          
          {/* Call to action */}
          <div className="mt-10 text-center">
            <p className="text-gray-700 mb-3">
              Want to see the main documentary again?
            </p>
            <button 
              onClick={() => handleVideoSelect(mainVideo as VideoItem)}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Watch Full Documentary
            </button>
            </div>
        </div>
      )}
      
      {activeTab === 'photos' && (
        <div>
          {/* Photo Gallery - Masonry Style Layout */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-amber-700 mb-4">MMEIC School Holiday Program - Photo Gallery</h2>
            <p className="text-gray-600 mb-4">
              These images capture moments from our cultural programs, showing the connections between youth, Elders, and Country.
          </p>
        </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-auto gap-4">
            {photos.map((photo, index) => {
              // If photo is still being processed for orientation/size, use default
              const orientation = photo.orientation || 'landscape';
              const size = photo.size || 'medium';
              
              // Dynamic classes based on orientation and size
              const sizeClasses: Record<string, string> = {
                small: 'col-span-1 row-span-1',
                medium: orientation === 'portrait' ? 'col-span-1 row-span-2' : 
                       orientation === 'square' ? 'col-span-1 row-span-1' : 'col-span-2 row-span-1',
                large: orientation === 'portrait' ? 'col-span-1 row-span-2' : 'col-span-2 row-span-1'
              };
              
              const spanClass = sizeClasses[size];
              
              return (
                <div 
                  key={index} 
                  className={`group cursor-pointer ${spanClass} transition-all duration-300`}
                  onClick={() => openLightbox(index)}
                >
                  <div className={`h-full w-full overflow-hidden rounded-lg bg-gray-100 shadow-md transition-all duration-300 group-hover:shadow-xl relative ${!photo.isProcessed ? 'animate-pulse' : ''}`}>
                <img 
                  src={photo.src} 
                  alt={photo.alt} 
                  className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105" 
                />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-bold">{photo.alt}</h3>
                      <p className="text-white text-sm mt-1">{photo.caption}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Add upload instructions when no photos are found */}
          {photos.length === 0 && (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Photos Found</h3>
              <p className="text-gray-600 mb-4">
                Please add your photos to the following directory:
              </p>
              <div className="bg-gray-200 p-3 rounded text-gray-700 font-mono text-sm mb-4 overflow-x-auto">
                /Users/benknight/MMEIC/mmeic-dashboard/public/images/gallery/
              </div>
              <p className="text-gray-600">
                The gallery will automatically detect image orientation and arrange them in an optimal layout.
              </p>
            </div>
          )}
          
          {/* Lightbox */}
          {lightboxOpen && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <button 
                className="absolute top-4 right-4 text-white hover:text-amber-400"
                onClick={closeLightbox}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <button 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-amber-400"
                onClick={() => navigateLightbox('prev')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="max-w-5xl max-h-[90vh] overflow-hidden">
                <img 
                  src={photos[currentPhotoIndex].src} 
                  alt={photos[currentPhotoIndex].alt} 
                  className="max-w-full max-h-[80vh] object-contain" 
                />
                <div className="mt-4 text-white text-center max-w-2xl mx-auto">
                  <p className="text-xl font-medium">{photos[currentPhotoIndex].alt}</p>
                  <p className="text-gray-300 mt-2">{photos[currentPhotoIndex].caption}</p>
                  <p className="text-amber-400 text-sm mt-4">{currentPhotoIndex + 1} of {photos.length}</p>
                </div>
              </div>
              
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-amber-400"
                onClick={() => navigateLightbox('next')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Transcript Modal */}
      <TranscriptView 
        transcriptFile={currentTranscript}
        isOpen={transcriptOpen}
        onClose={closeTranscript}
      />
      
      {/* About Section */}
      <section className="mt-16 bg-amber-50 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-amber-700 mb-4">About Our Stories</h2>
        <div className="prose max-w-none text-gray-700">
          <p className="mb-4">
            These stories represent the voices and experiences of community members from Stradbroke Island, 
            sharing their insights on culture, connection to country, traditional knowledge, and the 
            importance of passing these values to future generations.
          </p>
          <p>
            The main documentary brings together multiple perspectives from community members, while the supporting
            videos highlight individual voices. Together, they showcase the MMEIC School Holiday Program on 
            Stradbroke Island, providing young people with opportunities to connect with Elders and Traditional Owners,
            learning cultural practices, environmental stewardship, and community values.
          </p>
        </div>
      </section>
    </div>
  );
};

export default StoriesPage; 