/**
 * EntityResolutionService.js
 *
 * Resolves entity mentions across different data sources and merges duplicate entities.
 * Critical for data quality and accurate insights.
 *
 * Challenges:
 * - Same person mentioned different ways ("Mom", "Sarah", "sarah.j@email.com")
 * - Same task described differently ("grocery shopping", "buy groceries", "get food")
 * - Fuzzy matching with confidence scoring
 *
 * Algorithms:
 * - Jaro-Winkler distance for string similarity
 * - Collective entity resolution (uses relationship context)
 * - Multi-source evidence aggregation
 *
 * Research: Fellegi-Sunter probabilistic record linkage
 */

class EntityResolutionService {
  constructor() {
    this.personAliases = new Map();  // Cache of known person name variations
    this.taskAliases = new Map();    // Cache of known task variations
  }

  /**
   * Resolve person entity from string mention
   * Handles: "Mom", "Sarah", "sarah.j@email.com", "Sarah Johnson"
   */
  resolvePerson(mention, familyMembers, context = {}) {
    if (!mention || typeof mention !== 'string') {
      return { match: null, confidence: 0 };
    }

    const mentionLower = mention.toLowerCase().trim();

    // Check cache first
    if (this.personAliases.has(mentionLower)) {
      const cachedId = this.personAliases.get(mentionLower);
      const person = familyMembers.find(m => m.id === cachedId);
      return { match: person, confidence: 0.95, method: 'cache' };
    }

    // Try exact matches first
    for (const member of familyMembers) {
      // Exact name match
      if (member.name?.toLowerCase() === mentionLower) {
        this.personAliases.set(mentionLower, member.id);
        return { match: member, confidence: 1.0, method: 'exact_name' };
      }

      // Exact email match
      if (member.email?.toLowerCase() === mentionLower) {
        this.personAliases.set(mentionLower, member.id);
        return { match: member, confidence: 1.0, method: 'exact_email' };
      }
    }

    // Try role-based matching ("Mom", "Dad", "parent")
    const roleMatch = this._matchByRole(mentionLower, familyMembers);
    if (roleMatch) {
      this.personAliases.set(mentionLower, roleMatch.member.id);
      return { match: roleMatch.member, confidence: roleMatch.confidence, method: 'role' };
    }

    // Try fuzzy string matching
    const fuzzyMatches = familyMembers.map(member => ({
      member,
      similarity: this._jaroWinkler(mentionLower, member.name?.toLowerCase() || ''),
      field: 'name'
    }));

    // Sort by similarity
    fuzzyMatches.sort((a, b) => b.similarity - a.similarity);
    const bestMatch = fuzzyMatches[0];

    // Confidence threshold: 0.85+ = high confidence, 0.7-0.85 = medium, <0.7 = low
    if (bestMatch.similarity >= 0.85) {
      this.personAliases.set(mentionLower, bestMatch.member.id);
      return { match: bestMatch.member, confidence: bestMatch.similarity, method: 'fuzzy_high' };
    } else if (bestMatch.similarity >= 0.7) {
      return { match: bestMatch.member, confidence: bestMatch.similarity, method: 'fuzzy_medium' };
    }

    // Use context if available (who created the task, who's in the conversation)
    if (context.createdBy && fuzzyMatches.some(m => m.member.id === context.createdBy && m.similarity >= 0.6)) {
      const contextMatch = fuzzyMatches.find(m => m.member.id === context.createdBy);
      return { match: contextMatch.member, confidence: 0.75, method: 'context_boost' };
    }

    // No confident match
    return { match: null, confidence: 0, method: 'no_match' };
  }

  /**
   * Resolve task entity from string mention
   * Handles: "grocery shopping", "buy groceries", "get food for week"
   */
  resolveTask(mention, existingTasks, context = {}) {
    if (!mention || typeof mention !== 'string') {
      return { match: null, confidence: 0, isNew: true };
    }

    const mentionLower = mention.toLowerCase().trim();

    // Check cache
    if (this.taskAliases.has(mentionLower)) {
      const cachedId = this.taskAliases.get(mentionLower);
      const task = existingTasks.find(t => t.id === cachedId);
      return { match: task, confidence: 0.95, method: 'cache', isNew: false };
    }

    // Try exact title match
    for (const task of existingTasks) {
      if (task.title?.toLowerCase() === mentionLower) {
        this.taskAliases.set(mentionLower, task.id);
        return { match: task, confidence: 1.0, method: 'exact_title', isNew: false };
      }
    }

    // Try fuzzy matching on title + description
    const fuzzyMatches = existingTasks.map(task => {
      const titleSim = this._jaroWinkler(mentionLower, task.title?.toLowerCase() || '');
      const descSim = task.description
        ? this._jaroWinkler(mentionLower, task.description.toLowerCase())
        : 0;
      const similarity = Math.max(titleSim, descSim);

      return { task, similarity, field: titleSim > descSim ? 'title' : 'description' };
    });

    fuzzyMatches.sort((a, b) => b.similarity - a.similarity);
    const bestMatch = fuzzyMatches[0];

    // Semantic similarity (keyword overlap)
    const mentionKeywords = this._extractKeywords(mentionLower);
    const taskKeywords = this._extractKeywords(bestMatch.task.title?.toLowerCase() || '');
    const keywordOverlap = this._calculateKeywordOverlap(mentionKeywords, taskKeywords);

    // Combine fuzzy + keyword similarity
    const combinedScore = bestMatch.similarity * 0.7 + keywordOverlap * 0.3;

    if (combinedScore >= 0.8) {
      this.taskAliases.set(mentionLower, bestMatch.task.id);
      return { match: bestMatch.task, confidence: combinedScore, method: 'fuzzy_keyword_high', isNew: false };
    } else if (combinedScore >= 0.65) {
      return { match: bestMatch.task, confidence: combinedScore, method: 'fuzzy_keyword_medium', isNew: false };
    }

    // Likely a new task
    return { match: null, confidence: 0, method: 'new_task', isNew: true };
  }

  /**
   * Merge duplicate persons in knowledge graph
   * Identifies potential duplicates and suggests merges
   */
  async findDuplicatePersons(familyMembers) {
    const duplicates = [];

    for (let i = 0; i < familyMembers.length; i++) {
      for (let j = i + 1; j < familyMembers.length; j++) {
        const person1 = familyMembers[i];
        const person2 = familyMembers[j];

        const similarity = this._comparePersons(person1, person2);

        if (similarity.score >= 0.8) {
          duplicates.push({
            person1,
            person2,
            similarity: similarity.score,
            evidence: similarity.evidence,
            recommendation: 'merge',
            confidence: 'high'
          });
        } else if (similarity.score >= 0.65) {
          duplicates.push({
            person1,
            person2,
            similarity: similarity.score,
            evidence: similarity.evidence,
            recommendation: 'review',
            confidence: 'medium'
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Merge duplicate tasks in knowledge graph
   */
  async findDuplicateTasks(tasks) {
    const duplicates = [];

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const task1 = tasks[i];
        const task2 = tasks[j];

        const similarity = this._compareTasks(task1, task2);

        if (similarity.score >= 0.8) {
          duplicates.push({
            task1,
            task2,
            similarity: similarity.score,
            evidence: similarity.evidence,
            recommendation: 'merge',
            confidence: 'high'
          });
        } else if (similarity.score >= 0.65) {
          duplicates.push({
            task1,
            task2,
            similarity: similarity.score,
            evidence: similarity.evidence,
            recommendation: 'review',
            confidence: 'medium'
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  // ============= Helper Methods =============

  _matchByRole(mention, familyMembers) {
    const roleKeywords = {
      mom: ['mom', 'mother', 'mama', 'mommy'],
      dad: ['dad', 'father', 'papa', 'daddy'],
      parent: ['parent', 'guardian']
    };

    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (keywords.some(kw => mention.includes(kw))) {
        // Find first parent matching this role
        const parent = familyMembers.find(m => {
          if (!m.isParent) return false;
          if (role === 'mom' || role === 'mother') {
            return m.role === 'mother' || m.role === 'primary_caregiver';
          } else if (role === 'dad' || role === 'father') {
            return m.role === 'father' || m.role === 'secondary_caregiver';
          }
          return true;
        });

        if (parent) {
          return { member: parent, confidence: 0.9 };
        }
      }
    }

    return null;
  }

  _jaroWinkler(s1, s2) {
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const m = this._matchingCharacters(s1, s2);
    if (m === 0) return 0.0;

    const t = this._transpositions(s1, s2, m);
    const jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;

    // Winkler modification: boost score for common prefix
    const prefixLength = this._commonPrefixLength(s1, s2, 4);
    const jaroWinkler = jaro + prefixLength * 0.1 * (1 - jaro);

    return jaroWinkler;
  }

  _matchingCharacters(s1, s2) {
    const maxDist = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    let matches = 0;

    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - maxDist);
      const end = Math.min(s2.length, i + maxDist + 1);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }

    return matches;
  }

  _transpositions(s1, s2, m) {
    const maxDist = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    let transpositions = 0;
    let k = 0;

    for (let i = 0; i < s1.length; i++) {
      if (!s1[i]) continue;
      while (k < s2.length && !s2[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return transpositions / 2;
  }

  _commonPrefixLength(s1, s2, maxLength) {
    let prefix = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, maxLength); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    return prefix;
  }

  _extractKeywords(text) {
    // Remove common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

    return text.split(/\s+/)
      .map(word => word.replace(/[^a-z0-9]/g, ''))
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  _calculateKeywordOverlap(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = [...set1].filter(kw => set2.has(kw));
    const union = new Set([...set1, ...set2]);

    return intersection.length / union.size;  // Jaccard similarity
  }

  _comparePersons(person1, person2) {
    const evidence = [];
    let score = 0;
    let factors = 0;

    // Name similarity
    if (person1.name && person2.name) {
      const nameSim = this._jaroWinkler(person1.name.toLowerCase(), person2.name.toLowerCase());
      score += nameSim;
      factors++;
      if (nameSim > 0.8) {
        evidence.push(`Similar names (${(nameSim * 100).toFixed(0)}% match)`);
      }
    }

    // Email similarity
    if (person1.email && person2.email) {
      const emailSim = this._jaroWinkler(person1.email.toLowerCase(), person2.email.toLowerCase());
      score += emailSim * 1.5;  // Email is strong signal
      factors += 1.5;
      if (emailSim > 0.8) {
        evidence.push(`Similar emails (${(emailSim * 100).toFixed(0)}% match)`);
      }
    }

    // Role match
    if (person1.role && person2.role && person1.role === person2.role) {
      score += 0.5;
      factors += 0.5;
      evidence.push('Same role');
    }

    return {
      score: factors > 0 ? score / factors : 0,
      evidence
    };
  }

  _compareTasks(task1, task2) {
    const evidence = [];
    let score = 0;
    let factors = 0;

    // Title similarity
    if (task1.title && task2.title) {
      const titleSim = this._jaroWinkler(task1.title.toLowerCase(), task2.title.toLowerCase());
      score += titleSim * 1.5;  // Title is strong signal
      factors += 1.5;
      if (titleSim > 0.8) {
        evidence.push(`Similar titles (${(titleSim * 100).toFixed(0)}% match)`);
      }
    }

    // Description similarity
    if (task1.description && task2.description) {
      const descSim = this._jaroWinkler(task1.description.toLowerCase(), task2.description.toLowerCase());
      score += descSim;
      factors++;
      if (descSim > 0.7) {
        evidence.push(`Similar descriptions (${(descSim * 100).toFixed(0)}% match)`);
      }
    }

    // Same Fair Play card
    if (task1.fairPlayCardId && task2.fairPlayCardId && task1.fairPlayCardId === task2.fairPlayCardId) {
      score += 0.5;
      factors += 0.5;
      evidence.push('Same Fair Play card');
    }

    // Same assignee
    if (task1.assignedTo && task2.assignedTo && task1.assignedTo === task2.assignedTo) {
      score += 0.3;
      factors += 0.3;
      evidence.push('Same assignee');
    }

    // Similar due dates (within 7 days)
    if (task1.dueDate && task2.dueDate) {
      const date1 = new Date(task1.dueDate);
      const date2 = new Date(task2.dueDate);
      const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) {
        score += 0.3;
        factors += 0.3;
        evidence.push(`Similar due dates (${daysDiff.toFixed(0)} days apart)`);
      }
    }

    return {
      score: factors > 0 ? score / factors : 0,
      evidence
    };
  }
}

export default new EntityResolutionService();
