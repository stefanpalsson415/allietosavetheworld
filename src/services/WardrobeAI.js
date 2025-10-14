// src/services/WardrobeAI.js
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import ClaudeService from './ClaudeService';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

/**
 * Wardrobe AI Service
 * Intelligent wardrobe management with outfit suggestions,
 * weather integration, and growth tracking
 */
class WardrobeAI {
  constructor() {
    this.weatherAPIKey = process.env.REACT_APP_WEATHER_API_KEY;
    this.clothingCategories = [
      'tops', 'bottoms', 'dresses', 'outerwear',
      'shoes', 'accessories', 'underwear', 'pajamas', 'activewear'
    ];

    this.seasons = {
      spring: { months: [3, 4, 5], temp: { min: 10, max: 20 } },
      summer: { months: [6, 7, 8], temp: { min: 20, max: 35 } },
      fall: { months: [9, 10, 11], temp: { min: 10, max: 20 } },
      winter: { months: [12, 1, 2], temp: { min: -10, max: 10 } }
    };

    this.outfitFormulas = {
      casual: ['top', 'bottom', 'shoes'],
      formal: ['dress|top+bottom', 'shoes', 'accessory'],
      school: ['top', 'bottom', 'shoes', 'outerwear?'],
      sport: ['activewear-top', 'activewear-bottom', 'shoes-sport'],
      sleep: ['pajamas-top', 'pajamas-bottom']
    };

    this.fashionFacts = [
      "Did you know? The average person wears only 20% of their wardrobe 80% of the time!",
      "Fun fact: Mixing patterns can make your outfit more interesting - try stripes with florals!",
      "Style tip: A pop of color can brighten any outfit!",
      "Did you know? The t-shirt was invented in 1904 for bachelors who couldn't sew!",
      "Fashion history: Jeans were originally made for miners and cowboys!",
      "Eco tip: Donating clothes you've outgrown helps other kids and the environment!"
    ];
  }

  /**
   * Morning routine outfit suggestion system
   */
  async morningRoutine(childId, familyId = null) {
    try {
      familyId = familyId || localStorage.getItem('selectedFamilyId');

      // Get weather data
      const weather = await this.getWeatherData();

      // Get child's schedule for today
      const schedule = await this.getChildSchedule(childId, familyId);

      // Get child's wardrobe
      const wardrobe = await this.getWardrobe(familyId, childId);

      // Get child preferences from Quantum Graph
      const childContext = await QuantumKnowledgeGraph.getChildContext(childId);

      // Generate personalized greeting
      const greeting = this.generateGreeting(weather, schedule, childContext);

      // Generate outfit suggestions
      const outfitSuggestions = await this.suggestOutfits(
        wardrobe,
        weather,
        schedule,
        childContext
      );

      // Get fun fact for the day
      const funFact = this.getDailyFashionFact();

      return {
        greeting,
        weather: {
          temp: weather.temp,
          condition: weather.condition,
          icon: weather.icon
        },
        schedule: schedule.summary,
        outfitSuggestions,
        interactiveMode: 'mix_and_match',
        funFact,
        lastWorn: await this.getLastWornTracking(familyId, childId)
      };
    } catch (error) {
      console.error('Error in morning routine:', error);
      return {
        greeting: "Good morning! Let's pick out something awesome to wear!",
        outfitSuggestions: [],
        error: error.message
      };
    }
  }

  /**
   * Get weather data
   */
  async getWeatherData(location = null) {
    try {
      // Get location from user settings or use default
      if (!location) {
        location = await this.getUserLocation();
      }

      // For demo, return mock data
      // In production, integrate with weather API
      return {
        temp: 22,
        condition: 'partly_cloudy',
        description: 'Partly cloudy',
        icon: '⛅',
        humidity: 65,
        windSpeed: 10,
        forecast: 'Warm with occasional clouds'
      };
    } catch (error) {
      console.error('Error getting weather:', error);
      return {
        temp: 20,
        condition: 'unknown',
        description: 'Weather unavailable',
        icon: '🌡️'
      };
    }
  }

  /**
   * Get user location
   */
  async getUserLocation() {
    // For now, return default location
    // In production, use geolocation API or user settings
    return { lat: 40.7128, lon: -74.0060 }; // New York
  }

  /**
   * Get child's schedule
   */
  async getChildSchedule(childId, familyId) {
    try {
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

      // Get events for today from Firestore
      const eventsQuery = query(
        collection(db, 'families', familyId, 'events'),
        where('date', '>=', new Date(today.setHours(0, 0, 0, 0))),
        where('date', '<=', new Date(today.setHours(23, 59, 59, 999))),
        where('attendees', 'array-contains', childId)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Determine activity level
      const hasPhysicalActivity = events.some(e =>
        e.title?.toLowerCase().includes('sport') ||
        e.title?.toLowerCase().includes('gym') ||
        e.title?.toLowerCase().includes('play')
      );

      const hasFormalEvent = events.some(e =>
        e.title?.toLowerCase().includes('party') ||
        e.title?.toLowerCase().includes('recital') ||
        e.title?.toLowerCase().includes('photo')
      );

      return {
        dayOfWeek,
        events,
        summary: events.length > 0 ? events.map(e => e.title).join(', ') : 'Free day!',
        hasPhysicalActivity,
        hasFormalEvent,
        isWeekend: dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday',
        isSchoolDay: dayOfWeek !== 'Saturday' && dayOfWeek !== 'Sunday' && !hasFormalEvent
      };
    } catch (error) {
      console.error('Error getting schedule:', error);
      return {
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        events: [],
        summary: 'Regular day',
        isSchoolDay: true
      };
    }
  }

  /**
   * Get child's wardrobe
   */
  async getWardrobe(familyId, childId) {
    try {
      const wardrobeRef = collection(db, 'families', familyId, 'wardrobes', childId, 'items');
      const wardrobeSnapshot = await getDocs(wardrobeRef);

      const items = wardrobeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Organize by category
      const organized = {};
      for (const category of this.clothingCategories) {
        organized[category] = items.filter(item => item.category === category);
      }

      return {
        all: items,
        byCategory: organized,
        totalItems: items.length,
        favorites: items.filter(item => item.isFavorite),
        recentlyAdded: items.filter(item => {
          const added = item.addedAt?.toDate?.() || new Date(item.addedAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return added > weekAgo;
        })
      };
    } catch (error) {
      console.error('Error getting wardrobe:', error);
      return {
        all: [],
        byCategory: {},
        totalItems: 0,
        favorites: [],
        recentlyAdded: []
      };
    }
  }

  /**
   * Generate personalized greeting
   */
  generateGreeting(weather, schedule, childContext) {
    const name = childContext?.name || 'Sunshine';
    const temp = weather.temp;

    let greeting = `Good morning, ${name}! `;

    if (temp < 10) {
      greeting += "Brrr, it's chilly today! Let's find something warm to wear. 🧥";
    } else if (temp > 25) {
      greeting += "It's going to be a hot one! Time for cool, comfy clothes. ☀️";
    } else {
      greeting += "What a beautiful day! Let's pick an awesome outfit. 🌈";
    }

    if (schedule.hasFormalEvent) {
      greeting += " You have a special event today - let's dress to impress!";
    } else if (schedule.hasPhysicalActivity) {
      greeting += " Don't forget your sports gear for activities later!";
    } else if (schedule.isWeekend) {
      greeting += " It's the weekend - time for your favorite comfy clothes!";
    }

    return greeting;
  }

  /**
   * Suggest outfits based on context
   */
  async suggestOutfits(wardrobe, weather, schedule, childContext) {
    try {
      const suggestions = [];

      // Determine outfit type needed
      let outfitType = 'casual';
      if (schedule.hasFormalEvent) outfitType = 'formal';
      else if (schedule.hasPhysicalActivity) outfitType = 'sport';
      else if (schedule.isSchoolDay) outfitType = 'school';

      // Get weather-appropriate items
      const weatherAppropriate = this.filterByWeather(wardrobe.all, weather);

      // Generate 3 outfit suggestions
      for (let i = 0; i < 3; i++) {
        const outfit = await this.generateOutfit(
          weatherAppropriate,
          outfitType,
          childContext,
          i
        );

        if (outfit.items.length > 0) {
          suggestions.push(outfit);
        }
      }

      // Add AI-generated creative suggestion
      if (suggestions.length > 0) {
        const creativeOutfit = await this.generateCreativeOutfit(
          wardrobe,
          weather,
          schedule,
          childContext
        );
        if (creativeOutfit) {
          suggestions.push(creativeOutfit);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error suggesting outfits:', error);
      return [];
    }
  }

  /**
   * Filter items by weather appropriateness
   */
  filterByWeather(items, weather) {
    const appropriate = [];
    const temp = weather.temp;

    for (const item of items) {
      let isAppropriate = true;

      // Check temperature suitability
      if (item.minTemp && temp < item.minTemp) isAppropriate = false;
      if (item.maxTemp && temp > item.maxTemp) isAppropriate = false;

      // Check weather condition
      if (weather.condition === 'rainy' && !item.waterproof) {
        if (item.category === 'shoes' || item.category === 'outerwear') {
          isAppropriate = false;
        }
      }

      if (isAppropriate) {
        appropriate.push(item);
      }
    }

    return appropriate;
  }

  /**
   * Generate a specific outfit
   */
  async generateOutfit(items, outfitType, childContext, variation = 0) {
    const formula = this.outfitFormulas[outfitType] || this.outfitFormulas.casual;
    const outfit = {
      id: `outfit_${Date.now()}_${variation}`,
      type: outfitType,
      items: [],
      score: 0,
      name: '',
      description: ''
    };

    // Build outfit based on formula
    for (const requirement of formula) {
      const isOptional = requirement.includes('?');
      const cleanReq = requirement.replace('?', '');
      const options = cleanReq.split('|');

      let itemFound = false;
      for (const option of options) {
        const [category, subcategory] = option.split('-');
        const categoryItems = items.filter(i =>
          i.category === category &&
          (!subcategory || i.subcategory === subcategory)
        );

        if (categoryItems.length > 0) {
          // Select item based on variation and preferences
          const selectedItem = this.selectItem(categoryItems, variation, childContext);
          if (selectedItem) {
            outfit.items.push(selectedItem);
            itemFound = true;
            break;
          }
        }
      }

      if (!itemFound && !isOptional) {
        // Required item not found, outfit incomplete
        return outfit;
      }
    }

    // Score outfit
    outfit.score = this.scoreOutfit(outfit.items, childContext);

    // Name outfit
    outfit.name = this.nameOutfit(outfit.items, outfitType);

    // Generate description
    outfit.description = this.describeOutfit(outfit.items, outfitType);

    return outfit;
  }

  /**
   * Select item based on preferences and variation
   */
  selectItem(items, variation, childContext) {
    if (items.length === 0) return null;

    // Sort by preference score
    const scored = items.map(item => ({
      item,
      score: this.scoreItem(item, childContext)
    }));

    scored.sort((a, b) => b.score - a.score);

    // Select based on variation (0 = best, 1 = second best, etc.)
    const index = Math.min(variation, scored.length - 1);
    return scored[index].item;
  }

  /**
   * Score individual item
   */
  scoreItem(item, childContext) {
    let score = 0.5; // Base score

    // Favorite items get bonus
    if (item.isFavorite) score += 0.3;

    // Recently worn penalty
    if (item.lastWorn) {
      const daysSince = Math.floor((Date.now() - item.lastWorn.toDate().getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 2) score -= 0.2;
      else if (daysSince > 7) score += 0.1;
    }

    // Color preference
    if (childContext?.favoriteColors?.includes(item.color)) {
      score += 0.2;
    }

    // Comfort rating
    if (item.comfortRating) {
      score += item.comfortRating / 10;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Score complete outfit
   */
  scoreOutfit(items, childContext) {
    if (items.length === 0) return 0;

    let totalScore = 0;
    for (const item of items) {
      totalScore += this.scoreItem(item, childContext);
    }

    // Check color coordination
    const colors = items.map(i => i.color).filter(c => c);
    const colorScore = this.scoreColorCoordination(colors);

    // Check style consistency
    const styles = items.map(i => i.style).filter(s => s);
    const styleScore = this.scoreStyleConsistency(styles);

    return (totalScore / items.length) * 0.6 + colorScore * 0.2 + styleScore * 0.2;
  }

  /**
   * Score color coordination
   */
  scoreColorCoordination(colors) {
    if (colors.length < 2) return 1;

    // Simple color matching logic
    // In production, use color theory algorithms
    const uniqueColors = [...new Set(colors)];

    if (uniqueColors.length === 1) {
      return 0.7; // Monochrome
    } else if (uniqueColors.length === 2) {
      return 0.9; // Two-color combo
    } else if (uniqueColors.length === 3) {
      return 0.8; // Three colors
    } else {
      return 0.5; // Too many colors
    }
  }

  /**
   * Score style consistency
   */
  scoreStyleConsistency(styles) {
    if (styles.length < 2) return 1;

    const uniqueStyles = [...new Set(styles)];
    return 1 - (uniqueStyles.length - 1) * 0.2;
  }

  /**
   * Name the outfit
   */
  nameOutfit(items, outfitType) {
    const names = {
      casual: 'Comfy Day',
      formal: 'Special Occasion',
      school: 'School Ready',
      sport: 'Active Adventure',
      sleep: 'Cozy Night'
    };

    const baseName = names[outfitType] || 'Daily Look';
    const mainItem = items[0];

    if (mainItem?.name) {
      return `${baseName} with ${mainItem.name}`;
    }

    return baseName;
  }

  /**
   * Describe the outfit
   */
  describeOutfit(items, outfitType) {
    const itemNames = items.map(i => i.name || i.type).join(', ');
    return `Perfect ${outfitType} outfit: ${itemNames}`;
  }

  /**
   * Generate creative AI outfit suggestion
   */
  async generateCreativeOutfit(wardrobe, weather, schedule, childContext) {
    try {
      const prompt = `Suggest a creative, fun outfit for a ${childContext?.age || 'young'} year old child.
        Weather: ${weather.temp}°C, ${weather.condition}
        Schedule: ${schedule.summary}
        Wardrobe items available: ${wardrobe.all.map(i => `${i.name || i.type} (${i.color})`).slice(0, 20).join(', ')}
        Child's favorite colors: ${childContext?.favoriteColors?.join(', ') || 'unknown'}

        Suggest one unique, creative outfit combination that would be fun and appropriate.`;

      const response = await ClaudeService.sendMessage({
        prompt,
        systemPrompt: 'You are a fun, creative children\'s fashion advisor. Suggest playful, age-appropriate outfits.',
        temperature: 0.9
      });

      // Parse AI response
      const suggestion = {
        id: `outfit_ai_${Date.now()}`,
        type: 'creative',
        name: '✨ Allie\'s Creative Pick',
        description: response.content.substring(0, 200),
        items: [], // Would need to match AI suggestions to actual wardrobe items
        score: 0.85,
        isAISuggestion: true
      };

      return suggestion;
    } catch (error) {
      console.error('Error generating creative outfit:', error);
      return null;
    }
  }

  /**
   * Process clothing photo with AI vision
   */
  async processClothingPhoto(imageData, childId = null, familyId = null) {
    try {
      familyId = familyId || localStorage.getItem('selectedFamilyId');

      // In production, use vision API to analyze image
      // For now, return mock analysis
      const analysis = await this.analyzeImage(imageData);

      // Extract clothing details
      const clothingItems = this.extractClothingItems(analysis);

      // Store items if childId provided
      if (childId && familyId && clothingItems.length > 0) {
        await this.addClothingItems(familyId, childId, clothingItems);
      }

      return {
        success: true,
        items: analysis.detectedClothes,
        sizes: analysis.estimatedSizes,
        colors: analysis.colorPalette,
        condition: analysis.wearAssessment,
        seasonality: analysis.appropriateSeasons,
        storedCount: clothingItems.length
      };
    } catch (error) {
      console.error('Error processing clothing photo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze image (mock for now)
   */
  async analyzeImage(imageData) {
    // In production, use vision API
    // For demo, return mock data
    return {
      detectedClothes: [
        { type: 'shirt', color: 'blue', pattern: 'solid' },
        { type: 'pants', color: 'khaki', pattern: 'solid' }
      ],
      estimatedSizes: {
        shirt: '6-7 years',
        pants: '6-7 years'
      },
      colorPalette: ['blue', 'khaki', 'white'],
      wearAssessment: 'good',
      appropriateSeasons: ['spring', 'summer', 'fall']
    };
  }

  /**
   * Extract clothing items from analysis
   */
  extractClothingItems(analysis) {
    const items = [];

    for (const detected of analysis.detectedClothes) {
      const category = this.mapTypeToCategory(detected.type);

      items.push({
        type: detected.type,
        category,
        color: detected.color,
        pattern: detected.pattern,
        size: analysis.estimatedSizes[detected.type],
        condition: analysis.wearAssessment,
        seasons: analysis.appropriateSeasons,
        addedAt: new Date(),
        lastWorn: null,
        isFavorite: false,
        timesWorn: 0
      });
    }

    return items;
  }

  /**
   * Map clothing type to category
   */
  mapTypeToCategory(type) {
    const mapping = {
      'shirt': 'tops',
      't-shirt': 'tops',
      'blouse': 'tops',
      'pants': 'bottoms',
      'jeans': 'bottoms',
      'shorts': 'bottoms',
      'dress': 'dresses',
      'jacket': 'outerwear',
      'coat': 'outerwear',
      'shoes': 'shoes',
      'sneakers': 'shoes'
    };

    return mapping[type.toLowerCase()] || 'other';
  }

  /**
   * Add clothing items to wardrobe
   */
  async addClothingItems(familyId, childId, items) {
    try {
      for (const item of items) {
        const itemRef = doc(
          collection(db, 'families', familyId, 'wardrobes', childId, 'items')
        );

        await setDoc(itemRef, {
          ...item,
          id: itemRef.id,
          childId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding clothing items:', error);
      throw error;
    }
  }

  /**
   * Get last worn tracking
   */
  async getLastWornTracking(familyId, childId) {
    try {
      const wardrobeRef = collection(db, 'families', familyId, 'wardrobes', childId, 'items');
      const wardrobeSnapshot = await getDocs(wardrobeRef);

      const tracking = [];

      for (const doc of wardrobeSnapshot.docs) {
        const item = doc.data();
        if (item.lastWorn) {
          const lastWornDate = item.lastWorn.toDate();
          const daysSince = Math.floor((Date.now() - lastWornDate.getTime()) / (1000 * 60 * 60 * 24));

          tracking.push({
            itemId: doc.id,
            name: item.name || item.type,
            lastWorn: lastWornDate,
            daysSince,
            timesWorn: item.timesWorn || 0
          });
        }
      }

      tracking.sort((a, b) => b.daysSince - a.daysSince);

      return {
        leastWorn: tracking.slice(0, 5),
        mostWorn: tracking.sort((a, b) => b.timesWorn - a.timesWorn).slice(0, 5),
        needsWearing: tracking.filter(t => t.daysSince > 14)
      };
    } catch (error) {
      console.error('Error getting last worn tracking:', error);
      return {
        leastWorn: [],
        mostWorn: [],
        needsWearing: []
      };
    }
  }

  /**
   * Track outfit worn
   */
  async trackOutfitWorn(familyId, childId, outfitId, items) {
    try {
      // Update last worn for each item
      for (const item of items) {
        const itemRef = doc(db, 'families', familyId, 'wardrobes', childId, 'items', item.id);
        await updateDoc(itemRef, {
          lastWorn: serverTimestamp(),
          timesWorn: (item.timesWorn || 0) + 1,
          updatedAt: serverTimestamp()
        });
      }

      // Store outfit history
      const historyRef = doc(
        collection(db, 'families', familyId, 'wardrobes', childId, 'history')
      );

      await setDoc(historyRef, {
        outfitId,
        items: items.map(i => ({ id: i.id, name: i.name || i.type })),
        wornAt: serverTimestamp(),
        weather: await this.getWeatherData(),
        childId
      });

      return { success: true };
    } catch (error) {
      console.error('Error tracking outfit worn:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get size progression prediction
   */
  async predictSizeProgression(familyId, childId) {
    try {
      // Get size history
      const sizeHistory = await this.getSizeHistory(familyId, childId);

      if (sizeHistory.length < 2) {
        return {
          available: false,
          message: 'Need more size history for predictions'
        };
      }

      // Calculate growth rate
      const growthRate = this.calculateGrowthRate(sizeHistory);

      // Predict next sizes
      const predictions = this.predictNextSizes(sizeHistory, growthRate);

      return {
        available: true,
        currentSizes: sizeHistory[sizeHistory.length - 1],
        growthRate,
        predictions,
        recommendation: this.getSizeRecommendation(predictions)
      };
    } catch (error) {
      console.error('Error predicting size progression:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get size history
   */
  async getSizeHistory(familyId, childId) {
    try {
      const historyQuery = query(
        collection(db, 'families', familyId, 'wardrobes', childId, 'sizeHistory'),
        orderBy('recordedAt', 'desc'),
        limit(10)
      );

      const historySnapshot = await getDocs(historyQuery);
      return historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        recordedAt: doc.data().recordedAt.toDate()
      }));
    } catch (error) {
      console.error('Error getting size history:', error);
      return [];
    }
  }

  /**
   * Calculate growth rate
   */
  calculateGrowthRate(sizeHistory) {
    if (sizeHistory.length < 2) return 0;

    // Simple linear growth calculation
    // In production, use more sophisticated models
    const latest = sizeHistory[0];
    const oldest = sizeHistory[sizeHistory.length - 1];
    const monthsDiff = (latest.recordedAt - oldest.recordedAt) / (1000 * 60 * 60 * 24 * 30);

    return {
      monthlyGrowth: 1 / monthsDiff,
      estimatedMonthsPerSize: monthsDiff
    };
  }

  /**
   * Predict next sizes
   */
  predictNextSizes(sizeHistory, growthRate) {
    const current = sizeHistory[0];
    const predictions = [];

    // Predict next 6 months
    for (let months = 3; months <= 12; months += 3) {
      predictions.push({
        monthsAhead: months,
        predictedDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
        predictedSizes: this.incrementSizes(current.sizes, months * growthRate.monthlyGrowth)
      });
    }

    return predictions;
  }

  /**
   * Increment sizes based on growth
   */
  incrementSizes(currentSizes, increment) {
    // Simplified size progression
    // In production, use actual size charts
    const sizeProgression = ['2T', '3T', '4T', '5', '6', '7', '8', '10', '12', '14'];
    const incremented = {};

    for (const [category, size] of Object.entries(currentSizes)) {
      const currentIndex = sizeProgression.indexOf(size);
      if (currentIndex >= 0) {
        const newIndex = Math.min(
          currentIndex + Math.floor(increment),
          sizeProgression.length - 1
        );
        incremented[category] = sizeProgression[newIndex];
      } else {
        incremented[category] = size;
      }
    }

    return incremented;
  }

  /**
   * Get size recommendation
   */
  getSizeRecommendation(predictions) {
    if (predictions.length === 0) return 'Continue monitoring sizes';

    const nextSize = predictions[0];
    return `Consider buying ${Object.values(nextSize.predictedSizes)[0]} in ${nextSize.monthsAhead} months`;
  }

  /**
   * Mark items for donation
   */
  async markForDonation(familyId, childId, itemIds) {
    try {
      for (const itemId of itemIds) {
        const itemRef = doc(db, 'families', familyId, 'wardrobes', childId, 'items', itemId);
        await updateDoc(itemRef, {
          markedForDonation: true,
          markedAt: serverTimestamp()
        });
      }

      // Create donation batch
      const donationRef = doc(
        collection(db, 'families', familyId, 'wardrobes', childId, 'donations')
      );

      await setDoc(donationRef, {
        items: itemIds,
        createdAt: serverTimestamp(),
        status: 'pending',
        childId
      });

      return { success: true, batchId: donationRef.id };
    } catch (error) {
      console.error('Error marking for donation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daily fashion fact
   */
  getDailyFashionFact() {
    const today = new Date().getDate();
    const index = today % this.fashionFacts.length;
    return this.fashionFacts[index];
  }
}

export default new WardrobeAI();