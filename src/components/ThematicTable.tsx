import React, { useState, useEffect, useCallback } from 'react';

interface ThemeRelationship {
  theme1: string;
  theme2: string;
  strength: number;
  storytellers: string[];
  significance: 'high' | 'medium' | 'low';
}

interface StorytellerData {
  Name: string;
  'Themes (from Media)': string;
  'Description (from Themes) (from Media)'?: string;
  'Transcript (from Media)'?: string;
  'Transcript'?: string;
  'Summary (from Media)'?: string;
  'Quotes (from Media)'?: string;
}

// Helper function to normalize theme names
export const normalizeTheme = (theme: string): string => {
  // Remove extra whitespace and standardize capitalization
  const normalized = theme.trim().replace(/\s+/g, ' ');
  
  // Group similar themes (examples)
  const themeMap: Record<string, string> = {
    'cultural sovereignty': 'Cultural Sovereignty',
    'culture': 'Cultural Identity',
    'cultural identity': 'Cultural Identity',
    'identity': 'Cultural Identity',
    'self determination': 'Self-Determination',
    'self-determination': 'Self-Determination',
    'healing': 'Healing',
    'connection to country': 'Connection to Country',
    'country': 'Connection to Country',
    'land': 'Connection to Country',
    'community': 'Community Wellbeing',
    'community wellbeing': 'Community Wellbeing',
    'education': 'Education',
    'knowledge': 'Traditional Knowledge',
    'knowledge transfer': 'Traditional Knowledge',
    'traditional knowledge': 'Traditional Knowledge',
    'language': 'Language',
    'economic': 'Economic Development',
    'economic development': 'Economic Development',
    'sustainability': 'Sustainability',
    'environment': 'Environmental Stewardship',
    'environmental': 'Environmental Stewardship',
    'justice': 'Justice'
  };
  
  // Return the normalized theme
  return themeMap[normalized.toLowerCase()] || normalized;
};

// Helper function to determine significance
const calculateSignificance = (strength: number, maxStrength: number): 'high' | 'medium' | 'low' => {
  const ratio = strength / maxStrength;
  if (ratio > 0.7) return 'high';
  if (ratio > 0.4) return 'medium';
  return 'low';
};

// Function to get hardcoded storyteller data from the CSV
export const getHardcodedData = (): StorytellerData[] => {
  return [
    { 
      Name: 'Shaun Fisher', 
      'Themes (from Media)': 'Ownership and Narrative Control; Economic Growth and Sustainability; Advocacy and Systemic Challenge; Intergenerational Leadership; Cultural Preservation and Evolution; Aboriginal Sovereignty and Self-Determination; Intergenerational Knowledge Transfer; Oyster Farming as Economic and Cultural Backbone; Community-Led Infrastructure and Housing; Challenges with External Systems and Funding',
    },
    {
      Name: 'Benjamin Moss',
      'Themes (from Media)': 'Importance of Community-Led Research; Holistic Community Engagement; Intergenerational Knowledge Transmission; Environmental Restoration and Conservation; Knowledge Sharing and Global Relevance',
    },
    {
      Name: 'Alyssa Dawn Brewster',
      'Themes (from Media)': 'Community Engagement in Justice Reinvestment Programs; Culturally Based Education; Importance of Youth Activities in Remote Areas; Role of Elders in Community Programs; Collaborative Community Development',
    },
    {
      Name: 'Aunty Evie',
      'Themes (from Media)': 'Traditional Land and Heritage Stories; Nature\'s Bounty and Childhood Memories; Passing Down Knowledge; Environmental Changes and Loss; Gratitude to Elders and Ancestors',
    },
    {
      Name: 'Uncle Dale',
      'Themes (from Media)': 'Importance of Self-Worth Education; Comprehensive Justice Approach; Cultural Healing Centers; Historical and Cultural Restoration; Advocating for Legal Reforms and Sustainable Support',
    },
    {
      Name: 'Tegan Burns',
      'Themes (from Media)': 'Intergenerational Connection; Cultural Preservation; Holistic Justice; Community Building; Land and Identity',
    },
    {
      Name: 'Chelsea Rolfe',
      'Themes (from Media)': 'Intergenerational Connection and Responsibility; Leadership and Guidance from Elders; Justice as Multifaceted; Rebuilding and Reconnecting; Empowerment through Children',
    },
    {
      Name: 'Aunty Maureen',
      'Themes (from Media)': 'Grave Preparation Practices; Environmental Conservation; Community Heritage Preservation; Occupational Licensing; Local Landmarks Exploration',
    },
    {
      Name: 'John',
      'Themes (from Media)': 'Cultural Heritage Preservation; Intergenerational Bonding; Justice Beyond Incarceration; Empowerment through Connection; Healing from Historical Trauma',
    }
  ];
};

// Sample fallback data
const fallbackData: StorytellerData[] = [
  { 
    Name: 'Uncle Dale', 
    'Themes (from Media)': 'Cultural Sovereignty; Self-Determination; Justice; Cultural Identity',
  },
  {
    Name: 'Aunty Evie',
    'Themes (from Media)': 'Self-Determination; Healing; Traditional Knowledge; Connection to Country',
  },
  {
    Name: 'Tegan',
    'Themes (from Media)': 'Healing; Connection to Country; Environmental Stewardship; Justice',
  },
  {
    Name: 'Shaun Fisher',
    'Themes (from Media)': 'Connection to Country; Sustainability; Community Wellbeing; Cultural Identity',
  },
  {
    Name: 'Alyssa Dawn Brewster',
    'Themes (from Media)': 'Youth Empowerment; Education; Cultural Identity; Community Wellbeing',
  }
];

const ThematicTable: React.FC = () => {
  const [relationships, setRelationships] = useState<ThemeRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ThemeRelationship | 'storytellerCount';
    direction: 'ascending' | 'descending';
  } | null>(null);
  const [statistics, setStatistics] = useState({
    uniqueThemeCount: 0,
    relationshipCount: 0,
    strongestRelationship: { theme1: '', theme2: '', strength: 0 },
    mostConnectedTheme: { theme: '', connections: 0 }
  });
  const [filterText, setFilterText] = useState('');

  // Define processDataForTable as a useCallback to prevent ESLint dependencies warning
  const processDataForTable = useCallback((data: StorytellerData[]): ThemeRelationship[] => {
    console.log('Processing data for table, number of records:', data.length);
    // Create a map to track relationships between themes
    const relationshipMap = new Map<string, {
      theme1: string;
      theme2: string;
      strength: number;
      storytellers: Set<string>;
    }>();
    
    // Process each storyteller's data
    data.forEach(record => {
      const name = record.Name?.trim() || 'Unknown';
      
      // Get themes from the record - handle different possible formats
      let themesRaw: string[] = [];
      
      if (record['Themes (from Media)']) {
        // Try to split by semicolons first
        themesRaw = record['Themes (from Media)'].split(';');
        
        // If that didn't work (or resulted in just one entry), try commas
        if (themesRaw.length <= 1 && record['Themes (from Media)'].includes(',')) {
          themesRaw = record['Themes (from Media)'].split(',');
        }
      }
      
      // Normalize and filter the themes
      const themes = themesRaw
        .map(theme => normalizeTheme(theme))
        .filter(theme => theme.length > 0);
      
      console.log(`Storyteller ${name} has themes:`, themes);
      
      // Create relationships between each pair of themes
      for (let i = 0; i < themes.length; i++) {
        for (let j = i + 1; j < themes.length; j++) {
          const theme1 = themes[i];
          const theme2 = themes[j];
          
          // Skip if either theme is empty
          if (!theme1 || !theme2) continue;
          
          // Create a unique key for this theme pair (alphabetically ordered)
          const key = [theme1, theme2].sort().join('|||');
          
          if (relationshipMap.has(key)) {
            // Update existing relationship
            const rel = relationshipMap.get(key)!;
            rel.strength += 1;
            rel.storytellers.add(name);
          } else {
            // Create new relationship
            relationshipMap.set(key, {
              theme1: theme1,
              theme2: theme2,
              strength: 1,
              storytellers: new Set([name])
            });
          }
        }
      }
    });
    
    // Convert the map to an array of relationships
    const relationships: ThemeRelationship[] = [];
    
    // Find the maximum strength value for calculating significance
    let maxStrength = 0;
    relationshipMap.forEach(rel => {
      if (rel.strength > maxStrength) {
        maxStrength = rel.strength;
      }
    });
    
    // Use at least 3 as max strength if data is sparse
    maxStrength = Math.max(maxStrength, 3);
    
    // Create the final relationships array
    relationshipMap.forEach(rel => {
      // Split the key to get the themes
      const [sortedTheme1, sortedTheme2] = rel.theme1.localeCompare(rel.theme2) < 0 
        ? [rel.theme1, rel.theme2] 
        : [rel.theme2, rel.theme1];
      
      relationships.push({
        theme1: sortedTheme1,
        theme2: sortedTheme2,
        strength: rel.strength,
        storytellers: Array.from(rel.storytellers),
        significance: calculateSignificance(rel.strength, maxStrength)
      });
    });
    
    // Sort by strength (descending)
    return relationships.sort((a, b) => b.strength - a.strength);
  }, []);

  // Calculate theme statistics based on the relationships
  const calculateThemeStatistics = useCallback((relationships: ThemeRelationship[]) => {
    // Count unique themes
    const uniqueThemes = new Set<string>();
    relationships.forEach(rel => {
      uniqueThemes.add(rel.theme1);
      uniqueThemes.add(rel.theme2);
    });
    
    // Find strongest connection
    const strongestRel = relationships.length > 0 ? 
      [...relationships].sort((a, b) => b.strength - a.strength)[0] : 
      { theme1: 'N/A', theme2: 'N/A', strength: 0 };
    
    // Find most connected theme
    const themeConnections = new Map<string, number>();
    relationships.forEach(rel => {
      themeConnections.set(rel.theme1, (themeConnections.get(rel.theme1) || 0) + 1);
      themeConnections.set(rel.theme2, (themeConnections.get(rel.theme2) || 0) + 1);
    });
    
    let mostConnectedTheme = { theme: 'N/A', connections: 0 };
    themeConnections.forEach((connections, theme) => {
      if (connections > mostConnectedTheme.connections) {
        mostConnectedTheme = { theme, connections };
      }
    });
    
    setStatistics({
      uniqueThemeCount: uniqueThemes.size,
      relationshipCount: relationships.length,
      strongestRelationship: {
        theme1: strongestRel?.theme1 || '',
        theme2: strongestRel?.theme2 || '',
        strength: strongestRel?.strength || 0
      },
      mostConnectedTheme
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use hardcoded data instead of fetching CSV
        const storytellerData = getHardcodedData();
        console.log('Using hardcoded storyteller data:', storytellerData);
        
        if (storytellerData && storytellerData.length > 0) {
          const processedRelationships = processDataForTable(storytellerData);
          setRelationships(processedRelationships);
          calculateThemeStatistics(processedRelationships);
        } else {
          console.warn('Hardcoded data is empty, using fallback data');
          applyFallbackData();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error processing data:', error);
        applyFallbackData();
      }
    };
    
    const applyFallbackData = () => {
      console.log("Using fallback data for thematic table");
      const processedRelationships = processDataForTable(fallbackData);
      setRelationships(processedRelationships);
      calculateThemeStatistics(processedRelationships);
      setLoading(false);
    };

    fetchData();
  }, [processDataForTable, calculateThemeStatistics]);

  const requestSort = (key: keyof ThemeRelationship | 'storytellerCount') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedRelationships = React.useMemo(() => {
    let sortableItems = [...relationships];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'storytellerCount') {
          const aValue = a.storytellers.length;
          const bValue = b.storytellers.length;
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        } else if (sortConfig.key === 'theme1' || sortConfig.key === 'theme2') {
          const aValue = a[sortConfig.key].toLowerCase();
          const bValue = b[sortConfig.key].toLowerCase();
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (sortConfig.key === 'significance') {
          const significanceOrder = { high: 3, medium: 2, low: 1 };
          const aValue = significanceOrder[a[sortConfig.key]];
          const bValue = significanceOrder[b[sortConfig.key]];
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        } else {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          return sortConfig.direction === 'ascending'
            ? (aValue > bValue ? 1 : -1)
            : (bValue > aValue ? 1 : -1);
        }
      });
    }
    return sortableItems;
  }, [relationships, sortConfig]);
  
  const filteredRelationships = sortedRelationships.filter(
    relationship => 
      relationship.theme1.toLowerCase().includes(filterText.toLowerCase()) ||
      relationship.theme2.toLowerCase().includes(filterText.toLowerCase()) ||
      relationship.storytellers.some(storyteller => 
        storyteller.toLowerCase().includes(filterText.toLowerCase())
      )
  );

  const getSignificanceColor = (significance: 'high' | 'medium' | 'low') => {
    switch (significance) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-amber-700 mb-6">Thematic Relationships Analysis</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700"></div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 uppercase">Total Themes</h3>
              <p className="text-2xl font-bold text-amber-700">{statistics.uniqueThemeCount}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 uppercase">Total Connections</h3>
              <p className="text-2xl font-bold text-amber-700">{statistics.relationshipCount}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 uppercase">Strongest Connection</h3>
              <p className="text-lg font-bold text-amber-700">{statistics.strongestRelationship.theme1} ↔ {statistics.strongestRelationship.theme2} ({statistics.strongestRelationship.strength})</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 uppercase">Most Connected Theme</h3>
              <p className="text-lg font-bold text-amber-700">{statistics.mostConnectedTheme.theme} ({statistics.mostConnectedTheme.connections} connections)</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">Filter Results:</label>
            <input
              id="filter"
              type="text"
              placeholder="Search themes or storytellers..."
              className="w-full p-2 border border-gray-300 rounded"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('theme1')}
                  >
                    Theme 1
                    {sortConfig?.key === 'theme1' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('theme2')}
                  >
                    Theme 2
                    {sortConfig?.key === 'theme2' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                    onClick={() => requestSort('strength')}
                  >
                    Connection Strength
                    {sortConfig?.key === 'strength' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('significance')}
                  >
                    Significance
                    {sortConfig?.key === 'significance' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('storytellerCount')}
                  >
                    Storytellers
                    {sortConfig?.key === 'storytellerCount' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRelationships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      {filterText ? 'No results match your filter.' : 'No relationships found.'}
                    </td>
                  </tr>
                ) : (
                  filteredRelationships.map((relationship, index) => (
                    <tr key={`${relationship.theme1}-${relationship.theme2}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-normal">{relationship.theme1}</td>
                      <td className="px-6 py-4 whitespace-normal">{relationship.theme2}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="mr-2">{relationship.strength}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                relationship.significance === 'high' ? 'bg-green-500' : 
                                relationship.significance === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                              }`} 
                              style={{ width: `${Math.min((relationship.strength / 5) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSignificanceColor(relationship.significance)}`}>
                          {relationship.significance === 'high' ? 'Strong' : 
                           relationship.significance === 'medium' ? 'Moderate' : 'Weak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          {relationship.storytellers.map(storyteller => (
                            <span 
                              key={storyteller} 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {storyteller}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Found {filteredRelationships.length} thematic relationships</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThematicTable; 