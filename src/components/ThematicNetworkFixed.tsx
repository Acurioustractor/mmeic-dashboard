import React, { useState, useRef, useEffect, useCallback } from 'react';
import ThematicTable, { normalizeTheme } from './ThematicTable';
import { getHardcodedData } from './ThematicTable';

// Define types for theme data
interface ThemeNode {
  id: string;
  group: number;
  groupName: string;
  value: number;
  description: string;
  x?: number;
  y?: number;
}

interface ThemeLink {
  source: string;
  target: string;
  value: number;
  storytellers: string[];
}

/**
 * Interactive visualization with theme filtering and analysis capabilities
 * This is a React-based implementation without D3 force simulation
 */
const ThematicNetworkFixed: React.FC = () => {
  // Track which tab is active
  const [activeTab, setActiveTab] = useState<'network' | 'table'>('network');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);
  const [themeDetails, setThemeDetails] = useState<{
    name: string;
    connections: number;
    storytellers: string[];
    description: string;
  } | null>(null);
  
  // State for tracking dragged node position
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
  
  // State for theme data from CSV
  const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);
  const [themeLinks, setThemeLinks] = useState<ThemeLink[]>([]);

  // Refs for container dimensions
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Theme group definitions for categorization
  const themeGroups = {
    "Cultural": { group: 1, groupName: "cultural", description: "Themes related to culture, identity, and sovereignty" },
    "Environmental": { group: 2, groupName: "environmental", description: "Themes related to country, environment, and sustainability" },
    "Knowledge": { group: 3, groupName: "knowledge", description: "Themes related to education, learning, and traditional knowledge" },
    "Economic": { group: 4, groupName: "economic", description: "Themes related to economic development and prosperity" },
    "Community": { group: 5, groupName: "community", description: "Themes related to wellbeing and community support" },
    "Justice": { group: 6, groupName: "justice", description: "Themes related to justice and fairness" }
  };
  
  // Function to determine which group a theme belongs to
  const getThemeGroup = (theme: string) => {
    const lowerTheme = theme.toLowerCase();
    
    // Simplify categorization to prevent fragmentation into too many small categories
    if (lowerTheme.includes('cultural') || lowerTheme.includes('culture') || 
        lowerTheme.includes('identity') || lowerTheme.includes('sovereignty') || 
        lowerTheme.includes('heritage') || lowerTheme.includes('ancestral') || 
        lowerTheme.includes('traditional') || lowerTheme.includes('responsibility')) {
      return themeGroups.Cultural;
    }
    if (lowerTheme.includes('country') || lowerTheme.includes('environment') || 
        lowerTheme.includes('stewardship') || lowerTheme.includes('sustainability') || 
        lowerTheme.includes('conservation') || lowerTheme.includes('nature') || 
        lowerTheme.includes('land')) {
      return themeGroups.Environmental;
    }
    if (lowerTheme.includes('knowledge') || lowerTheme.includes('education') || 
        lowerTheme.includes('learning') || lowerTheme.includes('language') || 
        lowerTheme.includes('research') || lowerTheme.includes('intergenerational') || 
        lowerTheme.includes('transfer')) {
      return themeGroups.Knowledge;
    }
    if (lowerTheme.includes('economic') || lowerTheme.includes('development') || 
        lowerTheme.includes('growth') || lowerTheme.includes('infrastructure') || 
        lowerTheme.includes('funding') || lowerTheme.includes('housing')) {
      return themeGroups.Economic;
    }
    if (lowerTheme.includes('wellbeing') || lowerTheme.includes('community') || 
        lowerTheme.includes('connection') || lowerTheme.includes('engagement') || 
        lowerTheme.includes('bonding') || lowerTheme.includes('family') || 
        lowerTheme.includes('support')) {
      return themeGroups.Community;
    }
    if (lowerTheme.includes('justice') || lowerTheme.includes('healing') || 
        lowerTheme.includes('empowerment') || lowerTheme.includes('advocacy') || 
        lowerTheme.includes('legal') || lowerTheme.includes('incarceration') || 
        lowerTheme.includes('trauma') || lowerTheme.includes('reform')) {
      return themeGroups.Justice;
    }
    
    // Default to Cultural if we can't determine
    return themeGroups.Cultural;
  };
  
  // Process CSV data to generate theme nodes and links
  useEffect(() => {
    // Get the storyteller data
    const storytellerData = getHardcodedData();
    
    // Process the data to extract themes and relationships
    const processData = () => {
      // First, identify all unique themes
      const allThemes = new Set<string>();
      const themeMentions = new Map<string, number>();
      const themeDescriptions = new Map<string, string>();
      
      // For each storyteller, extract and normalize their themes
      storytellerData.forEach((storyteller) => {
        if (!storyteller['Themes (from Media)']) return;
        
        // Extract themes (handle both ; and , as separators)
        let themesRaw = storyteller['Themes (from Media)'].split(';');
        if (themesRaw.length <= 1 && storyteller['Themes (from Media)'].includes(',')) {
          themesRaw = storyteller['Themes (from Media)'].split(',');
        }
        
        // Normalize the themes
        const themes = themesRaw
          .map((theme: string) => normalizeTheme(theme))
          .filter((theme: string) => theme.length > 0);
        
        // Add to set of all themes
        themes.forEach((theme: string) => {
          allThemes.add(theme);
          
          // Count mentions of each theme
          themeMentions.set(theme, (themeMentions.get(theme) || 0) + 1);
          
          // Set a simple description if none exists
          if (!themeDescriptions.has(theme)) {
            themeDescriptions.set(theme, `Theme related to ${theme} mentioned by storytellers`);
          }
        });
      });
      
      // Create theme nodes
      const nodes: ThemeNode[] = Array.from(allThemes).map(theme => {
        const themeGroup = getThemeGroup(theme);
        return {
          id: theme,
          group: themeGroup.group,
          groupName: themeGroup.groupName,
          value: themeMentions.get(theme) || 1,
          description: themeDescriptions.get(theme) || `Theme: ${theme}`
        };
      });
      
      // Create links between themes mentioned by the same storytellers
      const links: ThemeLink[] = [];
      const relationshipMap = new Map<string, {
        source: string;
        target: string;
        value: number;
        storytellers: Set<string>;
      }>();
      
      // Process each storyteller to find relationships between themes
      storytellerData.forEach((storyteller) => {
        const name = storyteller.Name?.trim() || 'Unknown';
        
        if (!storyteller['Themes (from Media)']) return;
        
        // Extract themes (handle both ; and , as separators)
        let themesRaw = storyteller['Themes (from Media)'].split(';');
        if (themesRaw.length <= 1 && storyteller['Themes (from Media)'].includes(',')) {
          themesRaw = storyteller['Themes (from Media)'].split(',');
        }
        
        // Normalize the themes
        const themes = themesRaw
          .map((theme: string) => normalizeTheme(theme))
          .filter((theme: string) => theme.length > 0);
        
        // Create connections between each pair of themes
        for (let i = 0; i < themes.length; i++) {
          for (let j = i + 1; j < themes.length; j++) {
            const source = themes[i];
            const target = themes[j];
            
            // Skip if empty
            if (!source || !target) continue;
            
            // Create a unique key for this relationship
            const key = [source, target].sort().join('|||');
            
            if (relationshipMap.has(key)) {
              // Update existing relationship
              const rel = relationshipMap.get(key)!;
              rel.value += 1;
              rel.storytellers.add(name);
            } else {
              // Create new relationship
              relationshipMap.set(key, {
                source,
                target,
                value: 1,
                storytellers: new Set([name])
              });
            }
          }
        }
      });
      
      // Convert the map to links array
      relationshipMap.forEach(rel => {
        links.push({
          source: rel.source,
          target: rel.target,
          value: rel.value,
          storytellers: Array.from(rel.storytellers)
        });
      });
      
      // Update state with the generated data
      setThemeNodes(nodes);
      setThemeLinks(links);
    };
    
    processData();
  }, []);
  
  // Color mapping for theme types
  const colorMap = {
    cultural: "#e15759",  // red
    environmental: "#59a14f",  // green
    knowledge: "#4e79a7", // blue
    economic: "#f28e2b",   // orange
    community: "#b07aa1", // purple
    justice: "#ff9da7"   // pink
  };
  
  // Group labels for the legend
  const groupLabels = [
    { name: "cultural", label: "Cultural", color: colorMap.cultural },
    { name: "environmental", label: "Environmental", color: colorMap.environmental },
    { name: "knowledge", label: "Knowledge", color: colorMap.knowledge },
    { name: "economic", label: "Economic", color: colorMap.economic },
    { name: "community", label: "Community", color: colorMap.community },
    { name: "justice", label: "Justice", color: colorMap.justice }
  ];
  
  // Initialize positions in a circular layout
  useEffect(() => {
    initializeNodePositions();
  }, [themeNodes]);

  // Create a function to initialize node positions in a circular layout
  const initializeNodePositions = () => {
    if (themeNodes.length === 0) return;
    
    const width = 600;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate new positions for nodes
    const newPositions: Record<string, { x: number, y: number }> = {};

    // Group nodes by category for organized layout
    const groupedNodes: Record<string, ThemeNode[]> = {};
    
    themeNodes.forEach(node => {
      if (!groupedNodes[node.groupName]) {
        groupedNodes[node.groupName] = [];
      }
      groupedNodes[node.groupName].push(node);
    });
    
    // Position most connected nodes closer to center
    // Sort nodes by connection count
    let allNodesSorted = [...themeNodes].sort((a, b) => {
      const aConnections = themeLinks.filter(link => link.source === a.id || link.target === a.id).length;
      const bConnections = themeLinks.filter(link => link.source === b.id || link.target === b.id).length;
      return bConnections - aConnections;
    });
    
    // Place the most connected node at center
    if (allNodesSorted.length > 0) {
      const centerNode = allNodesSorted[0];
      newPositions[centerNode.id] = { x: centerX, y: centerY };
      allNodesSorted = allNodesSorted.slice(1);
    }
    
    // Place other nodes in rings around center with nodes of same group clustered together
    let currentAngle = 0;
    const angleStep = (2 * Math.PI) / allNodesSorted.length;
    const groupAngles: Record<string, number> = {};
    const innerRadius = 120;
    const outerRadius = 200;
    
    // Place remaining nodes in a spiral pattern, grouped by category
    Object.keys(groupedNodes).forEach(groupName => {
      // Skip the central node's group if already placed
      const nodesInGroup = groupedNodes[groupName].filter(
        node => !newPositions[node.id]
      );
      
      if (nodesInGroup.length === 0) return;
      
      // Each group starts at a different angle
      if (!groupAngles[groupName]) {
        groupAngles[groupName] = currentAngle;
        currentAngle += Math.PI / 3; // Divide the circle into 6 sectors
      }
      
      // Place nodes in this group in a cluster
      const groupAngleStep = Math.PI / 6 / (nodesInGroup.length || 1);
      const baseAngle = groupAngles[groupName];
      
      nodesInGroup.forEach((node, i) => {
        // Skip if already positioned
        if (newPositions[node.id]) return;
        
        // Calculate position in a spiral
        const angle = baseAngle + i * groupAngleStep;
        const radius = innerRadius + (i / nodesInGroup.length) * (outerRadius - innerRadius);
        
        newPositions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    });
    
    // Add positions for any remaining nodes
    allNodesSorted.forEach(node => {
      if (!newPositions[node.id]) {
        newPositions[node.id] = {
          x: centerX + outerRadius * Math.cos(currentAngle),
          y: centerY + outerRadius * Math.sin(currentAngle)
        };
        currentAngle += angleStep;
      }
    });
    
    setPositions(newPositions);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('Error attempting to enable fullscreen:', err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error('Error attempting to exit fullscreen:', err));
      }
    }
  };

  // Add a search state
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (tab: 'network' | 'table') => {
    setActiveTab(tab);
    setSelectedTheme(null);
    setHighlightedGroup(null);
    setThemeDetails(null);
    setSearchTerm('');
    setHoveredNode(null);
  };
  
  // Handle theme selection
  const handleThemeClick = (themeId: string) => {
    // If already selected, deselect
    if (selectedTheme === themeId) {
      setSelectedTheme(null);
      setThemeDetails(null);
    } else {
      setSelectedTheme(themeId);
      
      // Find this theme's connections
      const node = themeNodes.find(n => n.id === themeId);
      const connections = themeLinks.filter(link => 
        link.source === themeId || link.target === themeId
      );
      
      // Get unique storytellers from all connections
      const allStorytellers = connections.reduce((acc, curr) => {
        return [...acc, ...curr.storytellers];
      }, [] as string[]);
      const uniqueStorytellers = [...new Set(allStorytellers)];
      
      // Set theme details for display
      setThemeDetails({
        name: themeId,
        connections: connections.length,
        storytellers: uniqueStorytellers,
        description: node?.description || ''
      });
    }
  };
  
  // Handle group filter toggle
  const handleGroupToggle = (groupName: string) => {
    if (highlightedGroup === groupName) {
      setHighlightedGroup(null);
    } else {
      setHighlightedGroup(groupName);
    }
    
    // Clear selected theme when changing group filters
    setSelectedTheme(null);
    setThemeDetails(null);
  };
  
  // Handle mouse events for node dragging
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    setDraggedNode(nodeId);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && svgRef.current) {
      // Get SVG coordinates
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      
      // Update position
      setPositions(prev => ({
        ...prev,
        [draggedNode]: { x, y }
      }));
    }
  };
  
  const handleMouseUp = () => {
    setDraggedNode(null);
  };
  
  // Filter nodes based on user selections and search term
  const filteredNodes = themeNodes.filter(node => {
    // First filter by search term if present
    if (searchTerm && !node.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // If we have a highlighted group, filter by it
    if (highlightedGroup && node.groupName !== highlightedGroup) {
      return false;
    }
    
    // If we have a selected theme, show it and its connections
    if (selectedTheme) {
      // Always show the selected node
      if (node.id === selectedTheme) return true;
      
      // Check if this node is connected to the selected node
      return themeLinks.some(link => 
        (link.source === selectedTheme && link.target === node.id) ||
        (link.target === selectedTheme && link.source === node.id)
      );
    }
    
    // Default case, show all nodes that match group filter and search
    return true;
  });
  
  const filteredLinks = themeLinks.filter(link => {
    // If no nodes, no links
    if (filteredNodes.length === 0) return false;
    
    // Get connected nodes
    const sourceNode = themeNodes.find(n => n.id === link.source);
    const targetNode = themeNodes.find(n => n.id === link.target);
    
    // Skip links for nodes that don't exist
    if (!sourceNode || !targetNode) return false;
    
    // If group filter is active, both nodes must match the filter
    if (highlightedGroup) {
      if (sourceNode.groupName !== highlightedGroup || targetNode.groupName !== highlightedGroup) {
        return false;
      }
    }
    
    // If theme is selected, link must connect to that theme
    if (selectedTheme) {
      return link.source === selectedTheme || link.target === selectedTheme;
    }
    
    // Default case, keep link if both nodes are visible
    return filteredNodes.some(n => n.id === link.source) && 
           filteredNodes.some(n => n.id === link.target);
  });
  
  // Check if link is connected to selected node
  const isConnectedToSelection = (link: ThemeLink) => {
    if (!selectedTheme) return true;
    return link.source === selectedTheme || link.target === selectedTheme;
  };
  
  // Check if a node is connected to the selected node
  const isNodeConnectedToSelection = (nodeId: string) => {
    if (!selectedTheme) return true;
    if (nodeId === selectedTheme) return true;
    
    return themeLinks.some(link => 
      (link.source === selectedTheme && link.target === nodeId) ||
      (link.target === selectedTheme && link.source === nodeId)
    );
  };
  
  // Helper to get node circle size based on value
  const getNodeSize = (node: ThemeNode) => {
    const baseSize = 10;
    const valueScale = 0.8;
    return baseSize + node.value * valueScale;
  };

  // Add a state for node tooltips
  const [hoverLink, setHoverLink] = useState<ThemeLink | null>(null);
  const [hoverNodeDetails, setHoverNodeDetails] = useState<{
    id: string;
    x: number;
    y: number;
    connections: number;
    group: string;
  } | null>(null);

  // Helper function to get node connections count
  const getNodeConnectionsCount = (nodeId: string): number => {
    return themeLinks.filter(link => 
      link.source === nodeId || 
      link.target === nodeId
    ).length;
  };

  // Helper function to get connected themes for a node
  const getConnectedThemes = (nodeId: string): string[] => {
    const connectedThemes = new Set<string>();
    themeLinks.forEach(link => {
      if (link.source === nodeId) {
        connectedThemes.add(link.target);
      } else if (link.target === nodeId) {
        connectedThemes.add(link.source);
      }
    });
    return Array.from(connectedThemes);
  };

  // Handle mouse enter for node tooltip
  const handleNodeMouseEnter = (node: ThemeNode, x: number, y: number) => {
    setHoveredNode(node.id);
    setHoverNodeDetails({
      id: node.id,
      x,
      y,
      connections: getNodeConnectionsCount(node.id),
      group: groupLabels.find(g => g.name === node.groupName)?.label || node.groupName
    });
  };

  // Handle mouse leave for node tooltip
  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    setHoverNodeDetails(null);
  };

  return (
    <div className={`relative bg-white p-6 rounded-lg shadow-md ${isFullscreen ? 'fullscreen-container' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-700">Thematic Relationships</h2>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'network' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => handleTabChange('network')}
            >
              Network View
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'table' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => handleTabChange('table')}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control panel */}
          <div className="lg:col-span-1 lg:pr-4">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-semibold text-lg text-amber-700 mb-3">Theme Filters</h3>
              
              <div className="mb-4">
                <label htmlFor="themeSearch" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Themes:
                </label>
                <input
                  type="text"
                  id="themeSearch"
                  className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter keyword..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Clear other filters when searching
                    if (e.target.value && selectedTheme) {
                      setSelectedTheme(null);
                      setThemeDetails(null);
                    }
                  }}
                />
                {searchTerm && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Showing:</span> {filteredNodes.length} themes
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-2 text-amber-600 hover:text-amber-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Filter by Category:</div>
                <div className="grid grid-cols-2 gap-2">
                  {groupLabels.map(group => (
                    <button 
                      key={group.name}
                      className={`px-3 py-2 rounded text-sm flex items-center justify-center transition ${
                        highlightedGroup === group.name 
                          ? 'bg-amber-100 border-amber-600 border shadow-sm' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => handleGroupToggle(group.name)}
                    >
                      <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: group.color }}></span>
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <button 
                  className="w-full py-2 px-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition flex items-center justify-center"
                  onClick={() => {
                    setSelectedTheme(null);
                    setHighlightedGroup(null);
                    setThemeDetails(null);
                    setSearchTerm('');
                    setHoveredNode(null);
                    initializeNodePositions();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Visualization
                </button>
              </div>
              
              {themeDetails && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-bold text-amber-800 text-lg mb-2">{themeDetails.name}</h4>
                  <p className="text-sm mb-3">{themeDetails.description}</p>
                  <div className="text-sm mb-1"><span className="font-medium">Connections:</span> {themeDetails.connections}</div>
                  <div className="text-sm mb-3">
                    <span className="font-medium">Mentioned by:</span> 
                    <div className="mt-1 flex flex-wrap gap-1">
                      {themeDetails.storytellers.map(storyteller => (
                        <span 
                          key={storyteller} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {storyteller}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="mt-1 bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition"
                    onClick={() => handleThemeClick(themeDetails.name)}
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-amber-700 mb-2">Network Legend</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-gray-800 rounded-full mr-2"></div>
                  Thicker lines = stronger relationships
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 border-2 border-gray-800 rounded-full mr-2"></div>
                  Selected theme
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 border border-dotted border-gray-500 rounded-full mr-2"></div>
                  Related themes
                </li>
                <li>
                  <div className="mt-1 mb-2 font-medium">Theme Categories:</div>
                  <div className="grid grid-cols-1 gap-1">
                    {groupLabels.map(group => (
                      <div key={group.name} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: group.color }}></div>
                        {group.label}: {themeNodes.filter(node => node.groupName === group.name).length} themes
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
              <div className="mt-4 text-xs text-gray-500">
                <div>• Click on nodes to see relationships</div>
                <div>• Drag nodes to rearrange network</div>
                <div>• Use Reset button to restore layout</div>
              </div>
            </div>
          </div>
          
          {/* Visualization panel */}
          <div 
            ref={containerRef}
            className="lg:col-span-3 visualization-container bg-gray-50 rounded-lg overflow-hidden"
          >
            <svg 
              ref={svgRef}
              width="100%" 
              height="600"
              viewBox="0 0 600 500"
              preserveAspectRatio="xMidYMid meet"
              className="bg-gray-50"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                handleMouseUp();
                handleNodeMouseLeave();
                setHoverLink(null);
              }}
            >
              {/* Draw links */}
              {filteredLinks.map((link) => {
                // Get positions for source and target
                const sourcePos = positions[link.source];
                const targetPos = positions[link.target];
                
                if (!sourcePos || !targetPos) return null;
                
                // Determine opacity based on selection
                const opacity = selectedTheme 
                  ? isConnectedToSelection(link) ? 0.7 : 0.2 
                  : hoveredNode
                    ? (link.source === hoveredNode || link.target === hoveredNode) ? 0.8 : 0.3
                    : 0.6;
                
                // Determine stroke color based on selection
                const stroke = selectedTheme 
                  ? isConnectedToSelection(link) ? "#666" : "#ccc" 
                  : hoveredNode
                    ? (link.source === hoveredNode || link.target === hoveredNode) ? "#666" : "#ccc"
                    : "#999";
                
                return (
                  <line 
                    key={`${link.source}-${link.target}`}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={stroke}
                    strokeWidth={Math.sqrt(link.value) * 1.5}
                    strokeOpacity={opacity}
                    onMouseEnter={() => setHoverLink(link)}
                    onMouseLeave={() => setHoverLink(null)}
                  />
                );
              })}
              
              {/* Draw nodes with improved tooltip and hover effects */}
              {filteredNodes.map((node) => {
                const pos = positions[node.id];
                if (!pos) return null;
                
                const nodeColor = colorMap[node.groupName as keyof typeof colorMap];
                
                // Determine opacity based on selection/hover
                const isSelected = selectedTheme === node.id;
                const isHovered = hoveredNode === node.id;
                const isConnected = isNodeConnectedToSelection(node.id);
                
                const opacity = selectedTheme
                  ? isConnected ? 1 : 0.4
                  : isHovered ? 1 : 0.9;
                
                // Determine stroke based on selection/hover
                const strokeColor = isSelected ? "#333" : isHovered ? "#666" : "#fff";
                const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1.5;
                
                // Determine node size with emphasis for selection/hover
                const baseSize = getNodeSize(node);
                const nodeSize = isSelected 
                  ? baseSize * 1.2 
                  : isHovered 
                    ? baseSize * 1.1 
                    : baseSize;
                
                // Determine if this node has many connections
                const connectionsCount = getNodeConnectionsCount(node.id);
                const isHighlyConnected = connectionsCount > 3;
                
                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
                    onClick={() => handleThemeClick(node.id)}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onMouseEnter={() => handleNodeMouseEnter(node, pos.x, pos.y)}
                    onMouseLeave={handleNodeMouseLeave}
                  >
                    {/* Halo effect for hovered/selected nodes */}
                    {(isHovered || isSelected) && (
                      <circle
                        r={nodeSize + 4}
                        fill={nodeColor}
                        opacity={0.2}
                      />
                    )}
                    
                    {/* Highlight for highly connected nodes */}
                    {isHighlyConnected && !isHovered && !isSelected && (
                      <circle
                        r={nodeSize + 2}
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth={1}
                        strokeDasharray="2,2"
                        opacity={0.7}
                      />
                    )}
                    
                    {/* Main node circle */}
                    <circle
                      r={nodeSize}
                      fill={nodeColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                    />
                    
                    {/* Node label - with background for better readability */}
                    <text
                      dy={-nodeSize - 5}
                      textAnchor="middle"
                      fontSize={isSelected ? 14 : isHovered ? 13 : 12}
                      fontWeight={isSelected || isHovered ? "bold" : "normal"}
                      fill="#333"
                      style={{
                        textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white',
                        pointerEvents: 'none'
                      }}
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
              
              {/* Enhanced tooltips for links and nodes */}
              {hoverLink && (
                <foreignObject
                  x={Math.min(
                    positions[hoverLink.source]?.x || 0, 
                    positions[hoverLink.target]?.x || 0
                  ) + 
                  Math.abs(
                    (positions[hoverLink.source]?.x || 0) - 
                    (positions[hoverLink.target]?.x || 0)
                  ) / 2 - 100}
                  y={Math.min(
                    positions[hoverLink.source]?.y || 0, 
                    positions[hoverLink.target]?.y || 0
                  ) + 
                  Math.abs(
                    (positions[hoverLink.source]?.y || 0) - 
                    (positions[hoverLink.target]?.y || 0)
                  ) / 2 - 30}
                  width="200"
                  height="120"
                >
                  <div className="bg-white p-3 rounded-md shadow-md text-xs border border-gray-200">
                    <div className="font-bold text-amber-800 text-sm mb-1">Relationship</div>
                    <div className="font-semibold mb-1">{hoverLink.source} ↔ {hoverLink.target}</div>
                    <div className="mb-1">Strength: 
                      <span className="font-medium ml-1">
                        {hoverLink.value === 1 ? 'Weak' : 
                         hoverLink.value === 2 ? 'Moderate' : 'Strong'} 
                        ({hoverLink.value})
                      </span>
                    </div>
                    <div className="mb-1">Mentioned by:</div>
                    <div className="flex flex-wrap gap-1">
                      {hoverLink.storytellers.map(storyteller => (
                        <span 
                          key={storyteller} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {storyteller}
                        </span>
                      ))}
                    </div>
                  </div>
                </foreignObject>
              )}
              
              {/* Tooltip for hovered nodes */}
              {hoverNodeDetails && !selectedTheme && (
                <foreignObject
                  x={hoverNodeDetails.x - 100}
                  y={hoverNodeDetails.y - 120}
                  width="200"
                  height="110"
                >
                  <div className="bg-white p-3 rounded-md shadow-md text-xs border border-gray-200">
                    <div className="font-bold text-amber-800 text-sm mb-1">{hoverNodeDetails.id}</div>
                    <div className="mb-1">
                      <span className="font-medium">Category:</span> {hoverNodeDetails.group}
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">Connections:</span> {hoverNodeDetails.connections}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Click to explore relationships</div>
                  </div>
                </foreignObject>
              )}
            </svg>
          </div>
        </div>
      ) : (
        <ThematicTable />
      )}
    </div>
  );
};

export default ThematicNetworkFixed; 