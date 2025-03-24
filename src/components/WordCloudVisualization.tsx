import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// Define type for word items
interface WordItem {
  text: string;
  value: number;
}

const WordCloudVisualization: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('cultural');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use useMemo to avoid recreating these arrays on every render
  const wordSets = useMemo(() => {
    // Cultural words
    const culturalWords: WordItem[] = [
      { text: 'Country', value: 85 },
      { text: 'Culture', value: 78 },
      { text: 'Community', value: 92 },
      { text: 'Oysters', value: 67 },
      { text: 'Sovereignty', value: 73 },
      { text: 'Knowledge', value: 65 },
      { text: 'Identity', value: 71 },
      { text: 'Elders', value: 58 },
      { text: 'Language', value: 52 },
      { text: 'Connection', value: 68 },
      { text: 'Traditions', value: 49 },
      { text: 'Healing', value: 62 },
      { text: 'Land', value: 70 },
      { text: 'Sea', value: 56 },
      { text: 'Generations', value: 59 },
      { text: 'Ancestors', value: 51 },
      { text: 'Stories', value: 47 },
      { text: 'Practices', value: 44 },
      { text: 'Minjerribah', value: 53 },
      { text: 'Quandamooka', value: 57 },
      { text: 'Resilience', value: 63 },
      { text: 'Self-determination', value: 61 },
      { text: 'Wellbeing', value: 46 },
      { text: 'Farming', value: 42 },
      { text: 'Youth', value: 49 },
      { text: 'Future', value: 54 },
      { text: 'Moreton Bay', value: 48 },
      { text: 'Ceremony', value: 38 },
      { text: 'Heritage', value: 43 },
      { text: 'Responsibility', value: 41 }
    ];
    
    // Justice words
    const justiceWords: WordItem[] = [
      { text: 'Justice', value: 76 },
      { text: 'Reinvestment', value: 68 },
      { text: 'Holistic', value: 63 },
      { text: 'Community-led', value: 71 },
      { text: 'Prevention', value: 59 },
      { text: 'Self-determination', value: 74 },
      { text: 'Sovereignty', value: 67 },
      { text: 'Systems', value: 61 },
      { text: 'Challenges', value: 58 },
      { text: 'Wellbeing', value: 64 },
      { text: 'Empowerment', value: 69 },
      { text: 'Programs', value: 56 },
      { text: 'Preventative', value: 62 },
      { text: 'Reactive', value: 51 },
      { text: 'Intergenerational', value: 66 },
      { text: 'Harmony', value: 57 },
      { text: 'Connection', value: 60 },
      { text: 'Healing', value: 65 },
      { text: 'Community', value: 78 },
      { text: 'Country', value: 72 },
      { text: 'Restorative', value: 59 },
      { text: 'Alternatives', value: 54 },
      { text: 'Leadership', value: 61 },
      { text: 'Elders', value: 63 },
      { text: 'Youth', value: 65 },
      { text: 'Mentorship', value: 58 },
      { text: 'Responsibility', value: 62 },
      { text: 'Advocacy', value: 57 },
      { text: 'Reform', value: 53 },
      { text: 'Self-sufficiency', value: 64 }
    ];
    
    // Economic words
    const economicWords: WordItem[] = [
      { text: 'Oyster Farming', value: 82 },
      { text: 'Economic', value: 76 },
      { text: 'Sustainability', value: 71 },
      { text: 'Commercial', value: 68 },
      { text: 'Traditional', value: 74 },
      { text: 'Leases', value: 63 },
      { text: 'Generational Wealth', value: 69 },
      { text: 'Business', value: 65 },
      { text: 'Self-sufficient', value: 72 },
      { text: 'Infrastructure', value: 59 },
      { text: 'Community', value: 77 },
      { text: 'Connection', value: 64 },
      { text: 'Food Source', value: 67 },
      { text: 'Growth', value: 61 },
      { text: 'Opportunities', value: 66 },
      { text: 'Barriers', value: 58 },
      { text: 'Funding', value: 60 },
      { text: 'Regulations', value: 56 },
      { text: 'Industry', value: 62 },
      { text: 'Cultural Practices', value: 73 },
      { text: 'Next Generation', value: 70 },
      { text: 'Training', value: 57 },
      { text: 'Skills', value: 59 },
      { text: 'Knowledge Transfer', value: 68 },
      { text: 'Innovation', value: 55 },
      { text: 'Resources', value: 63 },
      { text: 'Ownership', value: 71 },
      { text: 'Cooperative', value: 58 },
      { text: 'Self-determination', value: 75 },
      { text: 'Resilience', value: 67 }
    ];
    
    return { culturalWords, justiceWords, economicWords };
  }, []);
  
  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate loading time
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error creating word cloud:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define PlacedWord interface for collision detection
  interface PlacedWord {
    text: string;
    x: number;
    y: number;
    fontSize: number;
  }

  // Improved collision detection function with bigger padding
  const checkCollision = useCallback((word: WordItem, x: number, y: number, fontSize: number, placedWords: PlacedWord[]): boolean => {
    // Estimate the dimensions of the word with more accurate width calculation
    const textWidth = word.text.length * fontSize * 0.65; // Wider width estimate for better spacing
    const textHeight = fontSize * 1.3; // Taller height estimate for better vertical spacing
    
    // Create a boundary box for this word
    const rect1 = {
      left: x - textWidth / 2,
      right: x + textWidth / 2,
      top: y - textHeight / 2,
      bottom: y + textHeight / 2
    };
    
    // Check collision with all placed words
    for (const placedWord of placedWords) {
      const placedTextWidth = placedWord.text.length * placedWord.fontSize * 0.65; 
      const placedTextHeight = placedWord.fontSize * 1.3;
      
      const rect2 = {
        left: placedWord.x - placedTextWidth / 2,
        right: placedWord.x + placedTextWidth / 2,
        top: placedWord.y - placedTextHeight / 2,
        bottom: placedWord.y + placedTextHeight / 2
      };
      
      // Add padding for extra spacing between words (increased)
      const padding = Math.min(fontSize, placedWord.fontSize) * 0.6; // More padding between words
      rect2.left -= padding;
      rect2.right += padding;
      rect2.top -= padding;
      rect2.bottom += padding;
      
      // Check for intersection
      if (!(rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom)) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }, []);

  // Enhanced rendering function with better collision detection
  const renderWordCloud = useCallback(() => {
    // Clear previous visualization
    const container = document.getElementById('word-cloud-container');
    if (!container) return;
    
    // Clean up container and any previously added help text
    container.innerHTML = '';
    
    // Also remove any previous help text nodes that might have been added outside the container
    const helpTextElements = document.querySelectorAll('.word-cloud-help-text');
    helpTextElements.forEach(element => element.remove());
    
    // Get the appropriate word set based on active view
    let words: WordItem[] = [];
    switch (activeView) {
      case 'cultural':
        words = wordSets.culturalWords;
        break;
      case 'justice':
        words = wordSets.justiceWords;
        break;
      case 'economic':
        words = wordSets.economicWords;
        break;
      default:
        words = wordSets.culturalWords;
    }
    
    const width = container.clientWidth || 600;
    const height = 500;
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.style.overflow = 'visible';
    container.appendChild(svg);
    
    // Center of the visualization
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Sort words by value (largest first)
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    
    // Limit the number of words to display to prevent overcrowding
    const maxWords = 25; // Show top 25 words max
    const displayWords = sortedWords.slice(0, maxWords);
    
    // Track placed words to prevent overlap
    const placedWords: PlacedWord[] = [];
    
    // Prepare tooltip container that will be reused
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-white shadow-lg rounded-lg p-3 z-50 hidden';
    tooltip.style.pointerEvents = 'none';
    document.body.appendChild(tooltip);
    
    // Place words with collision detection
    displayWords.forEach((word) => {
      // Scale font size based on word value - more logarithmic scaling for better distribution
      const minValue = Math.min(...words.map(w => w.value));
      const maxValue = Math.max(...words.map(w => w.value));
      const normalizedValue = (word.value - minValue) / (maxValue - minValue);
      
      // Smaller font size range to prevent huge words
      const fontSize = Math.max(14, Math.min(38, 14 + normalizedValue * 24));
      
      // Try different positions until a non-colliding one is found
      let placed = false;
      let attempts = 0;
      const maxAttempts = 300; // More attempts to find a good position
      
      // Spiral parameters (adjusted for better distribution)
      let angle = Math.random() * Math.PI * 2; // Random starting angle
      let radius = 10; // Start closer to center
      const radiusIncrement = 0.8; // Faster spiral growth
      const angleIncrement = 0.25; // Slower angular change
      
      while (!placed && attempts < maxAttempts) {
        // Calculate spiral position
        radius += radiusIncrement + (Math.random() * 0.5); // Add randomness to radius growth
        angle += angleIncrement + (Math.random() * 0.1); // Add randomness to angle change
        
        // Get position on spiral
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Check if the word fits at this position
        if (x > fontSize && x < width - fontSize && y > fontSize && y < height - fontSize) {
          if (!checkCollision(word, x, y, fontSize, placedWords)) {
            // Position is valid, create text element
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x.toString());
            text.setAttribute('y', y.toString());
            text.setAttribute('font-size', `${fontSize}px`);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-weight', normalizedValue > 0.7 ? 'bold' : 'normal');
            
            // Color based on word value and theme
            const hue = activeView === 'cultural' ? 200 : activeView === 'justice' ? 45 : 120;
            const saturation = 60 + normalizedValue * 30;
            const lightness = 35 + (1 - normalizedValue) * 25;
            text.setAttribute('fill', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
            
            text.textContent = word.text;
            
            // Add interaction
            text.setAttribute('class', 'word-cloud-text transition-all duration-300');
            text.style.cursor = 'pointer';
            
            // Use mouseover/out for hover and click for showing tooltip
            text.addEventListener('mouseover', () => {
              // Highlight the word
              text.setAttribute('font-size', `${fontSize * 1.2}px`);
              text.setAttribute('font-weight', 'bold');
              text.setAttribute('fill', `hsl(${hue}, ${saturation + 10}%, ${lightness - 10}%)`);
              
              // Show tooltip
              tooltip.innerHTML = `<strong>${word.text}</strong>: Appears ${word.value} times in the narratives`;
              tooltip.classList.remove('hidden');
              
              const updateTooltipPosition = (e: MouseEvent) => {
                tooltip.style.left = `${e.clientX + 10}px`;
                tooltip.style.top = `${e.clientY - 40}px`;
              };
              
              updateTooltipPosition(window.event as MouseEvent);
              
              // Add mousemove listener to the document
              document.addEventListener('mousemove', updateTooltipPosition);
              
              // Store the listener in a property so we can remove it later
              (text as any)._tooltipMoveListener = updateTooltipPosition;
            });
            
            text.addEventListener('mouseout', () => {
              // Reset word style
              text.setAttribute('font-size', `${fontSize}px`);
              text.setAttribute('font-weight', normalizedValue > 0.7 ? 'bold' : 'normal');
              text.setAttribute('fill', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
              
              // Hide tooltip
              tooltip.classList.add('hidden');
              
              // Remove the mousemove listener
              document.removeEventListener('mousemove', (text as any)._tooltipMoveListener);
            });
            
            svg.appendChild(text);
            
            // Record the placed word for collision detection
            placedWords.push({
              text: word.text,
              x,
              y,
              fontSize,
            });
            
            placed = true;
          }
        }
        
        attempts++;
      }
      
      // If we couldn't place the word after max attempts, skip it rather than placing it randomly
      // This prevents text overlap
    });
    
    // Add help text about interactivity (only once)
    const note = document.createElement('div');
    note.className = 'text-sm text-gray-500 mt-4 text-center word-cloud-help-text';
    note.textContent = 'Hover over any word to see frequency details';
    container.parentNode?.appendChild(note);
    
  }, [activeView, checkCollision, wordSets]);

  // Render word cloud when data or view changes
  useEffect(() => {
    if (!loading) {
      renderWordCloud();
      
      // Add window resize handler to make it responsive
      const handleResize = () => {
        renderWordCloud();
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        
        // Clean up any tooltips when unmounting
        const tooltips = document.querySelectorAll('.fixed.bg-white.shadow-lg');
        tooltips.forEach(tooltip => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        });
      };
    }
  }, [loading, activeView, renderWordCloud]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" ref={containerRef}>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Word Cloud Analysis</h2>
        
        <div className="flex flex-wrap justify-center mb-4 gap-2">
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 min-w-[140px] ${
              activeView === 'cultural' ? 'bg-amber-700 text-white hover:bg-amber-800' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveView('cultural')}
          >
            Cultural Terms
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 min-w-[140px] ${
              activeView === 'justice' ? 'bg-amber-700 text-white hover:bg-amber-800' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveView('justice')}
          >
            Justice Concepts
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 min-w-[140px] ${
              activeView === 'economic' ? 'bg-amber-700 text-white hover:bg-amber-800' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveView('economic')}
          >
            Economic Factors
          </button>
        </div>
        
        <div className="border bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-700 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating word cloud...</p>
              </div>
            </div>
          ) : (
            <div id="word-cloud-container" className="h-[500px] w-full p-4"></div>
          )}
        </div>
      </div>
      
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <h3 className="font-semibold text-amber-700 mb-2">About This Visualization</h3>
        <p className="text-sm">
          This word cloud visualizes the frequency of important terms appearing in the community interviews and storytelling sessions. 
          The size of each word represents how frequently it appears in the narratives, 
          with larger words occurring more often. Colors represent the intensity of usage across different themes.
        </p>
      </div>
    </div>
  );
};

export default WordCloudVisualization; 