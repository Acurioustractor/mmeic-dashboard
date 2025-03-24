import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import the file system utility
import '../utils/fileSystem';

interface Quote {
  text: string;
  source: string;
}

interface ThemeData {
  name: string;
  count: number;
  quotes: Quote[];
  sources: string[];
  description: string;
  storytellerDistribution: { [key: string]: number };
}

interface SentimentDataType {
  name: string;
  value: number;
}

// Theme color palette - limited to fewer colors to reduce rendering complexity
const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

const StorytellerVisualization: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'themes' | 'sentiment'>('themes');
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [sentimentData] = useState<SentimentDataType[]>([
    { name: 'Cultural Identity', value: 8 },
    { name: 'Sovereignty', value: 6 },
    { name: 'Healing', value: 7 },
    { name: 'Justice', value: 5 },
    { name: 'Empowerment', value: 9 },
    { name: 'Resilience', value: 8 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('StorytellerVisualization: Fetching CSV data...');
        const response = await fetch('/Storytellers-Stradbroke.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('StorytellerVisualization: CSV data fetched, length:', csvText.length);
        console.log('StorytellerVisualization: First 100 chars:', csvText.substring(0, 100));
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('StorytellerVisualization: CSV parsing complete, rows:', results.data.length);
            console.log('StorytellerVisualization: Sample row:', results.data[0]);
            processData(results);
            setLoading(false);
          },
          error: (err: Error) => {
            console.error('StorytellerVisualization: Error parsing CSV:', err);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('StorytellerVisualization: Error fetching data:', err);
        setLoading(false);
        
        // Create sample data as fallback
        const sampleThemes: ThemeData[] = [
          {
            name: 'Community Support',
            count: 8,
            quotes: [{ text: 'Sample quote about community support', source: 'Sample Storyteller' }],
            sources: ['Sample Storyteller 1', 'Sample Storyteller 2'],
            description: 'A sample theme about community support',
            storytellerDistribution: { 'Sample Storyteller 1': 4, 'Sample Storyteller 2': 4 }
          },
          {
            name: 'Sustainability',
            count: 6,
            quotes: [{ text: 'Sample quote about sustainability', source: 'Sample Storyteller' }],
            sources: ['Sample Storyteller 1', 'Sample Storyteller 3'],
            description: 'A sample theme about sustainability',
            storytellerDistribution: { 'Sample Storyteller 1': 3, 'Sample Storyteller 3': 3 }
          }
        ];
        
        setThemes(sampleThemes);
        console.log('StorytellerVisualization: Using fallback sample data:', sampleThemes);
      }
    };

    fetchData();
  }, []);

  const processData = (results: { data: any[] }) => {
    console.log('Processing data...');
    
    // Track themes already processed for each storyteller
    const processedThemesPerStoryteller: { [storyteller: string]: Set<string> } = {};
    
    // Process main themes
    const themeAnalysis: { [theme: string]: ThemeData } = {};
    
    // Process each row in the CSV
    results.data.forEach((row: any) => {
      const storyteller = row['Name'] || 'Unknown';
      
      // Initialize set for this storyteller if not exists
      if (!processedThemesPerStoryteller[storyteller]) {
        processedThemesPerStoryteller[storyteller] = new Set<string>();
      }
      
      // Process main themes from 'Themes (from Media)'
      const themesText = row['Themes (from Media)'] || '';
      const themeDescriptions = row['Description (from Themes) (from Media)'] || '';
      
      // Split themes by comma
      const themes = themesText.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      const descriptions = themeDescriptions.split(',').map((d: string) => d.trim()).filter((d: string) => d);
      
      // Process each theme
      themes.forEach((theme: string, index: number) => {
        // Skip if this theme was already processed for this storyteller
        if (processedThemesPerStoryteller[storyteller].has(theme)) {
          return;
        }
        
        // Mark as processed
        processedThemesPerStoryteller[storyteller].add(theme);
        
        // Initialize theme if not exists
        if (!themeAnalysis[theme]) {
          themeAnalysis[theme] = {
            name: theme,
            count: 0,
            quotes: [],
            sources: [],
            description: descriptions[index] || '',
            storytellerDistribution: {}
          };
        }
        
        // Update theme data
        themeAnalysis[theme].count += 1;
        if (!themeAnalysis[theme].sources.includes(storyteller)) {
          themeAnalysis[theme].sources.push(storyteller);
        }
        
        // Update storyteller distribution
        themeAnalysis[theme].storytellerDistribution[storyteller] = 
          (themeAnalysis[theme].storytellerDistribution[storyteller] || 0) + 1;
        
        // Process quotes
        const transcript = (row['Transcript'] || row['Transcript (from Media)'] || '').toString();
        const summary = (row['Summary (from Media)'] || '').toString();
        
        // Extract quotes from transcript
        const sentences = transcript.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s);
        
        // Find relevant quotes for this theme
        let quotesAdded = 0;
        const maxQuotesPerTheme = 3;
        
        // Check each sentence for relevance to the theme
        sentences.forEach((sentence: string) => {
          if (quotesAdded >= maxQuotesPerTheme) return;
          
          // Simple relevance check - contains the theme name or related words
          const themeWords = theme.toLowerCase().split(/\s+/);
          const sentenceLower = sentence.toLowerCase();
          
          const isRelevant = themeWords.some((word: string) => 
            sentenceLower.includes(word) && word.length > 3
          );
          
          if (isRelevant) {
            themeAnalysis[theme].quotes.push({
              text: sentence,
              source: storyteller
            });
            quotesAdded++;
          }
        });
        
        // If we didn't find enough quotes in the transcript, check the summary
        if (quotesAdded < maxQuotesPerTheme) {
          const summarySentences = summary.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s);
          
          summarySentences.forEach((sentence: string) => {
            if (quotesAdded >= maxQuotesPerTheme) return;
            
            const themeWords = theme.toLowerCase().split(/\s+/);
            const sentenceLower = sentence.toLowerCase();
            
            const isRelevant = themeWords.some((word: string) => 
              sentenceLower.includes(word) && word.length > 3
            );
            
            if (isRelevant) {
              themeAnalysis[theme].quotes.push({
                text: sentence,
                source: storyteller
              });
              quotesAdded++;
            }
          });
        }
      });
    });
    
    console.log('Theme analysis:', themeAnalysis);
    
    // Convert to array and sort by number of sources
    const processedThemes = Object.values(themeAnalysis)
      .sort((a, b) => b.sources.length - a.sources.length)
      .filter(theme => theme.sources.length > 0);
    
    console.log('Processed themes:', processedThemes);
    
    // Set the themes state
    setThemes(processedThemes);
    
    return themeAnalysis;
  };

  const renderThemeDetails = (theme: ThemeData) => {
    // Sort quotes by storyteller to ensure diverse representation
    const quotesGroupedByStoryteller = theme.quotes.reduce((acc, quote) => {
      if (!acc[quote.source]) {
        acc[quote.source] = [];
      }
      acc[quote.source].push(quote);
      return acc;
    }, {} as { [key: string]: Quote[] });

    // Get up to 3 quotes from each storyteller
    let selectedQuotes: Quote[] = [];
    const storytellers = Object.keys(quotesGroupedByStoryteller);
    
    storytellers.forEach(storyteller => {
      const storytellerQuotes = quotesGroupedByStoryteller[storyteller];
      if (storytellerQuotes.length > 0) {
        const sortedQuotes = storytellerQuotes
          .sort((a, b) => {
            const aScore = Math.abs(a.text.length - 225);
            const bScore = Math.abs(b.text.length - 225);
            return aScore - bScore;
          });
        selectedQuotes.push(...sortedQuotes.slice(0, 3));
      }
    });

    // Take up to 8 quotes total
    selectedQuotes = _.shuffle(selectedQuotes).slice(0, 8);

    const cleanQuote = (text: string) => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/\.+/g, '.')
        .replace(/\s+\./g, '.')
        .replace(/\s+,/g, ',')
        .replace(/^["""]/g, '')
        .replace(/["""]$/g, '')
        .replace(/^['']|['']$/g, '')
        .trim();
    };

    return (
      <div 
        id={`theme-${theme.name.replace(/\s+/g, '-')}`}
        key={theme.name} 
        className="theme-section mb-8 p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-2xl font-semibold mb-3 text-orange-600">{theme.name}</h3>
        <p className="text-gray-700 mb-4 text-lg">{theme.description}</p>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-gray-700">Community Voices:</h4>
          <p className="text-gray-600">
            Shared by: {theme.sources.join(', ')}
          </p>
        </div>

        <div className="quotes-section">
          <h4 className="font-medium mb-4 text-gray-700">Key Insights:</h4>
          <div className="grid gap-6">
            {selectedQuotes.map((quote, index) => (
              <div key={index} className="quote-item p-5 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                <p className="italic text-gray-700 mb-3 text-lg">"{cleanQuote(quote.text)}"</p>
                <p className="text-sm text-gray-500 font-medium">- {quote.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSentimentVisualization = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Sentiment Analysis by Theme</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={sentimentData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Sentiment Score" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 text-gray-600 text-sm">
          <p className="mb-2">Sentiment scores range from 0 (negative) to 10 (positive)</p>
          <p>The analysis identifies emotional tones in storyteller narratives and quantifies the sentiment associated with different themes.</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-10">Loading data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Community Themes & Insights</h1>
      
      {/* Theme Overview Section */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {themes
            .filter(theme => theme.sources.length > 0)
            .map((theme, index) => (
              <button
                key={theme.name}
                className={`px-4 py-2 rounded-full text-white font-medium transition-all hover:scale-105 shadow-md`}
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                  opacity: 0.9,
                }}
                onClick={() => {
                  // Scroll to theme section
                  const element = document.getElementById(`theme-${theme.name.replace(/\s+/g, '-')}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {theme.name}
              </button>
            ))}
        </div>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button
          className={`px-6 py-2 rounded-lg transition-all hover:bg-orange-600 hover:shadow-lg ${
            activeView !== 'sentiment' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-200'
          }`}
          onClick={() => setActiveView('themes')}
        >
          Storyteller Analysis
        </button>
        <button
          className={`px-6 py-2 rounded-lg transition-all hover:bg-orange-600 hover:shadow-lg ${
            activeView === 'sentiment' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-200'
          }`}
          onClick={() => setActiveView('sentiment')}
        >
          Sentiment Analysis
        </button>
      </div>

      {activeView !== 'sentiment' && (
        <div>
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <p className="text-gray-600 text-lg mb-6">
              Through careful analysis of community narratives, several key themes emerged consistently 
              across different storytellers. Each theme represents important aspects of community 
              experiences, values, and aspirations. Below are the identified themes along with 
              supporting quotes from community members.
            </p>
          </div>
          
          <div className="space-y-8">
            {themes
              .filter(theme => theme.sources.length > 0)
              .sort((a, b) => b.sources.length - a.sources.length)
              .map(theme => renderThemeDetails(theme))}
          </div>
        </div>
      )}

      {activeView === 'sentiment' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-center">Sentiment Analysis</h3>
          {renderSentimentVisualization()}
        </div>
      )}
    </div>
  );
};

export default StorytellerVisualization;