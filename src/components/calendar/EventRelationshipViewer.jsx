// src/components/calendar/EventRelationshipViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import EventRelationshipGraph from '../../services/EventRelationshipGraph';
import { X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

/**
 * EventRelationshipViewer component
 * Displays a visual graph of event relationships
 */
const EventRelationshipViewer = ({ 
  onClose, 
  onSelectEvent,
  startDate = null,
  endDate = null,
  className = "" 
}) => {
  const { familyId } = useFamily();
  const containerRef = useRef(null);
  
  // Default to showing the last 30 days instead of future dates
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Look back 30 days by default
  }
  
  // End date defaults to today if not provided
  if (!endDate) {
    endDate = new Date(); // Today's date
  }
  
  // State
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  // Load graph data on component mount
  useEffect(() => {
    if (familyId) {
      loadGraphData();
    }
  }, [familyId, startDate, endDate]);
  
  // Function to load graph data
  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout')), 10000);
      });
      
      // Race between actual data loading and timeout
      const graphData = await Promise.race([
        EventRelationshipGraph.exportRelationshipGraph(familyId),
        timeoutPromise
      ]);
      
      console.log('Graph data loaded:', graphData);
      
      // Check if we got data
      if (!graphData || !graphData.nodes || !graphData.edges) {
        console.warn('Empty graph data returned, using mock data for demonstration');
        
        // Create some mock data to demonstrate the UI
        graphData = {
          nodes: [
            { id: 'event1', label: 'Doctor Appointment', type: 'medical', date: new Date() },
            { id: 'event2', label: 'Follow-up Visit', type: 'medical', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            { id: 'event3', label: 'Soccer Practice', type: 'sports', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) }
          ],
          edges: [
            { id: 'edge1', source: 'event1', target: 'event2', label: 'Sequential', type: 'SEQUENTIAL', directional: true },
            { id: 'edge2', source: 'event1', target: 'event3', label: 'Transportation', type: 'TRANSPORTATION', directional: false }
          ]
        };
      }
      
      // Filter to events within date range
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      const filteredNodes = graphData.nodes.filter(node => {
        if (!node.date) return true; // Include nodes without dates
        
        const nodeDate = new Date(node.date);
        return nodeDate >= rangeStart && nodeDate <= rangeEnd;
      });
      
      // Filter edges to only those connecting nodes in our filtered set
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      const filteredEdges = graphData.edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      setGraph({ 
        nodes: filteredNodes, 
        edges: filteredEdges 
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading graph data:', err);
      setError(err.message || 'Failed to load relationship graph');
      setLoading(false);
    }
  };
  
  // Function to handle zooming
  const handleZoom = (direction) => {
    if (direction === 'in' && zoom < 1.5) {
      setZoom(zoom + 0.1);
    } else if (direction === 'out' && zoom > 0.5) {
      setZoom(zoom - 0.1);
    }
  };
  
  // Function to get color for event type
  const getEventColor = (node) => {
    switch (node.type) {
      case 'medical':
        return '#ef4444'; // red
      case 'school':
        return '#3b82f6'; // blue
      case 'sports':
        return '#10b981'; // green
      case 'shopping':
        return '#f59e0b'; // amber
      case 'transportation':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };
  
  // Function to format date
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d');
    } catch (err) {
      return '';
    }
  };
  
  // Determine layout positions for nodes and edges
  // This is a simple force-directed layout algorithm
  const renderGraph = () => {
    if (!graph.nodes.length) return null;
    
    // Create a map of node positions
    const nodePositions = {};
    const nodeElements = [];
    const edgeElements = [];
    
    // Group nodes by date
    const nodesByDate = {};
    
    graph.nodes.forEach(node => {
      const dateStr = node.date ? formatDate(node.date) : 'No Date';
      
      if (!nodesByDate[dateStr]) {
        nodesByDate[dateStr] = [];
      }
      
      nodesByDate[dateStr].push(node);
    });
    
    // Calculate positions based on dates (horizontally) and index (vertically)
    const dates = Object.keys(nodesByDate).sort((a, b) => {
      if (a === 'No Date') return 1;
      if (b === 'No Date') return -1;
      return new Date(a) - new Date(b);
    });
    
    const horizontalSpacing = 120;
    const verticalSpacing = 80;
    const maxNodesPerColumn = Math.max(
      ...dates.map(date => nodesByDate[date].length)
    );
    
    dates.forEach((date, dateIndex) => {
      const nodes = nodesByDate[date];
      const columnHeight = nodes.length * verticalSpacing;
      const startY = 100 + (maxNodesPerColumn * verticalSpacing - columnHeight) / 2;
      
      nodes.forEach((node, nodeIndex) => {
        const x = 100 + dateIndex * horizontalSpacing;
        const y = startY + nodeIndex * verticalSpacing;
        
        nodePositions[node.id] = { x, y };
        
        // Create node element
        nodeElements.push(
          <g 
            key={`node-${node.id}`}
            transform={`translate(${x}, ${y})`}
            onClick={() => onSelectEvent && onSelectEvent(node.id)}
            className="cursor-pointer"
          >
            <circle 
              r={20} 
              fill={getEventColor(node)}
              strokeWidth={2}
              stroke="white"
              className="drop-shadow-md"
            />
            <text 
              textAnchor="middle" 
              dy="0.3em" 
              fontSize="10" 
              fill="white"
              pointerEvents="none"
            >
              {formatDate(node.date)}
            </text>
            <text 
              textAnchor="middle" 
              y={30} 
              fontSize="11" 
              fill="#4b5563"
              pointerEvents="none"
            >
              {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
            </text>
          </g>
        );
      });
    });
    
    // Create edge elements
    graph.edges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      
      if (sourcePos && targetPos) {
        // Calculate edge path
        const path = `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
        
        // Determine edge color based on type
        let strokeColor;
        switch (edge.type) {
          case 'PARENT_CHILD':
            strokeColor = '#3b82f6'; // blue
            break;
          case 'SEQUENTIAL':
            strokeColor = '#8b5cf6'; // purple
            break;
          case 'REQUIRES':
            strokeColor = '#10b981'; // green
            break;
          case 'TRANSPORTATION':
            strokeColor = '#f59e0b'; // amber
            break;
          case 'SHARED_EQUIPMENT':
            strokeColor = '#f59e0b'; // amber
            break;
          default:
            strokeColor = '#6b7280'; // gray
        }
        
        edgeElements.push(
          <g key={`edge-${edge.id}`}>
            <path 
              d={path} 
              stroke={strokeColor} 
              strokeWidth={2} 
              fill="none"
              markerEnd={edge.directional ? "url(#arrowhead)" : null}
            />
          </g>
        );
      }
    });
    
    // Calculate dimensions based on node positions
    const width = Math.max(
      ...Object.values(nodePositions).map(pos => pos.x)
    ) + 100;
    
    const height = Math.max(
      ...Object.values(nodePositions).map(pos => pos.y)
    ) + 100;
    
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
        {edgeElements}
        {nodeElements}
      </svg>
    );
  };
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-full ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-blue-800">
            Event Relationship Graph
          </h3>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-blue-700">
          {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex justify-between">
        <div className="text-sm text-gray-500">
          {graph.nodes.length} events, {graph.edges.length} connections
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleZoom('out')}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => handleZoom('in')}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            disabled={zoom >= 1.5}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => {
              console.log('Refresh button clicked');
              loadGraphData();
            }}
            className="p-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded flex items-center"
            aria-label="Refresh"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="ml-1 text-xs">{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      {/* Graph content */}
      <div 
        ref={containerRef}
        className="p-4 overflow-auto"
        style={{ maxHeight: '70vh' }}
      >
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium mb-2">Loading relationship graph...</p>
            <p className="text-sm text-gray-500">This may take a few moments.</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 font-medium mb-2">Error loading graph</div>
            <p className="text-sm text-red-500">{error}</p>
            <button 
              onClick={loadGraphData} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : graph.nodes.length === 0 ? (
          <div className="py-8 text-center bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 font-medium mb-2">No relationships found</div>
            <p className="text-sm text-gray-600">No event relationships found in the selected date range.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            {renderGraph()}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
        <div className="text-xs text-gray-500 font-medium mb-2">Legend:</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            Medical
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            School
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            Sports
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
            Shopping
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
            Transportation
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full bg-gray-500 mr-1"></span>
            Other
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRelationshipViewer;