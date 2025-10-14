import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, ZoomOut, Maximize2, Home, Info, MessageCircle,
  User, Users, Heart, Calendar, MapPin, Briefcase
} from 'lucide-react';
import { NotionButton } from '../../../common/NotionUI';
import GoogleMapView from '../../../common/GoogleMapView';
import { useFamily } from '../../../../contexts/FamilyContext';
import { db } from '../../../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { calculateGenerations, getGenerationStats } from '../../../../utils/calculateGenerations';
import NewClassicTreeView from './NewClassicTreeView';
import { useNavigate } from 'react-router-dom';

const FamilyTreeVisualization = ({ 
  treeData, 
  viewMode, 
  onMemberSelect, 
  selectedMember,
  onAskAllie,
  onViewProfile 
}) => {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [hoveredMember, setHoveredMember] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of USA
  const [showGoogleMap, setShowGoogleMap] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const { familyId } = useFamily();

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: Math.max(height, 600) });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Hide map when switching to non-geographic views
    if (mapContainerRef.current && viewMode !== 'geographic') {
      mapContainerRef.current.style.display = 'none';
    }
    
    // Hide table when switching to non-table views
    const tableContainer = containerRef.current?.querySelector('.table-view-container');
    if (tableContainer && viewMode !== 'table') {
      tableContainer.style.display = 'none';
    }
    
    // Show SVG for non-geographic and non-table views
    if (svgRef.current && viewMode !== 'geographic' && viewMode !== 'table') {
      svgRef.current.style.display = 'block';
    }

    if (!treeData || !treeData.members || treeData.members.length === 0) {
      renderEmptyState();
      return;
    }

    switch (viewMode) {
      case 'classic':
        // Classic tree is now handled by NewClassicTreeView component
        break;
      case 'graph':
        renderKnowledgeGraph();
        break;
      case 'timeline':
        renderTimelineView();
        break;
      case 'geographic':
        renderGeographicView();
        break;
      case 'constellation':
        renderConstellationView();
        break;
      case 'table':
        renderTableView();
        break;
      default:
        // Classic tree is now handled by NewClassicTreeView component
        break;
    }
  }, [treeData, viewMode, dimensions, selectedMember]);

  const renderEmptyState = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -20)
      .attr('class', 'text-2xl font-bold fill-gray-400')
      .text('Start Your Family Story');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .attr('class', 'text-sm fill-gray-400')
      .text('Add your first family member to begin');
  };

  const renderLargeFamilyView = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', 'translate(50, 50)');

    // Group by generation if available
    const generations = {};
    let maxGen = 0;
    
    treeData.members.forEach(member => {
      const gen = member.metadata?.generation || 0;
      if (!generations[gen]) generations[gen] = [];
      generations[gen].push(member);
      maxGen = Math.max(maxGen, gen);
    });

    // Show summary
    g.append('text')
      .attr('x', dimensions.width / 2 - 50)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xl font-bold fill-gray-700')
      .text(`Large Family Tree: ${treeData.members.length} members`);

    // Show generations summary
    let yPos = 60;
    Object.keys(generations).sort((a, b) => a - b).forEach(gen => {
      const members = generations[gen];
      
      g.append('text')
        .attr('x', 20)
        .attr('y', yPos)
        .attr('class', 'text-sm font-medium fill-gray-600')
        .text(`Generation ${gen}: ${members.length} members`);
      
      // Show first few members of each generation
      const sample = members.slice(0, 5);
      const names = sample.map(m => m.profile.displayName).join(', ');
      const moreText = members.length > 5 ? ` ... and ${members.length - 5} more` : '';
      
      g.append('text')
        .attr('x', 40)
        .attr('y', yPos + 20)
        .attr('class', 'text-xs fill-gray-500')
        .text(names + moreText);
      
      yPos += 50;
    });

    // Add search prompt
    g.append('text')
      .attr('x', dimensions.width / 2 - 50)
      .attr('y', dimensions.height - 100)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm fill-blue-600')
      .text('Tip: Use the Knowledge Graph view for large families, or search for specific members');
  };

  const renderCompactView = (members) => {
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    // Show members in a grid
    const cols = 5;
    const nodeSize = 60;
    const padding = 20;

    members.forEach((member, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * (nodeSize + padding) + 100;
      const y = row * (nodeSize + padding) + 100;

      const node = g.append('g')
        .attr('transform', `translate(${x}, ${y})`)
        .on('click', () => onMemberSelect(member))
        .style('cursor', 'pointer');

      node.append('circle')
        .attr('r', 25)
        .attr('fill', '#3B82F6')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 2);

      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('class', 'text-xs font-medium fill-white')
        .text(getInitials(member.profile.displayName));

      node.append('text')
        .attr('dy', 45)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs fill-gray-700')
        .text(member.profile.displayName.split(' ')[0]);
    });
  };

  const renderClassicTree = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData.members || treeData.members.length === 0) return;

    // Create proper hierarchical tree layout using D3
    const hierarchyData = createHierarchyData(treeData);
    
    if (!hierarchyData) {
      renderLargeFamilyView();
      return;
    }

    // Use D3's tree layout for proper positioning
    const treeLayout = d3.tree()
      .size([dimensions.width - 100, dimensions.height - 100])
      .nodeSize([150, 120]); // horizontal spacing, vertical spacing

    const root = d3.hierarchy(hierarchyData, d => d.children);
    const treeData_d3 = treeLayout(root);

    const g = svg.append('g')
      .attr('transform', 'translate(50, 50)');

    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', `translate(50, 50) ${event.transform}`);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Draw links (connecting lines)
    const links = g.selectAll('.link')
      .data(treeData_d3.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d => {
        // Create curved paths between nodes
        return `M${d.source.x},${d.source.y}
                C${d.source.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${(d.source.y + d.target.y) / 2}
                 ${d.target.x},${d.target.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(treeData_d3.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .on('click', (event, d) => {
        if (!d.data.member.isVirtual) {
          onMemberSelect(d.data.member);
        }
      })
      .on('mouseenter', (event, d) => {
        if (!d.data.member.isVirtual) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          
          setHoveredMember(d.data.member);
          const nodeRect = event.currentTarget.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          setHoverPosition({ 
            x: nodeRect.left - containerRect.left + nodeRect.width / 2, 
            y: nodeRect.top - containerRect.top 
          });
        }
      })
      .on('mouseleave', (event, d) => {
        if (!d.data.member.isVirtual) {
          hoverTimeoutRef.current = setTimeout(() => {
            if (!isHoveringCard) {
              setHoveredMember(null);
            }
          }, 800);
        }
      })
      .style('cursor', d => d.data.member.isVirtual ? 'default' : 'pointer');

    // Handle virtual nodes (parents group, family root)
    nodes.each(function(d) {
      const node = d3.select(this);
      
      if (d.data.member.isVirtual) {
        if (d.data.member.isParentGroup) {
          // Render parent group as connected boxes
          const parents = d.data.member.parents;
          const parentSpacing = 80;
          
          parents.forEach((parent, i) => {
            const offsetX = (i - (parents.length - 1) / 2) * parentSpacing;
            
            const parentNode = node.append('g')
              .attr('transform', `translate(${offsetX}, 0)`)
              .on('click', (event) => {
                event.stopPropagation();
                onMemberSelect(parent);
              })
              .style('cursor', 'pointer');
            
            // Parent circle
            parentNode.append('circle')
              .attr('r', 35)
              .attr('fill', d => {
                if (selectedMember?.id === parent.id) return '#3B82F6';
                if (parent.profile.gender === 'male') return '#60A5FA';
                if (parent.profile.gender === 'female') return '#F472B6';
                return '#9CA3AF';
              })
              .attr('stroke', d => selectedMember?.id === parent.id ? '#1E40AF' : '#E5E7EB')
              .attr('stroke-width', d => selectedMember?.id === parent.id ? 3 : 2);
            
            // Parent photo or initials
            if (parent.profile.photoUrl) {
              const clipId = `clip-${parent.id}`;
              
              let defs = svg.select('defs');
              if (defs.empty()) {
                defs = svg.append('defs');
              }
              
              defs.append('clipPath')
                .attr('id', clipId)
                .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 33);

              parentNode.append('image')
                .attr('xlink:href', parent.profile.photoUrl)
                .attr('x', -35)
                .attr('y', -35)
                .attr('width', 70)
                .attr('height', 70)
                .attr('clip-path', `url(#${clipId})`)
                .attr('preserveAspectRatio', 'xMidYMid slice');
            } else {
              const initials = getInitials(parent.profile.displayName);
              parentNode.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '.35em')
                .attr('class', 'text-lg font-medium fill-white select-none')
                .text(initials);
            }
            
            // Parent name
            parentNode.append('text')
              .attr('dy', 55)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-sm font-medium fill-gray-700')
              .text(parent.profile.displayName);
            
            // Birth year
            parentNode.append('text')
              .attr('dy', 70)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-xs fill-gray-500')
              .text(() => {
                if (parent.profile.birthDate) {
                  return new Date(parent.profile.birthDate).getFullYear();
                }
                return '';
              });
          });
          
          // Draw marriage line between parents if there are 2
          if (parents.length === 2) {
            node.append('line')
              .attr('x1', -parentSpacing/2 + 35)
              .attr('y1', 0)
              .attr('x2', parentSpacing/2 - 35)
              .attr('y2', 0)
              .attr('stroke', '#374151')
              .attr('stroke-width', 2);
          }
        }
        // Skip rendering for other virtual nodes like family root
        return;
      }
      
      // Regular member node
      const member = d.data.member;
      
      // Node circle
      node.append('circle')
        .attr('r', 35)
        .attr('fill', () => {
          if (selectedMember?.id === member.id) return '#3B82F6';
          
          // Use colorful gradients for children without photos
          if (!member.profile.photoUrl && member.metadata?.customFields?.role === 'child') {
            const childColors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4'];
            // Use a simple hash of the member ID for consistent coloring
            const colorIndex = Math.abs(member.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % childColors.length;
            return childColors[colorIndex];
          }
          
          if (member.profile.gender === 'male') return '#60A5FA';
          if (member.profile.gender === 'female') return '#F472B6';
          return '#9CA3AF';
        })
        .attr('stroke', selectedMember?.id === member.id ? '#1E40AF' : '#E5E7EB')
        .attr('stroke-width', selectedMember?.id === member.id ? 3 : 2);

      // Add profile photos or initials
      if (member.profile.photoUrl) {
        const clipId = `clip-${member.id}`;
        
        let defs = svg.select('defs');
        if (defs.empty()) {
          defs = svg.append('defs');
        }
        
        defs.append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 33);

        node.append('image')
          .attr('xlink:href', member.profile.photoUrl)
          .attr('x', -35)
          .attr('y', -35)
          .attr('width', 70)
          .attr('height', 70)
          .attr('clip-path', `url(#${clipId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      } else {
        const initials = getInitials(member.profile.displayName);
        node.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('class', 'text-lg font-medium fill-white select-none')
          .text(initials);
      }
      
      // Member name
      node.append('text')
        .attr('dy', 55)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm font-medium fill-gray-700')
        .text(member.profile.displayName);

      // Birth year
      node.append('text')
        .attr('dy', 70)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs fill-gray-500')
        .text(() => {
          if (member.profile.birthDate) {
            return new Date(member.profile.birthDate).getFullYear();
          }
          return '';
        });
    });

    // Classic tree is now rendered by NewClassicTreeView component
  };

  const renderLargeKnowledgeGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Calculate generations if not already present
    const calculatedGenerations = calculateGenerations(treeData.members, treeData.relationships || []);
    
    // First, let's analyze the data to understand generation distribution
    const generationMap = new Map();
    const birthYearMap = new Map();
    
    // Collect birth years and calculated generations
    treeData.members.forEach(member => {
      // Use calculated generation if member doesn't have one
      const gen = member.metadata?.generation ?? calculatedGenerations.get(member.id) ?? 0;
      const birthYear = member.profile.birthDate ? new Date(member.profile.birthDate).getFullYear() : null;
      
      if (!generationMap.has(gen)) generationMap.set(gen, []);
      generationMap.get(gen).push(member);
      
      if (birthYear) {
        const decade = Math.floor(birthYear / 10) * 10;
        if (!birthYearMap.has(decade)) birthYearMap.set(decade, []);
        birthYearMap.get(decade).push(member);
      }
    });

    // If most members don't have generation data, use birth year grouping
    const useGenerations = generationMap.size > 1 && 
                          Array.from(generationMap.values()).reduce((sum, arr) => sum + arr.length, 0) > treeData.members.length * 0.3;
    
    let groupings;
    let groupLabel;
    
    if (useGenerations) {
      groupings = generationMap;
      groupLabel = (key) => `Generation ${key}`;
    } else {
      // Group by birth decade
      groupings = birthYearMap;
      groupLabel = (key) => `${key}s`;
      
      // Add members without birth dates to "Unknown" group
      const unknownMembers = treeData.members.filter(m => !m.profile.birthDate);
      if (unknownMembers.length > 0) {
        groupings.set('Unknown', unknownMembers);
      }
    }

    // Create a more sophisticated layout
    const sortedGroups = Array.from(groupings.entries()).sort((a, b) => {
      // Sort by key (generation or decade)
      if (a[0] === 'Unknown') return 1;
      if (b[0] === 'Unknown') return -1;
      return a[0] - b[0];
    });
    
    // Use a grid layout for better space utilization
    const gridCols = Math.ceil(Math.sqrt(sortedGroups.length));
    const gridRows = Math.ceil(sortedGroups.length / gridCols);
    const cellWidth = (dimensions.width - 100) / gridCols;
    const cellHeight = (dimensions.height - 100) / gridRows;
    const nodeRadius = 8; // Smaller nodes for large datasets
    
    // Draw each group
    sortedGroups.forEach(([groupKey, members], groupIndex) => {
      const row = Math.floor(groupIndex / gridCols);
      const col = groupIndex % gridCols;
      const groupX = 50 + col * cellWidth + cellWidth / 2;
      const groupY = 50 + row * cellHeight + cellHeight / 2;
      
      // Create group container
      const groupContainer = g.append('g')
        .attr('transform', `translate(${groupX}, ${groupY})`);
      
      // Background rect for group
      const groupWidth = cellWidth * 0.9;
      const groupHeight = cellHeight * 0.85;
      
      groupContainer.append('rect')
        .attr('x', -groupWidth/2)
        .attr('y', -groupHeight/2)
        .attr('width', groupWidth)
        .attr('height', groupHeight)
        .attr('rx', 12)
        .attr('fill', 'white')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1);
      
      // Group label
      groupContainer.append('text')
        .attr('y', -groupHeight/2 + 20)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm font-semibold fill-gray-700')
        .text(`${groupLabel(groupKey)} (${members.length})`);
      
      // Create a dense grid of small nodes for members
      const maxDisplay = 100; // Show up to 100 members per group
      const displayMembers = members.slice(0, maxDisplay);
      const cols = Math.ceil(Math.sqrt(displayMembers.length));
      const rows = Math.ceil(displayMembers.length / cols);
      const nodeSpacing = Math.min(groupWidth / (cols + 1), groupHeight / (rows + 2));
      
      displayMembers.forEach((member, i) => {
        const memberRow = Math.floor(i / cols);
        const memberCol = i % cols;
        const offsetX = (memberCol - (cols - 1) / 2) * nodeSpacing;
        const offsetY = (memberRow - (rows - 1) / 2) * nodeSpacing + 10;
        
        const node = groupContainer.append('g')
          .attr('transform', `translate(${offsetX}, ${offsetY})`)
          .on('click', () => onMemberSelect(member))
          .on('mouseenter', (event) => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            setHoveredMember(member);
            const nodeRect = event.currentTarget.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setHoverPosition({ 
              x: nodeRect.left - containerRect.left + nodeRect.width / 2, 
              y: nodeRect.top - containerRect.top 
            });
          })
          .on('mouseleave', () => {
            hoverTimeoutRef.current = setTimeout(() => {
              if (!isHoveringCard) {
                setHoveredMember(null);
              }
            }, 800);
          })
          .style('cursor', 'pointer');
        
        // Use different colors based on gender or other attributes
        const fillColor = member.profile.gender === 'female' ? '#EC4899' : 
                         member.profile.gender === 'male' ? '#3B82F6' : '#8B5CF6';
        
        node.append('circle')
          .attr('r', nodeRadius)
          .attr('fill', selectedMember?.id === member.id ? '#059669' : fillColor)
          .attr('stroke', selectedMember?.id === member.id ? '#047857' : 'none')
          .attr('stroke-width', 2)
          .attr('opacity', 0.8);
      });
      
      // Show count if there are more members
      if (members.length > maxDisplay) {
        groupContainer.append('text')
          .attr('y', groupHeight/2 - 15)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-xs font-medium fill-gray-500')
          .text(`+${members.length - maxDisplay} more`);
      }
    });
    
    // Add statistics overlay with correct data
    const statsGroup = g.append('g')
      .attr('transform', `translate(20, 20)`);
    
    const statsHeight = useGenerations ? 140 : 160;
    statsGroup.append('rect')
      .attr('width', 280)
      .attr('height', statsHeight)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 1)
      .attr('opacity', 0.95);
    
    const stats = [
      `Total Members: ${treeData.members.length}`,
      useGenerations ? 
        `Generations: ${groupings.size}` : 
        `Birth Decades: ${birthYearMap.size}`,
      `Relationships: ${treeData.relationships?.length || 0}`,
      `Members with Birth Dates: ${Array.from(birthYearMap.values()).flat().length}`,
      useGenerations ?
        `Average per Generation: ${Math.round(treeData.members.length / groupings.size)}` :
        `Average per Decade: ${Math.round(Array.from(birthYearMap.values()).flat().length / birthYearMap.size)}`
    ];
    
    stats.forEach((stat, i) => {
      statsGroup.append('text')
        .attr('x', 15)
        .attr('y', 30 + i * 25)
        .attr('class', 'text-sm fill-gray-700')
        .text(stat);
    });
    
    // Add zoom instructions
    g.append('text')
      .attr('x', dimensions.width - 20)
      .attr('y', dimensions.height - 20)
      .attr('text-anchor', 'end')
      .attr('class', 'text-xs fill-gray-400')
      .text('Scroll to zoom • Drag to pan • Click member for details');
  };

  const renderKnowledgeGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData.members || treeData.members.length === 0) return;

    // For very large graphs, show a different visualization
    if (treeData.members.length > 100) {
      renderLargeKnowledgeGraph();
      return;
    }

    const nodes = treeData.members.map(member => ({
      id: member.id,
      member: member,
      x: dimensions.width / 2,
      y: dimensions.height / 2
    }));

    const links = treeData.relationships.map(rel => ({
      source: rel.fromMemberId,
      target: rel.toMemberId,
      type: rel.type
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const g = svg.append('g');

    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => {
        if (d.type === 'spouse') return '#EC4899';
        if (d.type === 'parent' || d.type === 'child') return '#3B82F6';
        if (d.type === 'sibling') return '#10B981';
        return '#9CA3AF';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => onMemberSelect(d.member))
      .on('mouseenter', (event, d) => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredMember(d.member);
        const rect = event.target.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setHoverPosition({ 
          x: rect.left - containerRect.left + rect.width / 2, 
          y: rect.top - containerRect.top 
        });
      })
      .on('mouseleave', () => {
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isHoveringCard) {
            setHoveredMember(null);
          }
        }, 800);
      })
      .style('cursor', 'pointer');

    // Node circles
    node.append('circle')
      .attr('r', 30)
      .attr('fill', d => {
        if (selectedMember?.id === d.member.id) return '#3B82F6';
        const generation = d.member.metadata?.generation || 0;
        const colors = ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'];
        return colors[Math.min(generation, colors.length - 1)];
      })
      .attr('stroke', d => selectedMember?.id === d.member.id ? '#1E40AF' : '#E5E7EB')
      .attr('stroke-width', d => selectedMember?.id === d.member.id ? 3 : 2);

    // Add initials
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('class', 'text-sm font-medium fill-white select-none')
      .text(d => getInitials(d.member.profile.displayName));

    // Labels
    node.append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs font-medium fill-gray-700')
      .text(d => d.member.profile.displayName);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderTimelineView = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData.members || treeData.members.length === 0) return;

    // Filter members with birth dates
    const membersWithDates = treeData.members
      .filter(m => m.profile.birthDate)
      .sort((a, b) => new Date(a.profile.birthDate) - new Date(b.profile.birthDate));

    if (membersWithDates.length === 0) {
      // Show helpful empty state for timeline
      const g = svg.append('g')
        .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -40)
        .attr('class', 'text-2xl font-bold fill-gray-400')
        .text('No Timeline Data Available');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .attr('class', 'text-sm fill-gray-400')
        .text('Add birth dates to family members to see their timeline');

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 20)
        .attr('class', 'text-sm fill-gray-500')
        .text('The Timeline River shows your family\'s journey through time');

      // Add example visual
      const exampleY = 60;
      
      // Draw example timeline
      g.append('line')
        .attr('x1', -150)
        .attr('y1', exampleY)
        .attr('x2', 150)
        .attr('y2', exampleY)
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 2);

      // Example nodes
      [-100, 0, 100].forEach((x, i) => {
        g.append('circle')
          .attr('cx', x)
          .attr('cy', exampleY)
          .attr('r', 15)
          .attr('fill', '#E5E7EB');
        
        g.append('text')
          .attr('x', x)
          .attr('y', exampleY + 35)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-xs fill-gray-400')
          .text(['1950', '1980', '2010'][i]);
      });

      return;
    }

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Time scale
    const timeExtent = d3.extent(membersWithDates, d => new Date(d.profile.birthDate));
    const xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, width]);

    // Generation scale
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(membersWithDates, d => d.metadata?.generation || 0)])
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `Gen ${d}`));

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat('')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Timeline river areas by generation
    const generations = d3.group(membersWithDates, d => d.metadata?.generation || 0);
    
    generations.forEach((members, gen) => {
      const area = d3.area()
        .x(d => xScale(new Date(d.profile.birthDate)))
        .y0(yScale(gen) + 20)
        .y1(yScale(gen) - 20)
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(members)
        .attr('fill', `hsl(${gen * 60}, 70%, 80%)`)
        .attr('opacity', 0.3)
        .attr('d', area);
    });

    // Add member nodes
    const nodes = g.selectAll('.timeline-node')
      .data(membersWithDates)
      .enter().append('g')
      .attr('class', 'timeline-node')
      .attr('transform', d => `translate(${xScale(new Date(d.profile.birthDate))}, ${yScale(d.metadata?.generation || 0)})`)
      .on('click', (event, d) => onMemberSelect(d))
      .on('mouseenter', (event, d) => {
        setHoveredMember(d);
        const nodeRect = event.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setHoverPosition({ 
          x: nodeRect.left - containerRect.left + nodeRect.width / 2, 
          y: nodeRect.top - containerRect.top 
        });
      })
      .on('mouseleave', () => setHoveredMember(null))
      .style('cursor', 'pointer');

    nodes.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (selectedMember?.id === d.id) return '#3B82F6';
        return `hsl(${(d.metadata?.generation || 0) * 60}, 70%, 50%)`;
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('class', 'text-xs font-medium fill-white')
      .text(d => getInitials(d.profile.displayName));

    // Add labels on hover
    nodes.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs fill-gray-700')
      .style('display', 'none')
      .text(d => d.profile.displayName);
  };

  const renderGeographicView = async () => {
    // Hide SVG 
    if (svgRef.current) {
      svgRef.current.style.display = 'none';
    }
    
    // Hide old mapbox container if it exists
    if (mapContainerRef.current) {
      mapContainerRef.current.style.display = 'none';
    }

    if (!treeData.members || treeData.members.length === 0) return;

    // Get home location from family settings
    let homeLocation = null;
    if (familyId) {
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyId));
        const familyData = familyDoc.data();
        const homeData = familyData?.importantLocations?.find(loc => loc.id === 'home');
        if (homeData?.coordinates) {
          homeLocation = {
            lng: homeData.coordinates.lng,
            lat: homeData.coordinates.lat,
            address: homeData.address
          };
        }
      } catch (error) {
        console.error('Error fetching home location:', error);
      }
    }

    // Collect unique locations
    const locationGroups = new Map();

    // Add home location if available
    if (homeLocation) {
      locationGroups.set('Home', {
        coordinates: { lat: homeLocation.lat, lng: homeLocation.lng },
        members: [],
        isHome: true
      });
    }

    // Group members by location
    treeData.members.forEach(member => {
      const location = member.profile.birthPlace || 'Unknown Location';
      if (!locationGroups.has(location)) {
        locationGroups.set(location, {
          coordinates: null,
          members: [member]
        });
      } else {
        locationGroups.get(location).members.push(member);
      }
    });

    // Use Google Geocoding API for locations that don't have coordinates
    const geocoder = window.google?.maps ? new window.google.maps.Geocoder() : null;
    
    if (geocoder) {
      for (const [location, data] of locationGroups.entries()) {
        if (!data.coordinates && location !== 'Unknown Location') {
          try {
            const result = await new Promise((resolve) => {
              geocoder.geocode({ address: location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                  resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                  });
                } else {
                  resolve(null);
                }
              });
            });
            if (result) {
              data.coordinates = result;
            }
          } catch (error) {
            console.error(`Error geocoding ${location}:`, error);
          }
        }
      }
    }

    // Prepare markers for Google Maps
    const googleMapMarkers = [];
    let centerLat = 0, centerLng = 0, coordCount = 0;

    locationGroups.forEach((data, location) => {
      if (!data.coordinates) return;

      const memberNames = data.members.map(m => m.profile.displayName).join(', ');
      const markerData = {
        id: `location-${location.replace(/\s+/g, '-')}`,
        lat: data.coordinates.lat,
        lng: data.coordinates.lng,
        title: location,
        description: data.isHome ? 'Family Home' : `${data.members.length} family member${data.members.length > 1 ? 's' : ''}: ${memberNames}`,
        color: data.isHome ? '#10b981' : '#3b82f6',
        showLabel: true,
        members: data.members,
        isHome: data.isHome
      };

      googleMapMarkers.push(markerData);
      
      // Calculate center
      centerLat += data.coordinates.lat;
      centerLng += data.coordinates.lng;
      coordCount++;
    });

    // Set center to average of all locations
    if (coordCount > 0) {
      setMapCenter({ 
        lat: centerLat / coordCount, 
        lng: centerLng / coordCount 
      });
    }

    // Update markers state
    setMapMarkers(googleMapMarkers);
    setShowGoogleMap(true);
  };

  const renderConstellationView = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData.members || treeData.members.length === 0) return;

    const g = svg.append('g');

    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    // Create constellation pattern
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Group by generation
    const generations = d3.group(treeData.members, d => d.metadata?.generation || 0);
    const genArray = Array.from(generations);
    
    genArray.forEach(([gen, members], genIndex) => {
      const radius = 100 + genIndex * 120;
      const angleStep = (2 * Math.PI) / members.length;
      
      members.forEach((member, i) => {
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Connection lines to center for first generation
        if (genIndex === 0) {
          g.append('line')
            .attr('x1', centerX)
            .attr('y1', centerY)
            .attr('x2', x)
            .attr('y2', y)
            .attr('stroke', '#E5E7EB')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
        }
        
        // Star node
        const node = g.append('g')
          .attr('transform', `translate(${x}, ${y})`)
          .on('click', () => onMemberSelect(member))
          .on('mouseenter', (event) => {
            setHoveredMember(member);
            const nodeRect = event.currentTarget.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setHoverPosition({ 
              x: nodeRect.left - containerRect.left + nodeRect.width / 2, 
              y: nodeRect.top - containerRect.top 
            });
          })
          .on('mouseleave', () => setHoveredMember(null))
          .style('cursor', 'pointer');
        
        // Star shape
        const starSize = 15 + (5 - genIndex) * 3;
        node.append('path')
          .attr('d', d3.symbol().type(d3.symbolStar).size(starSize * starSize))
          .attr('fill', selectedMember?.id === member.id ? '#3B82F6' : '#FCD34D')
          .attr('stroke', '#F59E0B')
          .attr('stroke-width', 1);
        
        // Label
        node.append('text')
          .attr('dy', 25)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-xs fill-gray-700')
          .text(member.profile.displayName);
      });
    });

    // Add constellation lines between related members
    treeData.relationships.forEach(rel => {
      const fromMember = treeData.members.find(m => m.id === rel.fromMemberId);
      const toMember = treeData.members.find(m => m.id === rel.toMemberId);
      
      if (fromMember && toMember && rel.type === 'spouse') {
        // Calculate positions
        const fromGen = fromMember.metadata?.generation || 0;
        const toGen = toMember.metadata?.generation || 0;
        
        if (fromGen === toGen) {
          // Draw connection line
          // (Position calculation would be more complex in real implementation)
        }
      }
    });
  };

  const renderTableView = () => {
    // Hide SVG for table view
    if (svgRef.current) {
      svgRef.current.style.display = 'none';
    }

    // Create or show table container
    let tableContainer = containerRef.current.querySelector('.table-view-container');
    if (!tableContainer) {
      tableContainer = document.createElement('div');
      tableContainer.className = 'table-view-container';
      tableContainer.style.width = '100%';
      tableContainer.style.height = `${dimensions.height}px`;
      tableContainer.style.overflow = 'auto';
      containerRef.current.appendChild(tableContainer);
    } else {
      tableContainer.style.display = 'block';
    }

    // Create table HTML
    const tableHTML = `
      <div class="p-4">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Place</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generation</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${treeData.members.map((member, index) => `
              <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer" data-member-id="${member.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    ${member.profile.photoUrl ? 
                      `<img class="h-10 w-10 rounded-full" src="${member.profile.photoUrl}" alt="">` :
                      `<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-white">
                        ${getInitials(member.profile.displayName)}
                      </div>`
                    }
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">${member.profile.displayName}</div>
                      ${member.profile.email ? `<div class="text-sm text-gray-500">${member.profile.email}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${(() => {
                    if (!member.profile.birthDate) return '-';
                    try {
                      // Handle Firestore Timestamp
                      if (member.profile.birthDate._seconds) {
                        return new Date(member.profile.birthDate._seconds * 1000).toLocaleDateString();
                      }
                      // Handle regular date string
                      const date = new Date(member.profile.birthDate);
                      return isNaN(date.getTime()) ? member.profile.birthDate : date.toLocaleDateString();
                    } catch {
                      return member.profile.birthDate || '-';
                    }
                  })()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${member.profile.birthPlace || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${member.metadata?.generation || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    member.profile.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                    member.profile.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    ${member.profile.gender || 'unknown'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-indigo-600 hover:text-indigo-900 view-profile-btn" data-member-id="${member.id}">View</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    tableContainer.innerHTML = tableHTML;

    // Add event listeners
    tableContainer.querySelectorAll('tr[data-member-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.classList.contains('view-profile-btn')) {
          const memberId = row.getAttribute('data-member-id');
          const member = treeData.members.find(m => m.id === memberId);
          if (member) onMemberSelect(member);
        }
      });
    });

    tableContainer.querySelectorAll('.view-profile-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const memberId = btn.getAttribute('data-member-id');
        const member = treeData.members.find(m => m.id === memberId);
        if (member) onMemberSelect(member);
      });
    });
  };

  const createHierarchyData = (treeData) => {
    if (!treeData.members || treeData.members.length === 0) return null;
    
    // Create a proper family tree structure
    // Find parents (generation 1)
    const parents = treeData.members.filter(m => 
      m.metadata?.customFields?.role === 'parent' || 
      m.customFields?.role === 'parent' ||
      m.metadata?.generation === 1
    );
    
    // Find children (generation 2)
    const children = treeData.members.filter(m => 
      m.metadata?.customFields?.role === 'child' || 
      m.customFields?.role === 'child' ||
      m.metadata?.generation === 2
    );
    
    console.log('Creating hierarchy:', { parents: parents.length, children: children.length });
    
    // If we have two parents and children, create a proper family structure
    if (parents.length >= 2 && children.length > 0) {
      // Create a virtual root that represents the family unit
      return {
        member: {
          id: 'family-root',
          profile: { displayName: 'Family', isRoot: true },
          isVirtual: true
        },
        children: [
          {
            member: {
              id: 'parents-group',
              profile: { displayName: 'Parents', isParentGroup: true },
              parents: parents,
              isVirtual: true
            },
            children: children.map(child => ({
              member: child,
              children: []
            }))
          }
        ]
      };
    }
    
    // Fallback to simple structure if we don't have a typical nuclear family
    const roots = treeData.members.filter(m => {
      const isChild = treeData.relationships.some(r => 
        r.type === 'parent' && r.toMemberId === m.id
      );
      return !isChild;
    });
    
    if (roots.length === 0) return null;
    
    const buildNode = (member) => {
      const node = {
        member: member,
        children: []
      };
      
      // Find children
      const childRelationships = treeData.relationships.filter(
        r => r.type === 'parent' && r.fromMemberId === member.id
      );
      
      const addedChildren = new Set();
      childRelationships.forEach(rel => {
        if (!addedChildren.has(rel.toMemberId)) {
          const child = treeData.members.find(m => m.id === rel.toMemberId);
          if (child) {
            addedChildren.add(rel.toMemberId);
            node.children.push(buildNode(child));
          }
        }
      });
      
      return node;
    };
    
    if (roots.length === 1) {
      return buildNode(roots[0]);
    } else {
      return {
        member: {
          id: 'root',
          profile: { displayName: 'Family' },
          isVirtual: true
        },
        children: roots.map(buildNode)
      };
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleTo,
      zoom * 1.3
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleTo,
      zoom * 0.7
    );
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="relative family-tree-container" ref={containerRef}>
      {viewMode === 'classic' ? (
        <NewClassicTreeView
          treeData={treeData}
          dimensions={dimensions}
          selectedMember={selectedMember}
          onMemberSelect={onMemberSelect}
          setHoveredMember={setHoveredMember}
          setHoverPosition={setHoverPosition}
          hoveredMember={hoveredMember}
          isHoveringCard={isHoveringCard}
          hoverTimeoutRef={hoverTimeoutRef}
          setZoom={setZoom}
        />
      ) : viewMode === 'geographic' && showGoogleMap ? (
        <GoogleMapView
          center={mapCenter}
          zoom={4}
          markers={mapMarkers}
          height={`${dimensions.height}px`}
          onMarkerClick={(marker) => {
            const member = treeData.members.find(m => m.id === marker.memberId);
            if (member) {
              onMemberSelect(member);
            }
          }}
          className="rounded-lg"
        />
      ) : (
        <svg 
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="bg-gray-50 rounded-lg"
        />
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <NotionButton
          onClick={handleZoomIn}
          variant="subtle"
          size="sm"
          icon={<ZoomIn className="h-4 w-4" />}
        />
        <NotionButton
          onClick={handleZoomOut}
          variant="subtle"
          size="sm"
          icon={<ZoomOut className="h-4 w-4" />}
        />
        <NotionButton
          onClick={handleResetZoom}
          variant="subtle"
          size="sm"
          icon={<Home className="h-4 w-4" />}
        />
      </div>

      {/* Hover Card */}
      {hoveredMember && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl p-4 max-w-xs transition-all duration-200 border border-gray-200"
          style={{
            left: `${Math.max(10, Math.min(hoverPosition.x - 160, dimensions.width - 330))}px`,
            top: `${Math.max(10, Math.min(hoverPosition.y + 30, dimensions.height - 280))}px`,
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => {
            setIsHoveringCard(true);
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            setIsHoveringCard(false);
            setHoveredMember(null);
          }}
        >
          <div className="flex items-start gap-3">
            {hoveredMember.profile.photoUrl ? (
              <img 
                src={hoveredMember.profile.photoUrl} 
                alt={hoveredMember.profile.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                hoveredMember.metadata?.customFields?.role === 'child' 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                  : 'bg-gray-400'
              }`}>
                {hoveredMember.profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {hoveredMember.profile.displayName}
              </h4>
              
              {hoveredMember.profile.birthDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(hoveredMember.profile.birthDate).toLocaleDateString()}
                </div>
              )}
              
              {hoveredMember.profile.birthPlace && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {hoveredMember.profile.birthPlace}
                </div>
              )}
              
              {hoveredMember.profile.occupation && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Briefcase className="h-3 w-3" />
                  {hoveredMember.profile.occupation}
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <NotionButton
                  onClick={() => {
                    // Call the onViewProfile callback if provided, otherwise use onMemberSelect
                    if (onViewProfile) {
                      onViewProfile(hoveredMember);
                    } else {
                      onMemberSelect(hoveredMember);
                    }
                  }}
                  variant="primary"
                  size="sm"
                  icon={<Info className="h-3 w-3" />}
                >
                  View Profile
                </NotionButton>
                
                <NotionButton
                  onClick={() => onAskAllie(hoveredMember)}
                  variant="outline"
                  size="sm"
                  icon={<MessageCircle className="h-3 w-3" />}
                >
                  Ask Allie
                </NotionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;