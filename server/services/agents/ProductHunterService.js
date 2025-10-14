// server/services/agents/ProductHunterService.js
// Multi-source product discovery service

const axios = require('axios');

class ProductHunterService {
  constructor(config) {
    this.config = config;

    // Product sources configuration
    this.sources = {
      AMAZON: 'amazon',
      ETSY: 'etsy',
      TARGET: 'target',
      WALMART: 'walmart',
      EDUCATIONAL: 'educational',
      SPECIALTY: 'specialty'
    };

    // For MVP, we'll use mock data
    // In production, these would be real API calls
    this.useMockData = true;

    // Initialize mock product database
    this.initializeMockProducts();
  }

  /**
   * Search products across multiple sources
   */
  async searchProducts(intersections) {
    console.log('🔍 ProductHunter: Searching for products...');

    const allProducts = [];

    for (const intersection of intersections) {
      const products = await this.searchQuery(intersection.query, intersection);
      allProducts.push(...products);
    }

    // Remove duplicates and rank
    return this.deduplicateAndRank(allProducts);
  }

  /**
   * Search with a specific query
   */
  async searchQuery(query, metadata = {}) {
    if (this.useMockData) {
      return this.searchMockProducts(query, metadata);
    }

    // In production, this would call real APIs
    const searches = [
      this.searchAmazon(query),
      this.searchEtsy(query),
      this.searchTarget(query)
    ];

    const results = await Promise.allSettled(searches);

    const products = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        products.push(...result.value);
      }
    });

    return products;
  }

  /**
   * Search specialty stores for unique items
   */
  async searchSpecialtyStores(queries) {
    const products = [];

    for (const query of queries) {
      if (this.useMockData) {
        const results = this.mockSpecialtyProducts.filter(p =>
          this.matchesQuery(p, query)
        );
        products.push(...results.map(p => ({ ...p, searchQuery: query, source: 'specialty' })));
      }
    }

    return products;
  }

  /**
   * Search educational toy stores
   */
  async searchEducationalStores(queries) {
    const products = [];

    for (const query of queries) {
      if (this.useMockData) {
        const results = this.mockEducationalProducts.filter(p =>
          this.matchesQuery(p, query)
        );
        products.push(...results.map(p => ({ ...p, searchQuery: query, source: 'educational' })));
      }
    }

    return products;
  }

  /**
   * Initialize mock product database
   */
  initializeMockProducts() {
    // These would be real products from APIs in production
    this.mockProducts = [
      // Perfect Storm Products (multiple interest matches)
      {
        id: 'lego-pirate-ship-31109',
        name: 'LEGO Creator 3-in-1 Pirate Ship with Hidden Treasure',
        price: 79.99,
        originalPrice: 99.99,
        discount: 0.20,
        image: 'https://m.media-amazon.com/images/I/81Qb6yEEkTL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B08HVXZW8P',
        description: 'Build a pirate ship, island hideout, or skull island with this amazing 3-in-1 LEGO set',
        ageRange: [9, 14],
        rating: 4.8,
        reviews: 1247,
        availability: 'in_stock',
        stockLevel: 15,
        tags: ['lego', 'pirates', 'building', 'adventure', 'treasure'],
        educationalValue: ['Problem solving', 'Fine motor skills', 'Creativity'],
        matchingKeywords: ['lego pirates', 'pirate building', 'pirate ship', 'treasure', 'adventure building']
      },
      {
        id: 'coding-dino-robot',
        name: 'Thames & Kosmos Coding T-Rex Robot Kit',
        price: 89.99,
        originalPrice: 119.99,
        discount: 0.25,
        image: 'https://m.media-amazon.com/images/I/71rKQhwMvFL._AC_SL1000_.jpg',
        url: 'https://www.amazon.com/dp/B07WZGB5VZ',
        description: 'Build and program your own T-Rex robot! Learn coding basics with this STEM kit',
        ageRange: [8, 14],
        rating: 4.7,
        reviews: 423,
        availability: 'in_stock',
        stockLevel: 8,
        tags: ['coding', 'dinosaurs', 'robots', 'STEM', 'programming', 'building'],
        educationalValue: ['Coding', 'Problem solving', 'STEM learning', 'Logic'],
        matchingKeywords: ['coding dinosaur', 'dinosaur robot', 'programming dinosaur', 'STEM dinosaur']
      },
      {
        id: 'space-lego-creator',
        name: 'LEGO Creator Space Mining Mech',
        price: 24.99,
        originalPrice: 29.99,
        discount: 0.17,
        image: 'https://m.media-amazon.com/images/I/81Dh1qPTkuL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B07W7TM73V',
        description: '3-in-1 space mech that transforms into a cargo carrier or mining robot',
        ageRange: [7, 12],
        rating: 4.9,
        reviews: 2341,
        availability: 'in_stock',
        stockLevel: 50,
        tags: ['lego', 'space', 'robots', 'building', 'mining'],
        educationalValue: ['Engineering', 'Creativity', 'Problem solving'],
        matchingKeywords: ['lego space', 'space building', 'space robot', 'mining']
      },

      // Hidden Gem Products
      {
        id: 'magnetic-tile-castle',
        name: 'PicassoTiles Magnetic Castle Building Set',
        price: 45.99,
        originalPrice: 59.99,
        discount: 0.23,
        image: 'https://m.media-amazon.com/images/I/81nP3vHHbVL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B01LWQW7GF',
        description: 'Magnetic tiles that create amazing 3D castles and structures',
        ageRange: [3, 10],
        rating: 4.8,
        reviews: 89,
        availability: 'in_stock',
        stockLevel: 12,
        tags: ['building', 'magnetic', 'castle', 'creativity', 'STEM'],
        educationalValue: ['Spatial awareness', 'Engineering', 'Creativity'],
        uniqueness: 'high',
        matchingKeywords: ['magnetic building', 'castle building', 'creative building']
      },
      {
        id: 'fossil-dig-kit-ar',
        name: 'Dig Your Own Dinosaur Fossils with AR App',
        price: 34.99,
        originalPrice: 44.99,
        discount: 0.22,
        image: 'https://m.media-amazon.com/images/I/91HFqVWCuEL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B08KH5Q9DK',
        description: 'Real fossil excavation kit with augmented reality app that brings dinosaurs to life',
        ageRange: [6, 12],
        rating: 4.9,
        reviews: 67,
        availability: 'in_stock',
        stockLevel: 5,
        tags: ['dinosaurs', 'fossils', 'science', 'AR', 'excavation', 'paleontology'],
        educationalValue: ['Paleontology', 'Science', 'Technology', 'History'],
        uniqueness: 'high',
        matchingKeywords: ['dinosaur fossil', 'dig dinosaur', 'AR dinosaur', 'excavation kit']
      },

      // Educational Trojan Products
      {
        id: 'chemistry-wizard-kit',
        name: 'Wizard Potion Science Chemistry Set',
        price: 39.99,
        originalPrice: 49.99,
        discount: 0.20,
        image: 'https://m.media-amazon.com/images/I/91YJtR9MQFL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B089KBMM2S',
        description: 'Learn chemistry through magical potion making! 30+ experiments',
        ageRange: [8, 14],
        rating: 4.7,
        reviews: 234,
        availability: 'in_stock',
        stockLevel: 20,
        tags: ['science', 'chemistry', 'magic', 'wizard', 'experiments', 'STEM'],
        educationalValue: ['Chemistry', 'Scientific method', 'Following instructions', 'Safety'],
        matchingKeywords: ['wizard science', 'potion kit', 'chemistry magic', 'science experiments']
      },
      {
        id: 'coding-board-game',
        name: 'Code & Go Robot Mouse Activity Set',
        price: 59.99,
        originalPrice: 79.99,
        discount: 0.25,
        image: 'https://m.media-amazon.com/images/I/81HJqsRmURL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B01A5YMCH8',
        description: 'Screen-free coding board game that teaches programming logic',
        ageRange: [4, 9],
        rating: 4.6,
        reviews: 1523,
        availability: 'low_stock',
        stockLevel: 3,
        tags: ['coding', 'board game', 'STEM', 'logic', 'programming', 'screen-free'],
        educationalValue: ['Coding concepts', 'Problem solving', 'Sequential thinking', 'Logic'],
        matchingKeywords: ['coding game', 'programming board game', 'robot mouse', 'screen free coding']
      },

      // Trending Products
      {
        id: 'infinity-cube-fidget',
        name: 'Galaxy Infinity Cube Fidget Toy',
        price: 12.99,
        originalPrice: 19.99,
        discount: 0.35,
        image: 'https://m.media-amazon.com/images/I/71QVTpGGxFL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B08PCQRQZT',
        description: 'Trending fidget cube with galaxy design - perfect for focus',
        ageRange: [6, 99],
        rating: 4.5,
        reviews: 5234,
        availability: 'in_stock',
        stockLevel: 100,
        tags: ['fidget', 'trending', 'galaxy', 'space', 'sensory'],
        trending: true,
        matchingKeywords: ['fidget toy', 'infinity cube', 'galaxy toy', 'sensory toy']
      }
    ];

    // Specialty store products (unique finds)
    this.mockSpecialtyProducts = [
      {
        id: 'handmade-pirate-chest',
        name: 'Handcrafted Wooden Pirate Treasure Chest',
        price: 67.99,
        originalPrice: 89.99,
        discount: 0.24,
        image: 'https://i.etsystatic.com/12345/r/il/abc123/1234567890/il_1588xN.1234567890_abcd.jpg',
        url: 'https://www.etsy.com/listing/123456789',
        description: 'Hand-painted wooden treasure chest with secret compartments',
        ageRange: [5, 15],
        rating: 5.0,
        reviews: 23,
        availability: 'made_to_order',
        stockLevel: 1,
        tags: ['pirates', 'treasure', 'wooden', 'handmade', 'storage'],
        uniqueness: 'very_high',
        craftsman: 'WoodenWonders',
        matchingKeywords: ['pirate chest', 'treasure chest', 'wooden pirates', 'handmade pirates']
      },
      {
        id: 'custom-name-puzzle',
        name: 'Personalized Wooden Name Puzzle',
        price: 34.99,
        originalPrice: 44.99,
        discount: 0.22,
        image: 'https://i.etsystatic.com/shop.jpg',
        url: 'https://www.etsy.com/listing/987654321',
        description: 'Custom wooden puzzle with child\'s name and favorite animals',
        ageRange: [2, 7],
        rating: 4.9,
        reviews: 156,
        availability: 'made_to_order',
        stockLevel: 1,
        tags: ['puzzle', 'personalized', 'wooden', 'educational', 'custom'],
        uniqueness: 'very_high',
        personalization: true,
        matchingKeywords: ['name puzzle', 'personalized puzzle', 'wooden puzzle', 'custom puzzle']
      }
    ];

    // Educational store products
    this.mockEducationalProducts = [
      {
        id: 'microscope-starter-kit',
        name: 'National Geographic Microscope Science Lab',
        price: 79.99,
        originalPrice: 99.99,
        discount: 0.20,
        image: 'https://m.media-amazon.com/images/I/71jZhFYPdZL._AC_SL1000_.jpg',
        url: 'https://www.amazon.com/dp/B07B8JF6QR',
        description: 'Complete microscope kit with 50+ experiments and specimens',
        ageRange: [8, 15],
        rating: 4.7,
        reviews: 892,
        availability: 'in_stock',
        stockLevel: 25,
        tags: ['science', 'microscope', 'STEM', 'experiments', 'biology'],
        educationalValue: ['Biology', 'Scientific observation', 'Lab skills'],
        matchingKeywords: ['microscope kit', 'science lab', 'biology kit', 'STEM microscope']
      },
      {
        id: 'math-dice-game',
        name: 'ThinkFun Math Dice Jr.',
        price: 8.99,
        originalPrice: 12.99,
        discount: 0.31,
        image: 'https://m.media-amazon.com/images/I/81NjRkyVSAL._AC_SL1500_.jpg',
        url: 'https://www.amazon.com/dp/B00388YI1G',
        description: 'Fun mental math game perfect for building math confidence',
        ageRange: [6, 10],
        rating: 4.6,
        reviews: 1234,
        availability: 'in_stock',
        stockLevel: 40,
        tags: ['math', 'dice', 'educational', 'game', 'mental math'],
        educationalValue: ['Mental math', 'Problem solving', 'Number sense'],
        matchingKeywords: ['math game', 'dice game', 'educational game', 'mental math']
      }
    ];
  }

  /**
   * Check if product matches query
   */
  matchesQuery(product, query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(w => w.length > 2);

    // Check product fields
    const productText = [
      product.name,
      product.description,
      ...(product.tags || []),
      ...(product.matchingKeywords || [])
    ].join(' ').toLowerCase();

    // Count matching words
    let matches = 0;
    queryWords.forEach(word => {
      if (productText.includes(word)) {
        matches++;
      }
    });

    // Consider it a match if at least 50% of query words match
    return matches >= Math.ceil(queryWords.length * 0.5);
  }

  /**
   * Search mock products
   */
  searchMockProducts(query, metadata) {
    const results = this.mockProducts.filter(product =>
      this.matchesQuery(product, query)
    );

    // Add metadata to results
    return results.map(product => ({
      ...product,
      searchQuery: query,
      matchedInterests: metadata.interests || [],
      discoveryMetadata: metadata,
      source: 'mock'
    }));
  }

  /**
   * Remove duplicates and rank products
   */
  deduplicateAndRank(products) {
    // Remove exact duplicates by product ID
    const seen = new Set();
    const unique = [];

    products.forEach(product => {
      if (!seen.has(product.id)) {
        seen.add(product.id);
        unique.push(product);
      }
    });

    // Rank by relevance, rating, and availability
    return unique.sort((a, b) => {
      // First by number of matched interests
      const aMatches = (a.matchedInterests || []).length;
      const bMatches = (b.matchedInterests || []).length;
      if (bMatches !== aMatches) return bMatches - aMatches;

      // Then by rating
      if (b.rating !== a.rating) return b.rating - a.rating;

      // Then by availability
      if (a.availability === 'in_stock' && b.availability !== 'in_stock') return -1;
      if (b.availability === 'in_stock' && a.availability !== 'in_stock') return 1;

      // Finally by review count (popularity)
      return (b.reviews || 0) - (a.reviews || 0);
    });
  }

  /**
   * Search Amazon (mock for now)
   */
  async searchAmazon(query) {
    // In production, this would call Amazon Product API
    // For now, return filtered mock products
    return this.searchMockProducts(query, { source: 'amazon' });
  }

  /**
   * Search Etsy (mock for now)
   */
  async searchEtsy(query) {
    // In production, this would call Etsy API
    // For now, return specialty products
    return this.mockSpecialtyProducts
      .filter(p => this.matchesQuery(p, query))
      .map(p => ({ ...p, source: 'etsy', searchQuery: query }));
  }

  /**
   * Search Target (mock for now)
   */
  async searchTarget(query) {
    // In production, this would call Target API
    // For now, return some mock products
    return this.searchMockProducts(query, { source: 'target' });
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId) {
    // Find in all mock products
    const allProducts = [
      ...this.mockProducts,
      ...this.mockSpecialtyProducts,
      ...this.mockEducationalProducts
    ];

    return allProducts.find(p => p.id === productId);
  }

  /**
   * Check product availability
   */
  async checkAvailability(productId) {
    const product = await this.getProductDetails(productId);

    if (!product) {
      return { available: false, reason: 'Product not found' };
    }

    return {
      available: product.availability === 'in_stock',
      stockLevel: product.stockLevel,
      availability: product.availability,
      estimatedDelivery: this.estimateDelivery(product)
    };
  }

  /**
   * Estimate delivery time
   */
  estimateDelivery(product) {
    const today = new Date();
    let deliveryDays = 3; // Default

    if (product.availability === 'in_stock') {
      deliveryDays = product.source === 'amazon' ? 2 : 3;
    } else if (product.availability === 'low_stock') {
      deliveryDays = 4;
    } else if (product.availability === 'made_to_order') {
      deliveryDays = 14;
    }

    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);

    return {
      date: deliveryDate,
      days: deliveryDays,
      rush: deliveryDays <= 2
    };
  }
}

module.exports = ProductHunterService;