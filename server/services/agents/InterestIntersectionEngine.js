// server/services/agents/InterestIntersectionEngine.js
// The magic engine that finds gift combinations parents never knew existed!

class InterestIntersectionEngine {
  constructor() {
    // Brand expansions for variety
    this.brandVariations = {
      'building': ['LEGO', 'K\'NEX', 'Mega Bloks', 'Playmobil', 'magnetic tiles'],
      'dinosaurs': ['Jurassic World', 'Schleich', 'Terra', 'National Geographic'],
      'art': ['Crayola', 'Melissa & Doug', 'Klutz', 'Spirograph'],
      'science': ['National Geographic', 'Scientific Explorer', '4M', 'Thames & Kosmos'],
      'coding': ['Sphero', 'Osmo', 'Wonder Workshop', 'Code & Go'],
      'dolls': ['Barbie', 'LOL Surprise', 'American Girl', 'Our Generation'],
      'cars': ['Hot Wheels', 'Matchbox', 'LEGO Technic', 'RC cars'],
      'sports': ['Nerf', 'Franklin', 'Spalding', 'Little Tikes']
    };

    // Activity variations for expanded searches
    this.activityExpansions = {
      'pirates': ['treasure hunt', 'ship building', 'adventure', 'ocean exploration'],
      'dinosaurs': ['fossil dig', 'prehistoric', 'paleontology', 'Jurassic'],
      'space': ['astronaut', 'rockets', 'planets', 'astronomy', 'NASA'],
      'unicorns': ['magical', 'rainbow', 'fantasy', 'sparkly'],
      'minecraft': ['building blocks', 'crafting', 'pixel art', 'sandbox'],
      'pokemon': ['trading cards', 'battle', 'collection', 'anime'],
      'art': ['drawing', 'painting', 'crafts', 'creative', 'DIY'],
      'music': ['instruments', 'singing', 'rhythm', 'dance'],
      'cooking': ['baking', 'chef', 'kitchen', 'food science'],
      'nature': ['outdoor', 'camping', 'wildlife', 'gardening'],
      'robots': ['STEM', 'programming', 'mechanical', 'AI']
    };

    // Combination boost scores
    this.comboMultipliers = {
      2: 1.0,  // Two interests combined
      3: 1.5,  // Three interests (perfect storm!)
      4: 2.0   // Four or more (ultra rare find!)
    };
  }

  /**
   * Generate all possible interest intersections
   * This is where the magic happens!
   */
  async generateIntersections(interests) {
    console.log('🔮 Generating interest intersections for:', interests.map(i => i.name));

    const intersections = [];

    // Generate 2-way combinations
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        const combo = this.createCombination([interests[i], interests[j]]);
        intersections.push(...combo);
      }
    }

    // Generate 3-way combinations (perfect storms!)
    if (interests.length >= 3) {
      for (let i = 0; i < interests.length; i++) {
        for (let j = i + 1; j < interests.length; j++) {
          for (let k = j + 1; k < interests.length; k++) {
            const combo = this.createCombination([interests[i], interests[j], interests[k]]);
            intersections.push(...combo);
          }
        }
      }
    }

    // Generate brand-specific variations
    const brandVariations = this.generateBrandVariations(interests);
    intersections.push(...brandVariations);

    // Generate activity-based variations
    const activityVariations = this.generateActivityVariations(interests);
    intersections.push(...activityVariations);

    // Sort by potential (score * multiplier)
    const scored = intersections.map(intersection => ({
      ...intersection,
      potential: this.calculatePotential(intersection)
    })).sort((a, b) => b.potential - a.potential);

    // Return top combinations with a mix of types
    return {
      all: scored,
      top3: this.selectTopDiverse(scored, 3),
      perfectStorms: scored.filter(i => i.interests.length >= 3).slice(0, 3),
      brandSpecific: scored.filter(i => i.type === 'brand').slice(0, 3),
      activityBased: scored.filter(i => i.type === 'activity').slice(0, 3)
    };
  }

  /**
   * Create combination queries from interests
   */
  createCombination(interests) {
    const combinations = [];
    const interestNames = interests.map(i => i.name);
    const baseScore = interests.reduce((sum, i) => sum + (i.score || 1), 0) / interests.length;

    // Basic combination
    combinations.push({
      type: 'basic',
      interests: interestNames,
      query: interestNames.join(' '),
      score: baseScore * this.comboMultipliers[interests.length],
      description: `Combines ${interestNames.join(' + ')}`
    });

    // Add variations with different word orders
    if (interests.length === 2) {
      // Reverse order might find different results
      combinations.push({
        type: 'basic',
        interests: interestNames,
        query: interestNames.slice().reverse().join(' '),
        score: baseScore * 0.9, // Slightly lower score for variation
        description: `Combines ${interestNames.join(' + ')}`
      });

      // "X for Y fans" format
      combinations.push({
        type: 'targeted',
        interests: interestNames,
        query: `${interestNames[0]} for ${interestNames[1]} fans`,
        score: baseScore * 0.8,
        description: `${interestNames[0]} designed for ${interestNames[1]} lovers`
      });
    }

    // Add descriptive combinations
    if (interests.length === 3) {
      // "X meets Y meets Z" format for perfect storms
      combinations.push({
        type: 'perfect_storm',
        interests: interestNames,
        query: `${interestNames[0]} ${interestNames[1]} ${interestNames[2]} toy`,
        score: baseScore * this.comboMultipliers[3],
        description: `Perfect storm: ${interestNames.join(' meets ')}`
      });
    }

    return combinations;
  }

  /**
   * Generate brand-specific variations
   */
  generateBrandVariations(interests) {
    const variations = [];

    interests.forEach(interest => {
      const interestName = interest.name.toLowerCase();

      // Check if we have brand variations for this interest
      Object.entries(this.brandVariations).forEach(([category, brands]) => {
        if (interestName.includes(category) || category.includes(interestName)) {
          brands.forEach(brand => {
            // Single brand variation
            variations.push({
              type: 'brand',
              interests: [interest.name],
              query: `${brand} ${interest.name}`,
              score: (interest.score || 1) * 0.8,
              description: `${brand} version of ${interest.name}`,
              brand
            });

            // Combine with other interests
            interests.forEach(otherInterest => {
              if (otherInterest.name !== interest.name) {
                variations.push({
                  type: 'brand_combo',
                  interests: [interest.name, otherInterest.name],
                  query: `${brand} ${otherInterest.name}`,
                  score: ((interest.score || 1) + (otherInterest.score || 1)) / 2 * 0.7,
                  description: `${brand} meets ${otherInterest.name}`,
                  brand
                });
              }
            });
          });
        }
      });
    });

    return variations;
  }

  /**
   * Generate activity-based variations
   */
  generateActivityVariations(interests) {
    const variations = [];

    interests.forEach(interest => {
      const interestName = interest.name.toLowerCase();

      // Check if we have activity expansions for this interest
      Object.entries(this.activityExpansions).forEach(([key, activities]) => {
        if (interestName.includes(key) || key.includes(interestName)) {
          activities.forEach(activity => {
            // Single activity variation
            variations.push({
              type: 'activity',
              interests: [interest.name],
              query: `${activity} ${interest.name} kit`,
              score: (interest.score || 1) * 0.7,
              description: `${activity} activity for ${interest.name} fans`,
              activity
            });

            // Combine with other interests for unique finds
            interests.forEach(otherInterest => {
              if (otherInterest.name !== interest.name) {
                variations.push({
                  type: 'activity_combo',
                  interests: [interest.name, otherInterest.name],
                  query: `${activity} ${otherInterest.name}`,
                  score: ((interest.score || 1) + (otherInterest.score || 1)) / 2 * 0.6,
                  description: `${activity} meets ${otherInterest.name}`,
                  activity
                });
              }
            });
          });
        }
      });
    });

    return variations;
  }

  /**
   * Calculate the potential of an intersection
   */
  calculatePotential(intersection) {
    let potential = intersection.score || 1;

    // Boost for perfect storms (3+ interests)
    if (intersection.interests.length >= 3) {
      potential *= 1.5;
    }

    // Boost for brand combinations (often more purchasable)
    if (intersection.type === 'brand' || intersection.type === 'brand_combo') {
      potential *= 1.2;
    }

    // Boost for activity combinations (often educational)
    if (intersection.type === 'activity' || intersection.type === 'activity_combo') {
      potential *= 1.1;
    }

    return potential;
  }

  /**
   * Select top diverse combinations
   */
  selectTopDiverse(scored, count) {
    const selected = [];
    const usedTypes = new Set();
    const usedInterestSets = new Set();

    for (const intersection of scored) {
      if (selected.length >= count) break;

      // Create a unique key for this interest combination
      const interestKey = intersection.interests.sort().join(',');

      // Prefer diversity in types and interest combinations
      if (!usedTypes.has(intersection.type) || !usedInterestSets.has(interestKey)) {
        selected.push(intersection);
        usedTypes.add(intersection.type);
        usedInterestSets.add(interestKey);
      }
    }

    // Fill remaining slots with next best
    for (const intersection of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(intersection)) {
        selected.push(intersection);
      }
    }

    return selected;
  }

  /**
   * Get special occasion combinations
   */
  getOccasionCombinations(interests, occasion) {
    const occasionBoosts = {
      'birthday': ['party', 'celebration', 'special edition', 'deluxe'],
      'christmas': ['holiday', 'festive', 'winter', 'special edition'],
      'achievement': ['advanced', 'next level', 'pro', 'master'],
      'just_because': ['fun', 'surprise', 'new', 'trending']
    };

    const combinations = [];
    const boosts = occasionBoosts[occasion] || occasionBoosts['just_because'];

    interests.forEach(interest => {
      boosts.forEach(boost => {
        combinations.push({
          type: 'occasion',
          interests: [interest.name],
          query: `${boost} ${interest.name}`,
          score: (interest.score || 1) * 0.9,
          description: `${boost} ${interest.name} for ${occasion}`,
          occasion
        });
      });
    });

    return combinations;
  }

  /**
   * Find unexpected combinations that work
   */
  findUnexpectedGems(interests) {
    const unexpected = [];

    // Look for non-obvious combinations
    const creativeCombo = {
      'dinosaurs + art': 'dinosaur painting kit',
      'space + cooking': 'astronaut food science kit',
      'pirates + science': 'pirate chemistry set',
      'unicorns + building': 'magical castle building set',
      'robots + art': 'drawing robot kit',
      'nature + coding': 'plant monitoring kit'
    };

    interests.forEach(interest1 => {
      interests.forEach(interest2 => {
        if (interest1.name !== interest2.name) {
          const key = `${interest1.name} + ${interest2.name}`;
          const reverseKey = `${interest2.name} + ${interest1.name}`;

          if (creativeCombo[key]) {
            unexpected.push({
              type: 'unexpected_gem',
              interests: [interest1.name, interest2.name],
              query: creativeCombo[key],
              score: ((interest1.score || 1) + (interest2.score || 1)) / 2 * 1.3,
              description: `Unexpected combo: ${key}`
            });
          } else if (creativeCombo[reverseKey]) {
            unexpected.push({
              type: 'unexpected_gem',
              interests: [interest2.name, interest1.name],
              query: creativeCombo[reverseKey],
              score: ((interest1.score || 1) + (interest2.score || 1)) / 2 * 1.3,
              description: `Unexpected combo: ${reverseKey}`
            });
          }
        }
      });
    });

    return unexpected;
  }
}

module.exports = InterestIntersectionEngine;