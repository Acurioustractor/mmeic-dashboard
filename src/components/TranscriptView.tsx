import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import fileSystem from '../utils/fileSystem';

interface TranscriptViewProps {
  transcriptFile: string;
  isOpen: boolean;
  onClose: () => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcriptFile, isOpen, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transcriptFile) {
      setLoading(true);
      setError(null);
      
      // Use our simplified fileSystem to get the transcript content
      const fetchTranscript = async () => {
        try {
          let path = transcriptFile;
          
          // Make sure the path has the correct format
          if (!path.startsWith('/transcripts/')) {
            path = `/transcripts/${path}`;
          }
          
          // Remove any double slashes
          path = path.replace(/\/\//g, '/');
          
          const content = await fileSystem.readFile(path);
          if (!content) {
            throw new Error('No content found');
          }
          
          setContent(content);
          setLoading(false);
        } catch (err) {
          console.error('Error loading transcript:', err);
          setError('Could not load the transcript. Please try again later.');
          setLoading(false);
          
          // Fallback content for development
          setContent(`# Transcript Placeholder\n\nThis is a placeholder for the transcript: ${transcriptFile}\n\nIn a production environment, this would contain the actual transcript content.`);
        }
      };
      
      fetchTranscript();
    }
  }, [transcriptFile, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl mx-auto max-w-4xl">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
            <h2 className="text-2xl font-bold text-amber-700">Transcript</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close transcript"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-t-4 border-amber-500 border-solid rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-700">
                <p>{error}</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptView; 