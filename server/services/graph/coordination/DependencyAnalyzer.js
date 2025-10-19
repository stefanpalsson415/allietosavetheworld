/**
 * DependencyAnalyzer.js
 *
 * Analyzes task dependencies, coordination bottlenecks, and single points of failure.
 * Uses Neo4j GDS algorithms to detect:
 * - Betweenness Centrality: Who is the coordination bottleneck?
 * - PageRank: Who has the most dependency burden?
 * - Community Detection (Louvain): Task clustering and fragmentation
 * - Path Analysis: Dependency chains and blocking sequences
 *
 * Research Foundation:
 * - Social network analysis (Freeman, 1978)
 * - Coordination theory (Malone & Crowston, 1994)
 * - Critical path analysis (project management)
 */

import neo4jService from '../Neo4jService.js';
import { executeQuery } from '../CypherQueries.js';

class DependencyAnalyzer {
  constructor() {
    this.neo4j = neo4jService;
  }

  /**
   * Analyze all dependency and coordination patterns for family
   */
  async analyzeCoordinationPatterns(familyId) {
    console.log(`🔗 [DependencyAnalyzer] Analyzing coordination for family ${familyId}...`);

    const [
      bottlenecks,
      dependencies,
      fragmentation,
      criticalPaths,
      rippleEffects
    ] = await Promise.all([
      this.detectCoordinationBottlenecks(familyId),
      this.analyzeDependencyBurden(familyId),
      this.detectCommunityFragmentation(familyId),
      this.findCriticalPaths(familyId),
      this.analyzeRippleEffects(familyId)
    ]);

    return {
      familyId,
      generatedAt: new Date().toISOString(),
      bottlenecks,
      dependencies,
      fragmentation,
      criticalPaths,
      rippleEffects,
      summary: this._generateCoordinationSummary({
        bottlenecks,
        dependencies,
        fragmentation,
        criticalPaths,
        rippleEffects
      }),
      severity: this._calculateCoordinationSeverity({
        bottlenecks,
        dependencies,
        fragmentation,
        criticalPaths
      })
    };
  }

  /**
   * Detect coordination bottlenecks using Betweenness Centrality
   * Research: High betweenness = person through whom many paths pass = bottleneck
   */
  async detectCoordinationBottlenecks(familyId) {
    console.log(`🔍 [DependencyAnalyzer] Detecting coordination bottlenecks...`);

    try {
      // Use Neo4j GDS betweenness centrality algorithm
      const result = await executeQuery('coordinationBottleneck', { familyId }, this.neo4j);

      if (!result || result.length === 0) {
        return {
          bottlenecks: [],
          insight: 'No coordination bottlenecks detected (not enough graph data yet).',
          severity: 'none'
        };
      }

      const bottlenecks = result.map((r, index) => ({
        person: r.name,
        score: r.coordination_burden,
        rank: index + 1,
        interpretation: this._interpretBetweennessScore(r.coordination_burden)
      }));

      const primaryBottleneck = bottlenecks[0];

      return {
        bottlenecks,
        primaryBottleneck,
        insight: this._generateBottleneckInsight(bottlenecks),
        severity: this._calculateBottleneckSeverity(bottlenecks),
        recommendation: this._generateBottleneckRecommendation(bottlenecks)
      };
    } catch (error) {
      console.warn('⚠️ [DependencyAnalyzer] Betweenness query failed (GDS plugin may not be installed):', error.message);

      return {
        bottlenecks: [],
        insight: 'Coordination bottleneck analysis requires Neo4j GDS plugin.',
        severity: 'unknown',
        installInstructions: 'docker exec allie-neo4j sh -c "cd /var/lib/neo4j/plugins && wget https://graphdatascience.ninja/neo4j-graph-data-science-2.5.0.jar" && docker restart allie-neo4j'
      };
    }
  }

  /**
   * Analyze dependency burden using PageRank
   * Research: High PageRank = many tasks depend on this person
   */
  async analyzeDependencyBurden(familyId) {
    console.log(`📊 [DependencyAnalyzer] Analyzing dependency burden...`);

    try {
      const result = await executeQuery('dependencyChains', { familyId }, this.neo4j);

      if (!result || result.length === 0) {
        return {
          dependencies: [],
          insight: 'No dependency chains detected yet.',
          severity: 'none'
        };
      }

      const dependencies = result.map(r => ({
        chain: r.chain,
        length: r.chain_length,
        blockedBy: r.chain[0],  // First person in chain
        severity: r.chain_length > 3 ? 'high' : r.chain_length > 1 ? 'medium' : 'low'
      }));

      // Find person who blocks the most chains
      const blockers = {};
      dependencies.forEach(dep => {
        const blocker = dep.blockedBy;
        blockers[blocker] = (blockers[blocker] || 0) + 1;
      });

      const primaryBlocker = Object.entries(blockers)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        dependencies,
        totalChains: dependencies.length,
        primaryBlocker: primaryBlocker ? {
          person: primaryBlocker[0],
          chainsBlocked: primaryBlocker[1]
        } : null,
        insight: this._generateDependencyInsight(dependencies, primaryBlocker),
        severity: dependencies.some(d => d.severity === 'high') ? 'high' : 'medium',
        recommendation: this._generateDependencyRecommendation(dependencies, primaryBlocker)
      };
    } catch (error) {
      console.warn('⚠️ [DependencyAnalyzer] Dependency chain query failed:', error.message);

      return {
        dependencies: [],
        insight: 'Dependency analysis requires more task and relationship data.',
        severity: 'unknown'
      };
    }
  }

  /**
   * Detect community fragmentation using Louvain algorithm
   * Research: High fragmentation = context-switching burden
   */
  async detectCommunityFragmentation(familyId) {
    console.log(`🧩 [DependencyAnalyzer] Detecting community fragmentation...`);

    try {
      const result = await executeQuery('communityFragmentation', { familyId }, this.neo4j);

      if (!result || result.length === 0) {
        return {
          communities: [],
          insight: 'Not enough data to detect task communities yet.',
          severity: 'none'
        };
      }

      const communities = result.reduce((acc, r) => {
        const communityId = r.community_id;
        if (!acc[communityId]) {
          acc[communityId] = {
            id: communityId,
            people: [],
            size: 0
          };
        }
        acc[communityId].people.push(r.name);
        acc[communityId].size++;
        return acc;
      }, {});

      const communityArray = Object.values(communities);

      // Calculate fragmentation score
      const totalPeople = result.length;
      const numCommunities = communityArray.length;
      const fragmentation = numCommunities / totalPeople;  // Higher = more fragmented

      return {
        communities: communityArray,
        totalCommunities: numCommunities,
        fragmentationScore: fragmentation,
        insight: this._generateFragmentationInsight(communityArray, fragmentation),
        severity: fragmentation > 0.7 ? 'high' : fragmentation > 0.5 ? 'medium' : 'low',
        recommendation: this._generateFragmentationRecommendation(fragmentation)
      };
    } catch (error) {
      console.warn('⚠️ [DependencyAnalyzer] Community detection failed (GDS plugin may not be installed):', error.message);

      return {
        communities: [],
        insight: 'Community fragmentation analysis requires Neo4j GDS plugin.',
        severity: 'unknown'
      };
    }
  }

  /**
   * Find critical dependency paths (longest chains)
   */
  async findCriticalPaths(familyId) {
    console.log(`🛣️ [DependencyAnalyzer] Finding critical paths...`);

    try {
      const result = await executeQuery('dependencyChains', { familyId }, this.neo4j);

      if (!result || result.length === 0) {
        return {
          criticalPaths: [],
          insight: 'No critical paths detected yet.',
          risk: 'low'
        };
      }

      // Sort by chain length to find longest paths
      const sortedPaths = result.sort((a, b) => b.chain_length - a.chain_length);
      const criticalPaths = sortedPaths.slice(0, 5);  // Top 5 longest

      return {
        criticalPaths: criticalPaths.map(p => ({
          chain: p.chain,
          length: p.chain_length,
          risk: p.chain_length > 3 ? 'high' : p.chain_length > 1 ? 'medium' : 'low'
        })),
        longestChain: criticalPaths[0],
        insight: this._generateCriticalPathInsight(criticalPaths),
        risk: criticalPaths[0].chain_length > 3 ? 'high' : 'medium',
        recommendation: this._generateCriticalPathRecommendation(criticalPaths)
      };
    } catch (error) {
      console.warn('⚠️ [DependencyAnalyzer] Critical path analysis failed:', error.message);

      return {
        criticalPaths: [],
        insight: 'Critical path analysis requires more task dependency data.',
        risk: 'unknown'
      };
    }
  }

  /**
   * Analyze ripple effects (cascading disruptions)
   */
  async analyzeRippleEffects(familyId) {
    console.log(`🌊 [DependencyAnalyzer] Analyzing ripple effects...`);

    try {
      const result = await executeQuery('rippleEffectAnalysis', { familyId }, this.neo4j);

      if (!result || result.length === 0) {
        return {
          rippleEffects: [],
          insight: 'No ripple effect patterns detected yet.',
          impact: 'low'
        };
      }

      const rippleEffects = result.map(r => ({
        initiator: r.initiator,
        affectedPeople: r.affected_people,
        affectedTasks: r.affected_tasks,
        severity: r.ripple_severity,
        impact: r.affected_tasks > 5 ? 'high' : r.affected_tasks > 2 ? 'medium' : 'low'
      }));

      const maxImpact = Math.max(...rippleEffects.map(r => r.affectedTasks));

      return {
        rippleEffects,
        maxImpact,
        insight: this._generateRippleEffectInsight(rippleEffects),
        impact: maxImpact > 5 ? 'high' : maxImpact > 2 ? 'medium' : 'low',
        recommendation: this._generateRippleEffectRecommendation(rippleEffects)
      };
    } catch (error) {
      console.warn('⚠️ [DependencyAnalyzer] Ripple effect analysis failed:', error.message);

      return {
        rippleEffects: [],
        insight: 'Ripple effect analysis requires more task relationship data.',
        impact: 'unknown'
      };
    }
  }

  // ============= Helper Methods =============

  _interpretBetweennessScore(score) {
    if (score > 0.5) return 'Critical bottleneck - many paths flow through this person';
    if (score > 0.3) return 'Moderate bottleneck - significant coordination burden';
    if (score > 0.1) return 'Minor bottleneck - some coordination required';
    return 'Minimal coordination burden';
  }

  _generateBottleneckInsight(bottlenecks) {
    if (bottlenecks.length === 0) return 'Coordination is well-distributed.';

    const primary = bottlenecks[0];
    const gap = bottlenecks.length > 1
      ? (primary.score / bottlenecks[1].score).toFixed(1)
      : 'N/A';

    return `${primary.person} is the primary coordination hub (betweenness score: ${primary.score.toFixed(2)}), ${gap}x higher than the next person. Most family coordination flows through them, creating a potential bottleneck.`;
  }

  _calculateBottleneckSeverity(bottlenecks) {
    if (bottlenecks.length === 0) return 'none';

    const primary = bottlenecks[0];
    if (primary.score > 0.5) return 'high';
    if (primary.score > 0.3) return 'medium';
    return 'low';
  }

  _generateBottleneckRecommendation(bottlenecks) {
    if (bottlenecks.length === 0) return 'Coordination is balanced - no changes needed.';

    const primary = bottlenecks[0];
    return `Reduce ${primary.person}'s coordination burden by: 1) Delegating full task ownership (not just execution), 2) Using shared calendars/systems instead of verbal coordination, 3) Establishing standard routines that don't require coordination.`;
  }

  _generateDependencyInsight(dependencies, primaryBlocker) {
    if (!primaryBlocker) return 'No major dependency bottlenecks detected.';

    const [person, count] = primaryBlocker;
    const longChains = dependencies.filter(d => d.length > 3).length;

    return `${person} is the blocking point for ${count} dependency chains. ${longChains} chains are 3+ steps long, indicating complex dependencies that create delays and coordination overhead.`;
  }

  _generateDependencyRecommendation(dependencies, primaryBlocker) {
    if (!primaryBlocker) return 'Dependency structure is healthy.';

    const [person] = primaryBlocker;
    return `Reduce dependency chains by: 1) Parallel task ownership (multiple people can complete similar tasks), 2) Explicit deadlines with buffer time, 3) Breaking ${person}'s blocking tasks into smaller, independent pieces.`;
  }

  _generateFragmentationInsight(communities, fragmentationScore) {
    if (communities.length <= 1) return 'Family works as unified team - low context-switching.';

    return `Tasks cluster into ${communities.length} separate communities (fragmentation: ${(fragmentationScore * 100).toFixed(0)}%). High fragmentation indicates context-switching burden where people juggle disconnected responsibilities.`;
  }

  _generateFragmentationRecommendation(fragmentationScore) {
    if (fragmentationScore < 0.5) return 'Task clustering is healthy - maintain current structure.';

    return `Reduce fragmentation by: 1) Grouping related tasks under single owner, 2) Using Fair Play card system to assign full categories (not individual tasks), 3) Batching similar tasks together (e.g., all school tasks handled by one person).`;
  }

  _generateCriticalPathInsight(criticalPaths) {
    if (criticalPaths.length === 0) return 'No critical dependency paths detected.';

    const longest = criticalPaths[0];
    return `Longest dependency chain: ${longest.chain_length} steps (${longest.chain.join(' → ')}). This creates single point of failure where one delay cascades through entire chain.`;
  }

  _generateCriticalPathRecommendation(criticalPaths) {
    if (criticalPaths.length === 0) return 'No critical paths to address.';

    return `Shorten critical paths by: 1) Parallelizing independent tasks, 2) Adding buffer time at each step, 3) Creating backup plans for high-risk steps, 4) Reducing handoffs between people.`;
  }

  _generateRippleEffectInsight(rippleEffects) {
    if (rippleEffects.length === 0) return 'No major ripple effects detected.';

    const maxEffect = rippleEffects.reduce((max, r) => r.affectedTasks > max.affectedTasks ? r : max);
    return `${maxEffect.initiator} has highest ripple effect (${maxEffect.affectedTasks} tasks affected, ${maxEffect.affectedPeople} people impacted). Changes to their tasks cascade throughout family system.`;
  }

  _generateRippleEffectRecommendation(rippleEffects) {
    if (rippleEffects.length === 0) return 'Ripple effects are minimal.';

    const maxEffect = rippleEffects[0];
    return `Reduce ${maxEffect.initiator}'s ripple effects by: 1) Decoupling their tasks from others (reduce dependencies), 2) Over-communicating changes early, 3) Building redundancy (others can complete their tasks if needed).`;
  }

  _generateCoordinationSummary(analysis) {
    const issues = [];

    if (analysis.bottlenecks.severity === 'high') {
      issues.push(`${analysis.bottlenecks.primaryBottleneck?.person} is critical coordination bottleneck`);
    }
    if (analysis.dependencies.severity === 'high') {
      issues.push(`${analysis.dependencies.totalChains} dependency chains create delays`);
    }
    if (analysis.fragmentation.severity === 'high') {
      issues.push(`high task fragmentation (${analysis.fragmentation.fragmentationScore.toFixed(1)} score) increases context-switching`);
    }

    if (issues.length === 0) {
      return 'Family coordination is healthy - tasks are well-distributed and dependencies are manageable.';
    }

    return `Coordination challenges: ${issues.join(', ')}. These patterns create invisible coordination burden.`;
  }

  _calculateCoordinationSeverity(analysis) {
    const severities = {
      high: 3,
      medium: 2,
      low: 1,
      none: 0,
      unknown: 0
    };

    const scores = [
      severities[analysis.bottlenecks.severity],
      severities[analysis.dependencies.severity],
      severities[analysis.fragmentation.severity],
      severities[analysis.criticalPaths.risk]
    ];

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    if (avgScore >= 0.5) return 'low';
    return 'none';
  }
}

export default new DependencyAnalyzer();
