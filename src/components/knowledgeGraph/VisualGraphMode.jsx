/**
 * VisualGraphMode.jsx
 *
 * Beautiful D3.js force-directed graph with Nordic-inspired design.
 * Shows family members, tasks, Fair Play cards, and relationships.
 *
 * Design: Clean, minimal, with soft colors and smooth animations.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import knowledgeGraphService from '../../services/KnowledgeGraphService';

const VisualGraphMode = ({ familyId, insights, onNodeClick, selectedNode }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, relationships: 0 });

  useEffect(() => {
    if (!familyId) return;

    // Load real graph data from Neo4j via API
    loadGraphData();

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [familyId]);

  async function loadGraphData() {
    try {
      const response = await knowledgeGraphService.getGraphData(familyId);
      const graphData = response.data;

      // Format nodes for D3 visualization
      const formattedData = formatGraphData(graphData);

      setGraphStats({
        nodes: formattedData.nodes.length,
        relationships: formattedData.links.length
      });

      // Create D3 visualization
      createGraph(formattedData);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    }
  }

  function formatGraphData(data) {
    // Format nodes with visual properties for D3
    const nodes = data.nodes.map(node => {
      let visual = {
        id: node.id,
        type: node.type,
        label: node.label || node.name
      };

      // Add visual properties based on type
      switch (node.type) {
        case 'person':
          visual.size = 20 + (node.tasksAnticipated || 0) * 2;
          visual.color = node.cognitiveLoadScore > 0.6 ? '#EF4444' : '#3B82F6';
          visual.icon = '👤';
          visual.tasksAnticipated = node.tasksAnticipated;
          visual.burden = node.cognitiveLoadScore;
          break;
        case 'task':
          visual.size = 15;
          visual.color = '#10B981';
          visual.icon = '📋';
          visual.fairPlayCard = node.fairPlayCardId;
          break;
        case 'event':
          visual.size = 16;
          visual.color = '#F97316';
          visual.icon = '📅';
          break;
        case 'survey':
          visual.size = 14;
          visual.color = '#F59E0B';
          visual.icon = '📊';
          break;
        case 'family':
          visual.size = 22;
          visual.color = '#8B5CF6';
          visual.icon = '🏠';
          break;
        case 'responsibility':
          visual.size = 18;
          visual.color = '#8B5CF6';
          visual.icon = '✓';
          visual.fairPlayCard = node.fair_play_card_id;
          break;
        default:
          visual.size = 12;
          visual.color = '#64748B';
          visual.icon = '●';
      }

      return { ...node, ...visual };
    });

    // Format links
    const links = data.links.map(link => ({
      source: link.source,
      target: link.target,
      type: link.type,
      strength: link.type === 'BELONGS_TO' ? 0.1 : 0.3,
      color: link.type === 'ANTICIPATES' ? '#EF4444' :
             link.type === 'MONITORS' ? '#F59E0B' :
             link.type === 'EXECUTES' ? '#3B82F6' : '#CBD5E1',
      dashed: link.type === 'BELONGS_TO'
    }));

    return { nodes, links };
  }

  function buildGraphFromInsights(insights) {
    const nodes = [];
    const links = [];

    // Create person nodes from anticipation data
    if (insights.anticipation?.allPeople) {
      insights.anticipation.allPeople.forEach((person, index) => {
        nodes.push({
          id: person.person,
          type: 'person',
          label: person.person,
          tasksAnticipated: person.tasks_anticipated,
          burden: person.anticipation_burden,
          size: 20 + (person.tasks_anticipated * 2), // Larger = more tasks
          color: index === 0 ? '#EF4444' : '#3B82F6', // Red for primary, blue for others
          icon: '👤'
        });
      });
    }

    // Create task nodes (sample - in real app, fetch from Neo4j)
    const taskTypes = [
      { id: 'task_grocery', label: 'Grocery Shopping', card: 'FP_001', color: '#10B981', icon: '🛒' },
      { id: 'task_school', label: 'School Communication', card: 'FP_047', color: '#8B5CF6', icon: '🏫' },
      { id: 'task_medical', label: 'Medical Appointments', card: 'FP_046', color: '#EC4899', icon: '🏥' },
      { id: 'task_extracurricular', label: 'Extracurricular', card: 'FP_024', color: '#F59E0B', icon: '⚽' },
      { id: 'task_meals', label: 'Meal Planning', card: 'FP_048', color: '#14B8A6', icon: '🍽️' }
    ];

    taskTypes.forEach(task => {
      nodes.push({
        id: task.id,
        type: 'task',
        label: task.label,
        fairPlayCard: task.card,
        size: 15,
        color: task.color,
        icon: task.icon
      });
    });

    // Create Fair Play category nodes
    const fairPlayCategories = [
      { id: 'fp_home', label: 'Home', color: '#10B981', icon: '🏠' },
      { id: 'fp_caregiving', label: 'Caregiving', color: '#EF4444', icon: '❤️' },
      { id: 'fp_out', label: 'Out', color: '#3B82F6', icon: '🌍' }
    ];

    fairPlayCategories.forEach(cat => {
      nodes.push({
        id: cat.id,
        type: 'category',
        label: cat.label,
        size: 25,
        color: cat.color,
        icon: cat.icon
      });
    });

    // Create relationships
    if (nodes.length > 0) {
      const primaryPerson = nodes.find(n => n.type === 'person' && n.color === '#EF4444');

      // ANTICIPATES relationships (person → tasks)
      taskTypes.slice(0, 3).forEach(task => {
        links.push({
          source: primaryPerson?.id,
          target: task.id,
          type: 'ANTICIPATES',
          label: 'notices',
          strength: 0.3,
          color: '#EF4444',
          dashed: false
        });
      });

      // Secondary person handles other tasks
      const secondaryPerson = nodes.find(n => n.type === 'person' && n.color === '#3B82F6');
      taskTypes.slice(3).forEach(task => {
        links.push({
          source: secondaryPerson?.id,
          target: task.id,
          type: 'EXECUTES',
          label: 'does',
          strength: 0.3,
          color: '#3B82F6',
          dashed: false
        });
      });

      // BELONGS_TO relationships (tasks → categories)
      links.push(
        { source: 'task_grocery', target: 'fp_home', type: 'BELONGS_TO', strength: 0.1, color: '#CBD5E1', dashed: true },
        { source: 'task_meals', target: 'fp_home', type: 'BELONGS_TO', strength: 0.1, color: '#CBD5E1', dashed: true },
        { source: 'task_school', target: 'fp_caregiving', type: 'BELONGS_TO', strength: 0.1, color: '#CBD5E1', dashed: true },
        { source: 'task_medical', target: 'fp_caregiving', type: 'BELONGS_TO', strength: 0.1, color: '#CBD5E1', dashed: true },
        { source: 'task_extracurricular', target: 'fp_out', type: 'BELONGS_TO', strength: 0.1, color: '#CBD5E1', dashed: true }
      );
    }

    return { nodes, links };
  }

  function createGraph(data) {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create container groups
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation with performance optimizations
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(d => {
        // Shorter links for strong relationships, longer for weak
        return d.type === 'BELONGS_TO' ? 150 : 100;
      }).strength(d => d.strength || 0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 10))
      .alphaDecay(0.02) // Faster convergence (default is 0.0228)
      .velocityDecay(0.4); // More friction, settles faster (default is 0.4)

    simulationRef.current = simulation;

    // Stop simulation after graph stabilizes to improve performance
    let tickCount = 0;
    const maxTicks = 300; // Safety limit - stop after 300 ticks (~10 seconds)

    simulation.on('end', () => {
      console.log('✅ Force simulation completed - graph stabilized');
    });

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => d.dashed ? '5,5' : '0');

    // Create link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(data.links)
      .join('text')
      .attr('class', 'link-label')
      .attr('font-size', '10px')
      .attr('fill', '#64748B')
      .attr('text-anchor', 'middle')
      .attr('opacity', 0.7)
      .text(d => d.label);

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation))
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        // Highlight connected nodes and links
        highlightConnections(d, link, node);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        // Reset highlighting
        link.attr('stroke-opacity', 0.6).attr('stroke-width', 2);
        node.select('circle').attr('stroke-width', 3);
      });

    // Add circles
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
      .style('transition', 'all 0.3s ease');

    // Add icons (emoji)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => d.size * 0.8)
      .attr('pointer-events', 'none')
      .text(d => d.icon);

    // Add labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.size + 16)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#1E293B')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // Update positions on each tick
    simulation.on('tick', () => {
      tickCount++;

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);

      // Stop simulation when stabilized (alpha < 0.01) or after max ticks
      if (simulation.alpha() < 0.01 || tickCount >= maxTicks) {
        console.log(`⏸️ Stopping force simulation (alpha: ${simulation.alpha().toFixed(4)}, ticks: ${tickCount})`);
        simulation.stop();
      }
    });

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = g.node().getBBox();
      const fullWidth = svgRef.current.clientWidth;
      const fullHeight = svgRef.current.clientHeight;
      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;

      const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }, 500);
  }

  function highlightConnections(d, link, node) {
    // Fade non-connected links
    link
      .attr('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1)
      .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? 3 : 2);

    // Highlight connected nodes
    const connectedNodeIds = new Set();
    link.each(l => {
      if (l.source.id === d.id) connectedNodeIds.add(l.target.id);
      if (l.target.id === d.id) connectedNodeIds.add(l.source.id);
    });

    node.select('circle')
      .attr('stroke-width', n => (n.id === d.id || connectedNodeIds.has(n.id)) ? 5 : 3);
  }

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Graph stats overlay */}
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-slate-200/50 px-6 py-4 z-10">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{graphStats.nodes}</div>
            <div className="text-xs text-slate-500 font-medium">Nodes</div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <div className="text-2xl font-bold text-purple-600">{graphStats.relationships}</div>
            <div className="text-xs text-slate-500 font-medium">Relationships</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-slate-200/50 px-6 py-4 z-10">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Node Types</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-600">Person</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span className="text-xs text-slate-600">Family</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-600">Survey</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Optimized view - ask Allie for details</p>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-slate-200/50 px-6 py-4 z-10 max-w-sm"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{hoveredNode.icon}</span>
            <div>
              <h4 className="font-semibold text-slate-900">{hoveredNode.label}</h4>
              <p className="text-sm text-slate-500">{hoveredNode.type}</p>
              {hoveredNode.tasksAnticipated && (
                <p className="text-xs text-indigo-600 mt-1">
                  Anticipates {hoveredNode.tasksAnticipated} tasks
                </p>
              )}
              {hoveredNode.fairPlayCard && (
                <p className="text-xs text-purple-600 mt-1">
                  Fair Play: {hoveredNode.fairPlayCard}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {hoveredNode.type === 'survey'
              ? 'Click to see detailed responses with Allie →'
              : 'Click to explore with Allie →'}
          </p>
        </motion.div>
      )}

      {/* D3 SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />

      {/* Nordic-inspired decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default VisualGraphMode;
