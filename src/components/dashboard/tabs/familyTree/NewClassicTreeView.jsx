import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const NewClassicTreeView = ({ 
  treeData, 
  dimensions, 
  selectedMember, 
  onMemberSelect, 
  setHoveredMember, 
  setHoverPosition, 
  hoveredMember, 
  isHoveringCard, 
  hoverTimeoutRef,
  setZoom 
}) => {
  const svgRef = useRef(null);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const createHierarchyData = (treeData) => {
    if (!treeData.members || treeData.members.length === 0) return null;
    
    // For large GEDCOM imports, create a hierarchical structure based on generations
    const generations = new Map();
    
    // Group members by generation
    treeData.members.forEach(member => {
      const gen = member.metadata?.generation || 0;
      if (!generations.has(gen)) generations.set(gen, []);
      generations.get(gen).push(member);
    });
    
    // Sort generations
    const sortedGenerations = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    
    if (sortedGenerations.length === 0) return null;
    
    // Build tree structure - each generation becomes a level
    const buildGenerationTree = (generationLevel = 0) => {
      const currentGen = sortedGenerations.find(([gen]) => gen === generationLevel);
      if (!currentGen) return null;
      
      const [genNumber, members] = currentGen;
      
      // For the first few generations, show individual members
      // For later generations with many members, group them
      if (members.length <= 20) {
        return {
          member: {
            id: `generation-${genNumber}`,
            profile: { displayName: `Generation ${genNumber}`, isGenerationHeader: true },
            isVirtual: true
          },
          children: members.map(member => ({
            member: member,
            children: []
          }))
        };
      } else {
        // For large generations, create subgroups
        const chunkSize = 10;
        const chunks = [];
        for (let i = 0; i < members.length; i += chunkSize) {
          chunks.push(members.slice(i, i + chunkSize));
        }
        
        return {
          member: {
            id: `generation-${genNumber}`,
            profile: { displayName: `Generation ${genNumber} (${members.length} members)`, isGenerationHeader: true },
            isVirtual: true
          },
          children: chunks.map((chunk, chunkIndex) => ({
            member: {
              id: `gen-${genNumber}-group-${chunkIndex}`,
              profile: { displayName: `Group ${chunkIndex + 1}`, isGroup: true },
              isVirtual: true,
              groupMembers: chunk
            },
            children: chunk.map(member => ({
              member: member,
              children: []
            }))
          }))
        };
      }
    };
    
    // Create root with first few generations
    return {
      member: {
        id: 'family-root',
        profile: { displayName: 'Family Tree', isRoot: true },
        isVirtual: true
      },
      children: sortedGenerations.slice(0, 5).map(([genNumber]) => buildGenerationTree(genNumber)).filter(Boolean)
    };
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!treeData.members || treeData.members.length === 0) return;

    const hierarchyData = createHierarchyData(treeData);
    
    if (!hierarchyData) {
      // Show empty state
      const g = svg.append('g')
        .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);
      
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 0)
        .attr('class', 'text-xl font-bold fill-gray-600')
        .text('Processing family tree data...');
      return;
    }

    // Use D3's tree layout for proper positioning
    const treeLayout = d3.tree()
      .size([dimensions.width - 100, dimensions.height - 100])
      .nodeSize([200, 100]); // Wider spacing for larger families

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
      .attr('stroke-width', 2)
      .attr('opacity', 0.6);

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
          const containerRect = event.currentTarget.closest('.family-tree-container').getBoundingClientRect();
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

    // Handle different node types
    nodes.each(function(d) {
      const node = d3.select(this);
      const member = d.data.member;
      
      if (member.isVirtual) {
        if (member.isGenerationHeader) {
          // Generation header
          node.append('rect')
            .attr('x', -80)
            .attr('y', -15)
            .attr('width', 160)
            .attr('height', 30)
            .attr('rx', 15)
            .attr('fill', '#E5E7EB')
            .attr('stroke', '#9CA3AF')
            .attr('stroke-width', 1);
            
          node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('class', 'text-sm font-semibold fill-gray-700')
            .text(member.profile.displayName);
        } else if (member.isGroup) {
          // Group node - show multiple small circles
          const groupMembers = member.groupMembers || [];
          const maxShow = 6;
          const membersToShow = groupMembers.slice(0, maxShow);
          
          // Background
          node.append('rect')
            .attr('x', -60)
            .attr('y', -20)
            .attr('width', 120)
            .attr('height', 40)
            .attr('rx', 8)
            .attr('fill', '#F3F4F6')
            .attr('stroke', '#D1D5DB')
            .attr('stroke-width', 1);
          
          // Small circles for group members
          membersToShow.forEach((groupMember, i) => {
            const angle = (i / maxShow) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const memberNode = node.append('g')
              .attr('transform', `translate(${x}, ${y})`)
              .on('click', (event) => {
                event.stopPropagation();
                onMemberSelect(groupMember);
              })
              .style('cursor', 'pointer');
            
            memberNode.append('circle')
              .attr('r', 8)
              .attr('fill', groupMember.profile.gender === 'male' ? '#60A5FA' : 
                          groupMember.profile.gender === 'female' ? '#F472B6' : '#9CA3AF')
              .attr('stroke', '#FFF')
              .attr('stroke-width', 1);
            
            memberNode.append('text')
              .attr('text-anchor', 'middle')
              .attr('dy', '.35em')
              .attr('class', 'text-xs font-medium fill-white')
              .text(getInitials(groupMember.profile.displayName));
          });
          
          // Show count if there are more
          if (groupMembers.length > maxShow) {
            node.append('text')
              .attr('y', 35)
              .attr('text-anchor', 'middle')
              .attr('class', 'text-xs fill-gray-500')
              .text(`+${groupMembers.length - maxShow} more`);
          }
        }
        return;
      }
      
      // Regular member node
      node.append('circle')
        .attr('r', 25)
        .attr('fill', () => {
          if (selectedMember?.id === member.id) return '#3B82F6';
          
          // Use colorful gradients for different generations
          const generation = member.metadata?.generation || 0;
          const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#EF4444'];
          const colorIndex = generation % colors.length;
          
          if (member.profile.gender === 'male') return '#60A5FA';
          if (member.profile.gender === 'female') return '#F472B6';
          return colors[colorIndex];
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
          .attr('r', 23);

        node.append('image')
          .attr('xlink:href', member.profile.photoUrl)
          .attr('x', -25)
          .attr('y', -25)
          .attr('width', 50)
          .attr('height', 50)
          .attr('clip-path', `url(#${clipId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      } else {
        const initials = getInitials(member.profile.displayName);
        node.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('class', 'text-sm font-medium fill-white select-none')
          .text(initials);
      }
      
      // Member name
      node.append('text')
        .attr('dy', 40)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs font-medium fill-gray-700')
        .text(() => {
          const firstName = member.profile.displayName.split(' ')[0];
          return firstName.length > 12 ? firstName.substring(0, 10) + '...' : firstName;
        });

      // Birth year if available
      if (member.profile.birthDate) {
        node.append('text')
          .attr('dy', 52)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-xs fill-gray-500')
          .text(() => {
            try {
              // Handle Firestore Timestamp
              if (member.profile.birthDate._seconds) {
                return new Date(member.profile.birthDate._seconds * 1000).getFullYear();
              }
              // Handle regular date
              const date = new Date(member.profile.birthDate);
              if (!isNaN(date.getTime())) {
                return date.getFullYear();
              }
              // If it's a string that couldn't be parsed, try to extract year
              if (typeof member.profile.birthDate === 'string') {
                const yearMatch = member.profile.birthDate.match(/\d{4}/);
                return yearMatch ? yearMatch[0] : '';
              }
              return '';
            } catch {
              return '';
            }
          });
      }
    });

    // Add statistics panel
    const statsGroup = g.append('g')
      .attr('transform', `translate(20, 20)`);
    
    statsGroup.append('rect')
      .attr('width', 280)
      .attr('height', 100)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 1)
      .attr('opacity', 0.95);
    
    const stats = [
      `Family Tree: ${treeData.members.length} members`,
      `Relationships: ${treeData.relationships?.length || 0}`,
      `Use mouse wheel to zoom`,
      `Drag to pan around the tree`
    ];
    
    stats.forEach((stat, i) => {
      statsGroup.append('text')
        .attr('x', 15)
        .attr('y', 25 + i * 18)
        .attr('class', 'text-sm fill-gray-700')
        .text(stat);
    });

  }, [treeData, dimensions, selectedMember]);

  return (
    <svg 
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      className="bg-gray-50 rounded-lg"
    />
  );
};

export default NewClassicTreeView;