// Calculate generations for family tree members based on relationships
export function calculateGenerations(members, relationships) {
  // Create a map of member IDs to members
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  // Create adjacency lists for parent-child relationships
  const parents = new Map(); // child -> [parents]
  const children = new Map(); // parent -> [children]
  
  relationships.forEach(rel => {
    if (rel.type === 'parent') {
      // fromMemberId is parent, toMemberId is child
      if (!children.has(rel.fromMemberId)) {
        children.set(rel.fromMemberId, []);
      }
      children.get(rel.fromMemberId).push(rel.toMemberId);
      
      if (!parents.has(rel.toMemberId)) {
        parents.set(rel.toMemberId, []);
      }
      parents.get(rel.toMemberId).push(rel.fromMemberId);
    }
  });
  
  // Find root members (those with no parents)
  const roots = members.filter(m => !parents.has(m.id));
  
  // Assign generations using BFS from roots
  const generationMap = new Map();
  const queue = roots.map(r => ({ member: r, generation: 0 }));
  
  while (queue.length > 0) {
    const { member, generation } = queue.shift();
    
    // Skip if already assigned
    if (generationMap.has(member.id)) continue;
    
    generationMap.set(member.id, generation);
    
    // Add children to queue
    const memberChildren = children.get(member.id) || [];
    memberChildren.forEach(childId => {
      const child = memberMap.get(childId);
      if (child && !generationMap.has(childId)) {
        queue.push({ member: child, generation: generation + 1 });
      }
    });
  }
  
  // For members not connected by parent-child relationships,
  // try to infer generation from birth year
  const membersWithGen = Array.from(generationMap.entries())
    .map(([id, gen]) => ({ member: memberMap.get(id), generation: gen }))
    .filter(item => item.member.profile.birthDate);
  
  if (membersWithGen.length > 0) {
    // Calculate average birth year per generation
    const genBirthYears = new Map();
    membersWithGen.forEach(({ member, generation }) => {
      const birthYear = new Date(member.profile.birthDate).getFullYear();
      if (!genBirthYears.has(generation)) {
        genBirthYears.set(generation, []);
      }
      genBirthYears.get(generation).push(birthYear);
    });
    
    // Calculate average birth year for each generation
    const genAvgBirthYear = new Map();
    genBirthYears.forEach((years, gen) => {
      const avg = years.reduce((sum, year) => sum + year, 0) / years.length;
      genAvgBirthYear.set(gen, avg);
    });
    
    // Assign generations to unassigned members based on birth year
    members.forEach(member => {
      if (!generationMap.has(member.id) && member.profile.birthDate) {
        const birthYear = new Date(member.profile.birthDate).getFullYear();
        
        // Find closest generation by birth year
        let closestGen = 0;
        let minDiff = Infinity;
        
        genAvgBirthYear.forEach((avgYear, gen) => {
          const diff = Math.abs(birthYear - avgYear);
          if (diff < minDiff) {
            minDiff = diff;
            closestGen = gen;
          }
        });
        
        // Adjust generation based on typical generation gap (25-30 years)
        const yearDiff = birthYear - genAvgBirthYear.get(closestGen);
        const genGap = Math.round(yearDiff / 28); // Average generation gap
        
        generationMap.set(member.id, closestGen + genGap);
      }
    });
  }
  
  // Ensure all members have a generation (default to 0)
  members.forEach(member => {
    if (!generationMap.has(member.id)) {
      generationMap.set(member.id, 0);
    }
  });
  
  // Normalize generations to start from 0
  const minGen = Math.min(...Array.from(generationMap.values()));
  if (minGen < 0) {
    generationMap.forEach((gen, id) => {
      generationMap.set(id, gen - minGen);
    });
  }
  
  return generationMap;
}

// Calculate generation statistics
export function getGenerationStats(members, generationMap) {
  const stats = {
    totalGenerations: 0,
    membersPerGeneration: new Map(),
    avgBirthYearPerGeneration: new Map(),
    generationRanges: new Map()
  };
  
  // Group members by generation
  members.forEach(member => {
    const gen = generationMap.get(member.id) || 0;
    if (!stats.membersPerGeneration.has(gen)) {
      stats.membersPerGeneration.set(gen, []);
    }
    stats.membersPerGeneration.get(gen).push(member);
  });
  
  stats.totalGenerations = stats.membersPerGeneration.size;
  
  // Calculate birth year statistics
  stats.membersPerGeneration.forEach((genMembers, gen) => {
    const birthYears = genMembers
      .filter(m => m.profile.birthDate)
      .map(m => new Date(m.profile.birthDate).getFullYear());
    
    if (birthYears.length > 0) {
      const avgYear = Math.round(birthYears.reduce((sum, year) => sum + year, 0) / birthYears.length);
      const minYear = Math.min(...birthYears);
      const maxYear = Math.max(...birthYears);
      
      stats.avgBirthYearPerGeneration.set(gen, avgYear);
      stats.generationRanges.set(gen, { min: minYear, max: maxYear });
    }
  });
  
  return stats;
}