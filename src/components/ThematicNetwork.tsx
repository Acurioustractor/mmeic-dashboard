import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import _ from 'lodash';
import { getHardcodedData } from './ThematicTable';

// Define types for nodes and links
interface ThemeNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  size: number;
  x?: number;
  y?: number;
}

interface ThemeLink {
  source: string | ThemeNode;
  target: string | ThemeNode;
  value: number;
}

interface StorytellerData {
  Name: string;
  Age?: string;
  Gender?: string;
  'Community Role'?: string;
  'Themes (from Media)': string;
  Quote?: string;
  'Sentiment Score'?: string;
}

const ThematicNetwork: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [selectedThemeDescription, setSelectedThemeDescription] = useState<string | null>(null);
  const [data, setData] = useState<StorytellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeQuotes, setThemeQuotes] = useState<Record<string, string[]>>({});
  const [storytellers, setStorytellers] = useState<Record<string, string[]>>({});
  
  // Theme descriptions - these would typically come from analysis of the CSV data
  const themeDescriptions: Record<string, string> = {
    "Cultural Sovereignty": "Emphasizes reclaiming and maintaining control over cultural practices, language, and traditions as a fundamental aspect of self-determination.",
    "Self-Determination": "Focuses on the community's ability to make decisions about their own future without external intervention.",
    "Healing": "Addresses the healing journey from historical and intergenerational trauma through cultural reconnection.",
    "Intergenerational Resilience": "Recognizes the strength passed down through generations despite historical challenges.",
    "Connection to Country": "Emphasizes the spiritual and physical relationship with traditional lands and waters.",
    "Environmental Stewardship": "Focuses on caring for land and sea through traditional ecological knowledge and practices.",
    "Justice Reinvestment": "Advocates for redirecting resources from punitive systems to community-led prevention and support.",
    "Holistic Wellbeing": "Views health as encompassing physical, spiritual, emotional, and community dimensions.",
    "Oyster Farming": "Represents both cultural practice and economic opportunity, connecting traditional food sources with contemporary livelihoods.",
    "Economic Justice": "Focuses on creating sustainable economic opportunities that benefit the entire community.",
    "Knowledge Transfer": "Emphasizes the importance of passing cultural knowledge, practices, and language to younger generations.",
    "Community-Led Infrastructure": "Highlights self-built housing and infrastructure as expressions of sovereignty.",
    "Challenges with Systems": "Addresses the barriers created by external systems, regulations, and bureaucracy.",
    "Language Revitalization": "Focuses on recovering and maintaining traditional language as core to cultural identity.",
    "Youth Engagement": "Emphasizes the importance of involving young people in cultural practices and decision-making.",
    "Ownership and Narrative Control": "Focuses on taking control of storytelling and representation to shape perceptions and outcomes.",
    "Economic Growth": "Emphasizes building sustainable economic opportunities and wealth for the community.",
    "Sustainability": "Focuses on creating systems and practices that can be maintained over time with minimal external support.",
    "Advocacy": "Involves speaking up for community rights and interests in various forums and contexts.",
    "Systemic Challenge": "Addresses the need to challenge and change systems that create barriers for Indigenous communities.",
    "Intergenerational Leadership": "Focuses on mentoring and preparing future generations for leadership roles.",
    "Cultural Preservation": "Emphasizes maintaining and protecting cultural practices, knowledge, and traditions.",
    "Aboriginal Sovereignty": "Recognizes the inherent rights of Aboriginal peoples to self-governance and determination.",
    "Intergenerational Knowledge": "Focuses on the transfer of knowledge, skills, and values between generations.",
    "Community Support": "Emphasizes the importance of community networks and mutual aid systems.",
    "Cultural Identity": "Focuses on the maintenance and strengthening of cultural identity in contemporary contexts.",
    "Sovereignty": "Recognizes the inherent right of Indigenous peoples to self-governance and determination.",
    "Cultural Adaptation": "Emphasizes the ability to adapt cultural practices to new contexts while maintaining core values.",
    "Resilience": "Focuses on the ability to withstand and recover from challenges and difficulties.",
    "Challenges with External Systems": "Addresses the barriers created by external systems, regulations, and bureaucracy.",
    "Intergenerational Wealth": "Focuses on building economic resources that can be passed down to future generations."
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use hardcoded data instead of trying to read from window.fs
        const parsedData = getHardcodedData();
        setData(parsedData);
        
        // Extract themes and quotes
        const allThemes: string[] = [];
        const themeQuotesMap: Record<string, string[]> = {};
        const themeStorytellersMap: Record<string, string[]> = {};
        
        parsedData.forEach((row: StorytellerData) => {
          if (row['Themes (from Media)'] && typeof row['Themes (from Media)'] === 'string') {
            // Handle both semicolon and comma separators
            let rowThemes: string[] = [];
            if (row['Themes (from Media)'].includes(';')) {
              rowThemes = row['Themes (from Media)'].split(';').map((theme: string) => theme.trim());
            } else {
              rowThemes = row['Themes (from Media)'].split(',').map((theme: string) => theme.trim());
            }
            
            allThemes.push(...rowThemes);
            
            // Map quotes to themes
            if (row.Quote) {
              rowThemes.forEach(theme => {
                if (!themeQuotesMap[theme]) {
                  themeQuotesMap[theme] = [];
                }
                themeQuotesMap[theme].push(`"${row.Quote}" - ${row.Name}`);
              });
            }
            
            // Map storytellers to themes
            rowThemes.forEach(theme => {
              if (!themeStorytellersMap[theme]) {
                themeStorytellersMap[theme] = [];
              }
              if (!themeStorytellersMap[theme].includes(row.Name)) {
                themeStorytellersMap[theme].push(row.Name);
              }
            });
          }
        });
        
        setThemeQuotes(themeQuotesMap);
        setStorytellers(themeStorytellersMap);
        createVisualization(allThemes);
        setLoading(false);
      } catch (error) {
        console.error('Error processing data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createVisualization = (allThemes: string[]) => {
    // Count theme occurrences
    const themeCounts: { [key: string]: number } = {};
    allThemes.forEach(theme => {
      if (theme && theme !== '') {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    });
    
    // Create nodes from themes
    const nodes: ThemeNode[] = Object.entries(themeCounts).map(([id, count], index) => ({
      id,
      group: Math.floor(index / 3) + 1, // Assign groups arbitrarily for visual differentiation
      size: Math.max(count * 5, 10), // Scale node size based on frequency
    }));
    
    // Create links between themes that appear together
    const themeRelationships: { [key: string]: { [key: string]: number } } = {};
    
    data.forEach(row => {
      if (row['Themes (from Media)'] && typeof row['Themes (from Media)'] === 'string') {
        const rowThemes = row['Themes (from Media)'].split(',').map(theme => theme.trim());
        
        // For each pair of themes in this row, increment their relationship strength
        for (let i = 0; i < rowThemes.length; i++) {
          for (let j = i + 1; j < rowThemes.length; j++) {
            const theme1 = rowThemes[i];
            const theme2 = rowThemes[j];
            
            if (!themeRelationships[theme1]) {
              themeRelationships[theme1] = {};
            }
            if (!themeRelationships[theme2]) {
              themeRelationships[theme2] = {};
            }
            
            themeRelationships[theme1][theme2] = (themeRelationships[theme1][theme2] || 0) + 1;
            themeRelationships[theme2][theme1] = (themeRelationships[theme2][theme1] || 0) + 1;
          }
        }
      }
    });
    
    // Convert relationships to links
    const links: ThemeLink[] = [];
    Object.entries(themeRelationships).forEach(([source, targets]) => {
      Object.entries(targets).forEach(([target, strength]) => {
        // Only add each link once (since we've double-counted in the loop above)
        if (source < target) {
          links.push({
            source,
            target,
            value: Math.min(strength + 3, 10), // Scale for visibility, cap at 10
          });
        }
      });
    });

    // Clear previous visualization
    d3.select("#network-container").html("");

    // Set up SVG with responsive dimensions
    const container = document.getElementById("network-container");
    if (!container) return;
    
    const width = container.clientWidth;
    const height = 600;

    const svg = d3.select("#network-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create a simulation with forces
    const simulation = d3.forceSimulation<ThemeNode>(nodes)
      .force("link", d3.forceLink<ThemeNode, ThemeLink>(links)
        .id(d => d.id)
        .distance(d => 100 / (d.value || 1)))
      .force("charge", d3.forceManyBody()
        .strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<ThemeNode>().radius(d => (d.size || 10) + 10));

    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", d => d.value)
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 0.6);

    // Add nodes
    const node = svg.append("g")
      .selectAll<SVGCircleElement, ThemeNode>("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: ThemeNode) => d.size)
      .attr("fill", (d: ThemeNode) => d3.schemeCategory10[d.group % 10])
      .call(drag(simulation) as any)
      .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: ThemeNode) {
        // Highlight connected nodes
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
        link.attr("stroke", function(l: any) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return "#000";
          } else {
            return "#aaa";
          }
        })
        .attr("stroke-opacity", function(l: any) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return 1;
          } else {
            return 0.2;
          }
        })
        .attr("stroke-width", function(l: any) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return l.value * 1.5;
          } else {
            return l.value;
          }
        });
        
        // Set active theme if not already selected
        if (!activeTheme) {
          setSelectedThemeDescription(themeDescriptions[d.id] || "No description available");
        }
      })
      .on("mouseout", function(this: SVGCircleElement, event: MouseEvent, d: ThemeNode) {
        // Reset if not clicked
        if (activeTheme !== d.id) {
          d3.select(this).attr("stroke", null);
          link.attr("stroke", "#aaa")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (l: any) => l.value);
        }
        
        // Reset description if not clicked
        if (!activeTheme) {
          setSelectedThemeDescription(null);
        }
      })
      .on("click", function(this: SVGCircleElement, event: MouseEvent, d: ThemeNode) {
        event.stopPropagation();
        
        // If already active, deactivate
        if (activeTheme === d.id) {
          setActiveTheme(null);
          setSelectedThemeDescription(null);
          
          // Reset all styles
          node.attr("stroke", null);
          link.attr("stroke", "#aaa")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (l: any) => l.value);
        } else {
          // Set as active
          setActiveTheme(d.id);
          setSelectedThemeDescription(themeDescriptions[d.id] || "No description available");
          
          // Reset all nodes first
          node.attr("stroke", null);
          
          // Then highlight this node
          d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
          
          // Highlight connected links
          link.attr("stroke", function(l: any) {
            if (l.source.id === d.id || l.target.id === d.id) {
              return "#000";
            } else {
              return "#aaa";
            }
          })
          .attr("stroke-opacity", function(l: any) {
            if (l.source.id === d.id || l.target.id === d.id) {
              return 1;
            } else {
              return 0.2;
            }
          })
          .attr("stroke-width", function(l: any) {
            if (l.source.id === d.id || l.target.id === d.id) {
              return l.value * 1.5;
            } else {
              return l.value;
            }
          });
        }
      });

    // Add labels
    const label = svg.append("g")
      .selectAll<SVGTextElement, ThemeNode>("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d: ThemeNode) => d.id)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4)
      .style("pointer-events", "none");

    // Update positions during simulation
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as ThemeNode).x ?? 0)
        .attr("y1", (d: any) => (d.source as ThemeNode).y ?? 0)
        .attr("x2", (d: any) => (d.target as ThemeNode).x ?? 0)
        .attr("y2", (d: any) => (d.target as ThemeNode).y ?? 0);

      node
        .attr("cx", (d: ThemeNode) => d.x ?? 0)
        .attr("cy", (d: ThemeNode) => d.y ?? 0);

      label
        .attr("x", (d: ThemeNode) => d.x ?? 0)
        .attr("y", (d: ThemeNode) => d.y ?? 0);
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<ThemeNode, undefined>) {
      function dragstarted(event: any, d: ThemeNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event: any, d: ThemeNode) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event: any, d: ThemeNode) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      return d3.drag<SVGCircleElement, ThemeNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Handle click on SVG background to deselect
    svg.on("click", () => {
      setActiveTheme(null);
      setSelectedThemeDescription(null);
      
      // Reset all styles
      node.attr("stroke", null);
      link.attr("stroke", "#aaa")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (l: any) => l.value);
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-amber-700 mb-6">Thematic Network Analysis</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Loading thematic network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div id="network-container" className="border rounded-lg overflow-hidden h-[600px]"></div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Hover over nodes to see connections. Click to lock selection.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            {activeTheme ? (
              <>
                <h3 className="text-xl font-semibold text-amber-700 mb-2">{activeTheme}</h3>
                {selectedThemeDescription && (
                  <p className="text-gray-700 mb-4">{selectedThemeDescription}</p>
                )}
                <div className="mt-4">
                  <h4 className="font-medium text-amber-700 mb-2">Related Quotes:</h4>
                  <div className="max-h-80 overflow-y-auto">
                    {themeQuotes[activeTheme] && themeQuotes[activeTheme].length > 0 ? (
                      themeQuotes[activeTheme].map((quote, idx) => (
                        <div key={idx} className="bg-white p-3 rounded mb-2 shadow-sm">
                          <p className="text-gray-700 italic text-sm">{quote}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No quotes available for this theme.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-600">
                Click on a theme node to see details, related quotes, and stronger connections.
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 text-gray-700">
        <h3 className="text-lg font-semibold text-amber-700 mb-2">Understanding the Network</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Larger nodes represent more frequently mentioned themes</li>
          <li>Thicker connecting lines indicate stronger relationships between themes</li>
          <li>Nodes are colored by theme groups</li>
          <li>The network shows how cultural and economic themes interconnect in storytellers' narratives</li>
          <li>Click a theme to explore related quotes and insights</li>
        </ul>
      </div>
    </div>
  );
};

export default ThematicNetwork; 