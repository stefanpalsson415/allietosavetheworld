import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FileText, Image, FileArchive, FileIcon, BarChart, Calendar, Users, Tag, Link, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * DocumentRelationshipVisualizer Component
 * 
 * Visualizes relationships between documents, events, and entities 
 * in a force-directed graph or hierarchical view
 */
const DocumentRelationshipVisualizer = ({ 
  documents = [], 
  focusedDocumentId = null,
  relationshipTypes = ['content', 'semantic', 'temporal', 'context'],
  onDocumentClick,
  width = '100%',
  height = 500,
  className
}) => {
  const [view, setView] = useState('graph'); // graph, hierarchy, list
  const [showSettings, setShowSettings] = useState(false);
  const [enabledRelationships, setEnabledRelationships] = useState(relationshipTypes);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  
  // Prepare graph data from documents
  useEffect(() => {
    if (!documents || documents.length === 0) {
      setGraphData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Build nodes and links from documents
    const nodes = [];
    const links = [];
    const nodeIndex = new Map();
    
    // First, create nodes for each document
    documents.forEach((doc, index) => {
      const node = {
        id: doc.id,
        name: doc.title || `Document ${index + 1}`,
        type: 'document',
        fileType: doc.fileType || 'unknown',
        data: doc
      };
      
      nodes.push(node);
      nodeIndex.set(doc.id, nodes.length - 1);
    });
    
    // Then, add relationship links
    documents.forEach((doc) => {
      if (doc.relationships) {
        doc.relationships.forEach((rel) => {
          // Only include enabled relationship types
          if (enabledRelationships.includes(rel.type)) {
            // Check if target document exists in our nodes
            if (nodeIndex.has(rel.targetId)) {
              links.push({
                source: nodeIndex.get(doc.id),
                target: nodeIndex.get(rel.targetId),
                type: rel.type,
                strength: rel.strength || 0.5,
                label: rel.label || rel.type
              });
            }
          }
        });
      }
      
      // Check for entity relationships
      if (doc.entities) {
        doc.entities.forEach((entity) => {
          // Check if entity node already exists
          let entityNodeIndex = nodes.findIndex(n => n.type === 'entity' && n.name === entity.name);
          
          if (entityNodeIndex === -1) {
            // Create a new entity node
            nodes.push({
              id: `entity-${nodes.length}`,
              name: entity.name,
              type: 'entity',
              entityType: entity.type || 'unknown',
              data: entity
            });
            entityNodeIndex = nodes.length - 1;
          }
          
          // Add link to the entity
          links.push({
            source: nodeIndex.get(doc.id),
            target: entityNodeIndex,
            type: 'entity',
            strength: entity.relevance || 0.3,
            label: entity.type || 'entity'
          });
        });
      }
      
      // Check for event relationships
      if (doc.events) {
        doc.events.forEach((event) => {
          // Check if event node already exists
          let eventNodeIndex = nodes.findIndex(n => n.type === 'event' && n.id === event.id);
          
          if (eventNodeIndex === -1) {
            // Create a new event node
            nodes.push({
              id: event.id || `event-${nodes.length}`,
              name: event.title || 'Event',
              type: 'event',
              eventType: event.eventType || 'unknown',
              data: event
            });
            eventNodeIndex = nodes.length - 1;
          }
          
          // Add link to the event
          links.push({
            source: nodeIndex.get(doc.id),
            target: eventNodeIndex,
            type: 'event',
            strength: 0.6,
            label: 'related to'
          });
        });
      }
    });
    
    setGraphData({ nodes, links });
    setLoading(false);
  }, [documents, enabledRelationships]);
  
  // Render force-directed graph
  useEffect(() => {
    if (!graphData || !svgRef.current || view !== 'graph') return;
    
    // Clear existing SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current);
    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;
    
    // Create tooltip if it doesn't exist
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select('body')
        .append('div')
        .attr('class', 'absolute hidden p-2 bg-white shadow-lg rounded border text-sm')
        .style('pointer-events', 'none');
    }
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    // Define color scale for node types
    const nodeColorScale = d3.scaleOrdinal()
      .domain(['document', 'entity', 'event'])
      .range(['#3B82F6', '#EC4899', '#10B981']);
    
    // Define color scale for relationship types
    const linkColorScale = d3.scaleOrdinal()
      .domain(['content', 'semantic', 'temporal', 'context', 'entity', 'event'])
      .range(['#93C5FD', '#C084FC', '#34D399', '#FBBF24', '#F87171', '#38BDF8']);
    
    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', d => linkColorScale(d.type))
      .attr('stroke-width', d => Math.max(1, d.strength * 4))
      .attr('stroke-opacity', 0.6);
    
    // Draw nodes
    const nodeGroup = svg.append('g')
      .selectAll('.node')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
        tooltipRef.current
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
          .style('display', 'block')
          .html(`
            <div class="font-medium">${d.name}</div>
            <div class="text-xs text-gray-500">${d.type}</div>
          `);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        tooltipRef.current.style('display', 'none');
      })
      .on('click', (event, d) => {
        if (d.type === 'document' && onDocumentClick) {
          onDocumentClick(d.data);
        }
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Node circles
    nodeGroup.append('circle')
      .attr('r', d => d.id === focusedDocumentId ? 12 : 8)
      .attr('fill', d => nodeColorScale(d.type))
      .attr('stroke', d => d.id === focusedDocumentId ? '#000' : '#fff')
      .attr('stroke-width', d => d.id === focusedDocumentId ? 2 : 1);
    
    // Add icons to nodes
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fff')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .text(d => {
        if (d.type === 'document') {
          return d.fileType?.startsWith('image/') ? '📷' : '📄';
        } else if (d.type === 'entity') {
          return '👤';
        } else if (d.type === 'event') {
          return '📅';
        }
        return '';
      });
    
    // Add labels to nodes
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('dy', 20)
      .attr('fill', '#333')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .text(d => {
        // Truncate long names
        return d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name;
      });
    
    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
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
    
    // Cleanup on component unmount
    return () => {
      simulation.stop();
    };
  }, [graphData, view, focusedDocumentId, onDocumentClick]);
  
  // Render hierarchical tree view
  useEffect(() => {
    if (!graphData || !svgRef.current || view !== 'hierarchy') return;
    
    // Clear existing SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current);
    const svgWidth = svgRef.current.clientWidth;
    const svgHeight = svgRef.current.clientHeight;
    
    // Create a hierarchical data structure
    // Find the focused document or the first document as root
    const rootNodeIndex = focusedDocumentId 
      ? graphData.nodes.findIndex(node => node.id === focusedDocumentId)
      : graphData.nodes.findIndex(node => node.type === 'document');
    
    if (rootNodeIndex === -1) return;
    
    const rootNode = graphData.nodes[rootNodeIndex];
    
    // Create hierarchy
    const hierarchyData = {
      name: rootNode.name,
      id: rootNode.id,
      type: rootNode.type,
      data: rootNode.data,
      children: []
    };
    
    // Add direct connections
    graphData.links.forEach(link => {
      let sourceNodeIndex, targetNodeIndex;
      
      if (typeof link.source === 'object') {
        sourceNodeIndex = graphData.nodes.findIndex(node => node.id === link.source.id);
        targetNodeIndex = graphData.nodes.findIndex(node => node.id === link.target.id);
      } else {
        sourceNodeIndex = link.source;
        targetNodeIndex = link.target;
      }
      
      if (sourceNodeIndex === rootNodeIndex) {
        const targetNode = graphData.nodes[targetNodeIndex];
        hierarchyData.children.push({
          name: targetNode.name,
          id: targetNode.id,
          type: targetNode.type,
          relationshipType: link.type,
          data: targetNode.data,
          children: []
        });
      } else if (targetNodeIndex === rootNodeIndex) {
        const sourceNode = graphData.nodes[sourceNodeIndex];
        hierarchyData.children.push({
          name: sourceNode.name,
          id: sourceNode.id,
          type: sourceNode.type,
          relationshipType: link.type,
          data: sourceNode.data,
          children: []
        });
      }
    });
    
    // Create tree layout
    const treeLayout = d3.tree().size([svgWidth - 100, svgHeight - 100]);
    
    // Create root hierarchy
    const root = d3.hierarchy(hierarchyData);
    
    // Compute the tree layout
    treeLayout(root);
    
    // Add a group for the nodes
    const g = svg.append('g')
      .attr('transform', `translate(50, 50)`);
    
    // Create links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr('fill', 'none')
      .attr('stroke', d => {
        const linkType = d.target.data.relationshipType;
        switch (linkType) {
          case 'content': return '#93C5FD';
          case 'semantic': return '#C084FC';
          case 'temporal': return '#34D399';
          case 'context': return '#FBBF24';
          case 'entity': return '#F87171';
          case 'event': return '#38BDF8';
          default: return '#d4d4d4';
        }
      })
      .attr('stroke-width', 1.5);
    
    // Create nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => {
        if (d.data.type === 'document' && onDocumentClick) {
          onDocumentClick(d.data.data);
        }
      });
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', d => d.data.id === focusedDocumentId ? 10 : 6)
      .attr('fill', d => {
        switch (d.data.type) {
          case 'document': return '#3B82F6';
          case 'entity': return '#EC4899';
          case 'event': return '#10B981';
          default: return '#d4d4d4';
        }
      });
    
    // Add labels to nodes
    node.append('text')
      .attr('dy', d => d.children ? -12 : 3)
      .attr('x', d => d.children ? 0 : 10)
      .attr('text-anchor', d => d.children ? 'middle' : 'start')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .text(d => d.data.name);
  }, [graphData, view, focusedDocumentId, onDocumentClick]);
  
  // Toggle relationship type
  const toggleRelationshipType = (type) => {
    if (enabledRelationships.includes(type)) {
      setEnabledRelationships(enabledRelationships.filter(t => t !== type));
    } else {
      setEnabledRelationships([...enabledRelationships, type]);
    }
  };
  
  // Render the graph legend
  const renderLegend = () => (
    <div className="flex flex-wrap gap-2 mt-4 text-sm">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
        <span>Document</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-pink-500 rounded-full mr-1"></div>
        <span>Entity</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
        <span>Event</span>
      </div>
      <div className="border-r border-gray-300 mx-2 h-4"></div>
      {relationshipTypes.map(type => (
        <div 
          key={type}
          className={`flex items-center px-2 py-1 rounded ${enabledRelationships.includes(type) ? 'bg-gray-100' : 'text-gray-400'}`}
          onClick={() => toggleRelationshipType(type)}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="w-2 h-2 rounded-full mr-1"
            style={{ 
              backgroundColor: type === 'content' ? '#93C5FD' : 
                             type === 'semantic' ? '#C084FC' : 
                             type === 'temporal' ? '#34D399' : 
                             type === 'context' ? '#FBBF24' : 
                             type === 'entity' ? '#F87171' : '#38BDF8'
            }}
          ></div>
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </div>
      ))}
    </div>
  );
  
  // Render list view of documents and relationships
  const renderListView = () => (
    <div className="space-y-3 mt-4">
      {graphData?.nodes
        .filter(node => node.type === 'document')
        .map(document => (
          <div 
            key={document.id}
            className={`p-3 border rounded-md ${document.id === focusedDocumentId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => onDocumentClick && onDocumentClick(document.data)}
            >
              <div className="mr-2">
                {document.fileType?.startsWith('image/') ? 
                  <Image size={20} className="text-blue-500" /> : 
                  <FileText size={20} className="text-blue-500" />
                }
              </div>
              <div className="flex-1">
                <div className="font-medium">{document.name}</div>
                <div className="text-sm text-gray-500">{document.fileType || 'Unknown'}</div>
              </div>
              {document.data.relationships && document.data.relationships.length > 0 && (
                <button 
                  className="p-1 rounded-full hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.showRelationships = !document.showRelationships;
                    setGraphData({...graphData});
                  }}
                >
                  {document.showRelationships ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  }
                </button>
              )}
            </div>
            
            {document.showRelationships && document.data.relationships && (
              <div className="mt-2 ml-7 space-y-1 text-sm border-l-2 border-gray-200 pl-3">
                {document.data.relationships
                  .filter(rel => enabledRelationships.includes(rel.type))
                  .map((rel, index) => {
                    const targetNode = graphData.nodes.find(n => n.id === rel.targetId);
                    if (!targetNode) return null;
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ 
                            backgroundColor: rel.type === 'content' ? '#93C5FD' : 
                                          rel.type === 'semantic' ? '#C084FC' : 
                                          rel.type === 'temporal' ? '#34D399' : 
                                          rel.type === 'context' ? '#FBBF24' : '#d4d4d4'
                          }}
                        ></div>
                        <span className="text-gray-500">{rel.label || rel.type} →</span>
                        <button 
                          className="ml-1 text-blue-600 hover:underline flex items-center"
                          onClick={() => onDocumentClick && onDocumentClick(targetNode.data)}
                        >
                          {targetNode.type === 'document' ? 
                            <FileText size={12} className="mr-1" /> : 
                            targetNode.type === 'entity' ? 
                              <Users size={12} className="mr-1" /> : 
                              <Calendar size={12} className="mr-1" />
                          }
                          {targetNode.name}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
    </div>
  );
  
  // If no documents are provided or no relationships exist, show a message
  if (!documents || documents.length === 0) {
    return (
      <div className={`p-4 border rounded-md text-center text-gray-500 ${className || ''}`}>
        No documents available for relationship visualization.
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className={`p-4 border rounded-md text-center ${className || ''}`}>
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <div className="text-gray-500">Loading document relationships...</div>
      </div>
    );
  }
  
  if (graphData && (graphData.nodes.length === 0 || graphData.links.length === 0)) {
    return (
      <div className={`p-4 border rounded-md text-center text-gray-500 ${className || ''}`}>
        No relationships found between the documents.
      </div>
    );
  }
  
  return (
    <div className={`p-4 border rounded-md ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Document Relationships</h3>
        <div className="flex space-x-2">
          <button
            className={`px-2 py-1 rounded text-sm ${view === 'graph' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            onClick={() => setView('graph')}
          >
            Graph
          </button>
          <button
            className={`px-2 py-1 rounded text-sm ${view === 'hierarchy' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            onClick={() => setView('hierarchy')}
          >
            Hierarchy
          </button>
          <button
            className={`px-2 py-1 rounded text-sm ${view === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            className={`px-2 py-1 rounded text-sm ${showSettings ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">Relationship Types</h4>
          <div className="flex flex-wrap gap-2">
            {relationshipTypes.map(type => (
              <button
                key={type}
                className={`px-2 py-1 text-xs rounded ${enabledRelationships.includes(type) ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => toggleRelationshipType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {view === 'list' ? (
        renderListView()
      ) : (
        <>
          <div 
            style={{ width: width, height: height }}
            className="border border-gray-200 rounded"
          >
            <svg 
              ref={svgRef} 
              width="100%" 
              height="100%"
              className="bg-white cursor-grab active:cursor-grabbing"
            ></svg>
          </div>
          
          {renderLegend()}
        </>
      )}
      
      {hoveredNode && (
        <div className="hidden absolute p-2 bg-white shadow-lg rounded z-50">
          <div>{hoveredNode.name}</div>
        </div>
      )}
    </div>
  );
};

export default DocumentRelationshipVisualizer;