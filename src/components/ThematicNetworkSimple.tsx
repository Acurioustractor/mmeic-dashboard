import React, { useState } from 'react';
import ThematicTable from './ThematicTable';

const ThematicNetworkSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'network' | 'table'>('table');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error attempting to enable fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  };

  // Listen for fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`relative bg-white p-6 rounded-lg shadow-md ${isFullscreen ? 'fullscreen-container' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-700">Thematic Network</h2>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'network' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('network')}
            >
              Network View
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'table' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('table')}
            >
              Table View
            </button>
          </div>
          <button
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2V3H7a4 4 0 00-4 4v2h2zm10-2V5a2 2 0 00-2-2h-2V1h2a4 4 0 014 4v2h-2zM5 11H3v2a4 4 0 004 4h2v-2H7a2 2 0 01-2-2v-2zm10 0h2v2a4 4 0 01-4 4h-2v-2h2a2 2 0 002-2v-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'network' ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-gray-500 mb-4">The network visualization is currently being updated.</p>
            <p className="text-gray-500">Please use the Table View to see thematic relationships.</p>
            <button 
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              onClick={() => setActiveTab('table')}
            >
              Switch to Table View
            </button>
          </div>
        </div>
      ) : (
        <ThematicTable />
      )}
    </div>
  );
};

export default ThematicNetworkSimple; 