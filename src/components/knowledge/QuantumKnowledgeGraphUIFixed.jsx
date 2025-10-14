// src/components/knowledge/QuantumKnowledgeGraphUISimple.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Sparkles, 
  Search, 
  Mic, 
  Camera,
  Share2,
  TrendingUp,
  Gauge,
  Activity,
  Zap,
  Network,
  GitBranch,
  Cpu,
  Atom,
  Globe,
  MessageCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  Play,
  Pause,
  RefreshCw,
  Download,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { QuantumKnowledgeGraph } from '../../services/QuantumKnowledgeGraph';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { quantumConfig } from '../../config/quantumConfig';

const QuantumKnowledgeGraphUIFixed = ({ familyId }) => {
  const { familyMembers } = useFamily();
  const { currentUser } = useAuth();

  // State management
  const [activeView, setActiveView] = useState('quantum');
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [quantumState, setQuantumState] = useState({
    entities: {},
    relationships: [],
    energy: 0.5,
    coherence: 0.7
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(quantumConfig.defaultRealTimeMode || false);

  // D3 visualization ref
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  // Create quantum graph instance
  const graphInstance = useRef(new QuantumKnowledgeGraph());
  
  // Initialize quantum state
  useEffect(() => {
    if (!familyId) return;

    const initializeQuantum = async () => {
      try {
        const state = await graphInstance.current.getFamilyQuantumState(familyId);
        setQuantumState(state);

        // Get initial insights and predictions
        const [insightsData, predictionsData, patternsData] = await Promise.all([
          graphInstance.current.getPredictiveInsights(familyId, 7),
          graphInstance.current.predict(familyId, { timeHorizon: 7 }),
          graphInstance.current.getActivePatterns(familyId)
        ]);

        setInsights(insightsData.slice(0, 5));
        setPredictions(predictionsData.predictions || []);
        setPatterns(patternsData.slice(0, 5));
      } catch (error) {
        console.error('Error initializing quantum state:', error);
      }
    };

    initializeQuantum();
  }, [familyId]);
  
  // Create D3 quantum visualization
  useEffect(() => {
    if (!svgRef.current || !quantumState.entities) return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous
    svg.selectAll('*').remove();
    
    // Create gradient definitions
    const defs = svg.append('defs');
    
    // Quantum gradient
    const quantumGradient = defs.append('radialGradient')
      .attr('id', 'quantum-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
      
    quantumGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#9333ea')
      .attr('stop-opacity', 0.8);
      
    quantumGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.2);
    
    // Create container
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Convert quantum entities to nodes
    const nodes = Object.values(quantumState.entities || {}).map(entity => ({
      id: entity.id,
      name: entity.properties?.name || entity.id,
      type: entity.type,
      energy: entity.properties?.energy || 0.5,
      x: Math.random() * width,
      y: Math.random() * height
    }));
    
    // Convert relationships to links
    const links = (quantumState.relationships || []).map(rel => ({
      source: rel.sourceId || rel.source,
      target: rel.targetId || rel.target,
      type: rel.type,
      weight: rel.properties?.weight || 1
    })).filter(link => link.source && link.target); // Filter out invalid links
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    // Add quantum field background
    const fieldGroup = g.append('g').attr('class', 'quantum-field');
    
    // Add pulsing quantum field circles
    for (let i = 0; i < 5; i++) {
      fieldGroup.append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', 'url(#quantum-gradient)')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .delay(i * 1000)
        .duration(5000)
        .attr('r', width)
        .attr('opacity', 0.3)
        .transition()
        .duration(1000)
        .attr('opacity', 0)
        .on('end', function repeat() {
          d3.select(this)
            .attr('r', 0)
            .attr('opacity', 0)
            .transition()
            .delay(5000)
            .duration(5000)
            .attr('r', width)
            .attr('opacity', 0.3)
            .transition()
            .duration(1000)
            .attr('opacity', 0)
            .on('end', repeat);
        });
    }
    
    // Add links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#6366f1')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => Math.sqrt(d.weight));
    
    // Add nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add node circles
    node.append('circle')
      .attr('r', d => 20 + d.energy * 20)
      .attr('fill', 'url(#quantum-gradient)')
      .attr('stroke', '#9333ea')
      .attr('stroke-width', 2);
    
    // Add glowing effect
    node.append('circle')
      .attr('r', d => 25 + d.energy * 25)
      .attr('fill', 'none')
      .attr('stroke', '#9333ea')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
      .attr('class', 'glow');
    
    // Add labels
    node.append('text')
      .text(d => d.name)
      .attr('x', 0)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e9d5ff')
      .style('font-size', '12px')
      .style('font-weight', '500');
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
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
    
    // Store simulation reference
    simulationRef.current = simulation;
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [quantumState]);
  
  // Real-time updates
  useEffect(() => {
    if (!realTimeMode || !familyId) return;
    
    const interval = setInterval(async () => {
      try {
        setIsProcessing(true);
        
        // Get latest quantum state
        const state = await QuantumKnowledgeGraph.getFamilyQuantumState(familyId);
        setQuantumState(state);
        
        // Get new insights
        const newInsights = await QuantumKnowledgeGraph.getPredictiveInsights(familyId, 1);
        if (newInsights.length > 0) {
          setInsights(prev => [...newInsights, ...prev].slice(0, 10));
        }
        
        setIsProcessing(false);
      } catch (error) {
        console.error('Error updating quantum state:', error);
        setIsProcessing(false);
      }
    }, quantumConfig.realTimeUpdateInterval || 60000); // Use config or default to 1 minute
    
    return () => clearInterval(interval);
  }, [realTimeMode, familyId]);
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Atom className="w-8 h-8 text-purple-400 animate-pulse" />
              <h1 className="text-2xl font-bold text-white">Quantum Knowledge Graph</h1>
            </div>
            <div className="flex items-center space-x-2 text-purple-300">
              <Cpu className="w-4 h-4" />
              <span className="text-sm">Quantum Processing Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time toggle */}
            <button
              onClick={() => setRealTimeMode(!realTimeMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                realTimeMode 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              }`}
            >
              {realTimeMode ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-sm font-medium">Real-time</span>
            </button>
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-purple-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* View tabs */}
        <div className="flex space-x-2 mt-4">
          {['quantum', 'insights', 'patterns', 'predictions'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === view
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visualization Area */}
        <div className="flex-1 relative">
          {activeView === 'quantum' && (
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f0a1f 100%)' }}
            />
          )}
          
          {activeView === 'insights' && (
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">Quantum Insights</h2>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-purple-800/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-purple-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{insight.title}</h3>
                        <p className="text-purple-300 text-sm mt-1">{insight.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-purple-400">
                            Confidence: {Math.round((insight.confidence || 0.8) * 100)}%
                          </span>
                          <span className="text-xs text-purple-400">
                            Impact: {insight.impact || 'Medium'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {activeView === 'patterns' && (
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">Detected Patterns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map((pattern, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-indigo-800/30 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <GitBranch className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-medium text-white">{pattern.name}</h3>
                    </div>
                    <p className="text-indigo-300 text-sm">{pattern.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pattern.domains?.map((domain, i) => (
                        <span key={i} className="text-xs bg-indigo-700/50 text-indigo-300 px-2 py-1 rounded">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {activeView === 'predictions' && (
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">Quantum Predictions</h2>
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-pink-800/30 backdrop-blur-sm border border-pink-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-pink-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{prediction.title}</h3>
                        <p className="text-pink-300 text-sm mt-1">{prediction.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-pink-400 mb-1">
                            <span>Probability</span>
                            <span>{Math.round((prediction.probability || 0.7) * 100)}%</span>
                          </div>
                          <div className="w-full bg-pink-900/50 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${(prediction.probability || 0.7) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Side Panel */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-purple-500/30 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4">Quantum State</h3>
          
          {/* Energy Level */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-300">Energy Level</span>
              <span className="text-sm text-purple-400">{Math.round(quantumState.energy * 100)}%</span>
            </div>
            <div className="w-full bg-purple-900/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${quantumState.energy * 100}%` }}
              />
            </div>
          </div>
          
          {/* Coherence */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-300">Quantum Coherence</span>
              <span className="text-sm text-purple-400">{Math.round(quantumState.coherence * 100)}%</span>
            </div>
            <div className="w-full bg-purple-900/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${quantumState.coherence * 100}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg">
              <span className="text-sm text-purple-300">Entities</span>
              <span className="text-sm font-medium text-white">
                {Object.keys(quantumState.entities || {}).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg">
              <span className="text-sm text-purple-300">Relationships</span>
              <span className="text-sm font-medium text-white">
                {(quantumState.relationships || []).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg">
              <span className="text-sm text-purple-300">Active Patterns</span>
              <span className="text-sm font-medium text-white">{patterns.length}</span>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <button className="w-full px-4 py-3 bg-purple-600/30 hover:bg-purple-600/50 text-white rounded-lg transition-all flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Ask Quantum Allie</span>
            </button>
            <button className="w-full px-4 py-3 bg-indigo-600/30 hover:bg-indigo-600/50 text-white rounded-lg transition-all flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Insights</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .glow {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default QuantumKnowledgeGraphUIFixed;