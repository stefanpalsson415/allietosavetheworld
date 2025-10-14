// server/services/agents/MarketIntelligenceService.js
// Tracks prices, availability, and deals across multiple sources

class MarketIntelligenceService {
  constructor() {
    // Price tracking thresholds
    this.priceAlertThreshold = 0.15; // Alert when 15% price drop
    this.stockAlertThreshold = 5; // Alert when less than 5 in stock

    // Retailer configurations
    this.retailers = {
      amazon: {
        name: 'Amazon',
        baseUrl: 'https://www.amazon.com/dp/',
        primeEligible: true,
        avgShipping: 2
      },
      target: {
        name: 'Target',
        baseUrl: 'https://www.target.com/p/',
        pickupAvailable: true,
        avgShipping: 3
      },
      walmart: {
        name: 'Walmart',
        baseUrl: 'https://www.walmart.com/ip/',
        pickupAvailable: true,
        avgShipping: 3
      },
      educational: {
        name: 'Educational Insights',
        baseUrl: 'https://www.educationalinsights.com/product/',
        specialized: true,
        avgShipping: 5
      }
    };

    // Mock price history for MVP
    this.priceHistory = new Map();
    this.initializeMockPriceData();
  }

  initializeMockPriceData() {
    // Initialize with some price history
    this.priceHistory.set('lego-pirate-ship-31109', [
      { date: new Date('2025-09-01'), price: 99.99, retailer: 'amazon' },
      { date: new Date('2025-09-10'), price: 89.99, retailer: 'amazon' },
      { date: new Date('2025-09-15'), price: 79.99, retailer: 'amazon' }, // Current deal!
    ]);

    this.priceHistory.set('coding-dino-robot', [
      { date: new Date('2025-09-01'), price: 89.99, retailer: 'target' },
      { date: new Date('2025-09-18'), price: 84.99, retailer: 'walmart' }
    ]);
  }

  /**
   * Monitor product for price changes
   */
  async monitorProduct(productId, targetPrice = null) {
    console.log(`📊 Monitoring product ${productId} for price changes`);

    const currentPrice = await this.getCurrentPrice(productId);
    const history = this.priceHistory.get(productId) || [];

    // Check if price dropped
    if (history.length > 0) {
      const lastPrice = history[history.length - 2]?.price;
      if (lastPrice && currentPrice.price < lastPrice) {
        const dropPercent = ((lastPrice - currentPrice.price) / lastPrice) * 100;

        if (dropPercent >= this.priceAlertThreshold * 100) {
          return {
            alert: true,
            type: 'price_drop',
            message: `🎉 Price dropped ${dropPercent.toFixed(0)}% to $${currentPrice.price}!`,
            previousPrice: lastPrice,
            currentPrice: currentPrice.price,
            retailer: currentPrice.retailer,
            buyNow: dropPercent > 20 // Strong buy signal if >20% drop
          };
        }
      }
    }

    // Check against target price
    if (targetPrice && currentPrice.price <= targetPrice) {
      return {
        alert: true,
        type: 'target_reached',
        message: `✅ Reached your target price of $${targetPrice}!`,
        currentPrice: currentPrice.price,
        retailer: currentPrice.retailer,
        buyNow: true
      };
    }

    return {
      alert: false,
      currentPrice: currentPrice.price,
      tracking: true
    };
  }

  /**
   * Get current price and availability
   */
  async getCurrentPrice(productId) {
    // In production, this would call retailer APIs
    // For MVP, return mock data with some randomization

    const basePrice = this.getBasePrice(productId);
    const retailer = this.selectBestRetailer(productId);

    // Simulate price variations
    const variation = (Math.random() - 0.5) * 0.1; // ±10% variation
    const currentPrice = basePrice * (1 + variation);

    // Simulate stock levels
    const stock = Math.floor(Math.random() * 50) + 1;

    return {
      productId,
      price: Math.round(currentPrice * 100) / 100,
      originalPrice: basePrice,
      retailer: retailer.name,
      retailerUrl: `${retailer.baseUrl}${productId}`,
      inStock: stock > 0,
      stockLevel: stock,
      lowStock: stock < this.stockAlertThreshold,
      primeEligible: retailer.primeEligible || false,
      pickupAvailable: retailer.pickupAvailable || false,
      estimatedDelivery: this.calculateDeliveryDate(retailer.avgShipping),
      lastChecked: new Date()
    };
  }

  /**
   * Find best deal across all retailers
   */
  async findBestDeal(productId, options = {}) {
    console.log(`🔍 Finding best deal for ${productId}`);

    const deals = [];

    // Check each retailer
    for (const [key, retailer] of Object.entries(this.retailers)) {
      const price = await this.getCurrentPrice(productId);

      deals.push({
        retailer: retailer.name,
        price: price.price,
        url: `${retailer.baseUrl}${productId}`,
        shipping: retailer.avgShipping,
        benefits: this.getRetailerBenefits(retailer),
        score: this.calculateDealScore(price, retailer, options)
      });
    }

    // Sort by score (considers price, shipping speed, and user preferences)
    deals.sort((a, b) => b.score - a.score);

    const bestDeal = deals[0];
    const savings = deals[deals.length - 1].price - bestDeal.price;

    return {
      bestDeal,
      allDeals: deals,
      savings: savings > 0 ? savings : 0,
      recommendation: this.generateDealRecommendation(bestDeal, savings)
    };
  }

  /**
   * Track competitor products
   */
  async findAlternatives(product, priceRange = 0.3) {
    console.log(`🔄 Finding alternatives to ${product.name}`);

    // In production, this would search for similar products
    // For MVP, return mock alternatives

    const alternatives = [
      {
        name: 'Similar Product A',
        price: product.price * 0.8,
        similarity: 0.85,
        pros: ['Lower price', 'Good reviews'],
        cons: ['Less features'],
        url: '#'
      },
      {
        name: 'Premium Alternative',
        price: product.price * 1.3,
        similarity: 0.9,
        pros: ['Better quality', 'More features'],
        cons: ['Higher price'],
        url: '#'
      }
    ];

    return alternatives.filter(alt =>
      Math.abs(alt.price - product.price) / product.price <= priceRange
    );
  }

  /**
   * Predict price trends
   */
  predictPriceTrend(productId) {
    const history = this.priceHistory.get(productId) || [];

    if (history.length < 2) {
      return { trend: 'insufficient_data' };
    }

    // Simple trend analysis
    const recentPrices = history.slice(-5);
    const avgRecent = recentPrices.reduce((sum, h) => sum + h.price, 0) / recentPrices.length;
    const firstPrice = recentPrices[0].price;
    const lastPrice = recentPrices[recentPrices.length - 1].price;

    let trend = 'stable';
    if (lastPrice < firstPrice * 0.95) trend = 'decreasing';
    if (lastPrice > firstPrice * 1.05) trend = 'increasing';

    // Predict best time to buy
    let buyRecommendation = 'buy_now';
    if (trend === 'decreasing') {
      buyRecommendation = 'wait'; // Prices still dropping
    } else if (trend === 'increasing') {
      buyRecommendation = 'buy_now'; // Prices going up
    }

    // Check for seasonal patterns (simplified)
    const month = new Date().getMonth();
    const isHolidaySeason = month >= 10 || month === 0; // Nov, Dec, Jan

    if (isHolidaySeason && trend !== 'decreasing') {
      buyRecommendation = 'buy_soon'; // Prices likely to increase
    }

    return {
      trend,
      currentPrice: lastPrice,
      avgPrice: avgRecent,
      buyRecommendation,
      confidence: history.length >= 5 ? 'high' : 'medium',
      analysis: this.generateTrendAnalysis(trend, buyRecommendation)
    };
  }

  /**
   * Check product availability for urgent gifts
   */
  async checkUrgentAvailability(productId, deadline) {
    const availability = await this.getCurrentPrice(productId);
    const daysUntilDeadline = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

    const options = [];

    // Check each retailer for fastest delivery
    for (const [key, retailer] of Object.entries(this.retailers)) {
      const canDeliver = retailer.avgShipping <= daysUntilDeadline;

      if (canDeliver) {
        options.push({
          retailer: retailer.name,
          deliveryDays: retailer.avgShipping,
          guaranteed: retailer.avgShipping < daysUntilDeadline - 1,
          expedited: retailer.avgShipping === 1,
          pickup: retailer.pickupAvailable
        });
      }
    }

    // Sort by delivery speed
    options.sort((a, b) => a.deliveryDays - b.deliveryDays);

    return {
      canMeetDeadline: options.length > 0,
      fastestOption: options[0],
      allOptions: options,
      recommendation: this.generateUrgencyRecommendation(options, daysUntilDeadline)
    };
  }

  /**
   * Helper functions
   */
  getBasePrice(productId) {
    const basePrices = {
      'lego-pirate-ship-31109': 79.99,
      'coding-dino-robot': 89.99,
      'dino-dig-ar-kit': 45.99,
      'art-science-volcano': 34.99,
      'unicorn-terrarium': 29.99,
      'robot-coding-cards': 24.99,
      'mystery-puzzle-box': 39.99,
      'space-projector': 49.99
    };

    return basePrices[productId] || 39.99;
  }

  selectBestRetailer(productId) {
    // For MVP, randomly select to simulate different best prices
    const retailers = Object.values(this.retailers);
    return retailers[Math.floor(Math.random() * retailers.length)];
  }

  calculateDeliveryDate(shippingDays) {
    const date = new Date();
    date.setDate(date.getDate() + shippingDays);
    return date;
  }

  getRetailerBenefits(retailer) {
    const benefits = [];
    if (retailer.primeEligible) benefits.push('Free 2-day shipping');
    if (retailer.pickupAvailable) benefits.push('Store pickup available');
    if (retailer.specialized) benefits.push('Educational specialist');
    return benefits;
  }

  calculateDealScore(price, retailer, options) {
    let score = 100;

    // Price factor (40% weight)
    score -= price.price * 0.4;

    // Shipping speed factor (30% weight)
    score -= retailer.avgShipping * 10;

    // Stock availability (20% weight)
    if (price.lowStock) score -= 20;

    // Retailer benefits (10% weight)
    if (retailer.primeEligible) score += 5;
    if (retailer.pickupAvailable) score += 5;

    // User preferences
    if (options.preferFastShipping && retailer.avgShipping <= 2) score += 10;
    if (options.preferPickup && retailer.pickupAvailable) score += 10;

    return score;
  }

  generateDealRecommendation(bestDeal, savings) {
    if (savings > 20) {
      return `🔥 HOT DEAL! Save $${savings.toFixed(2)} at ${bestDeal.retailer}!`;
    } else if (bestDeal.benefits.includes('Free 2-day shipping')) {
      return `⚡ Best value with fast shipping at ${bestDeal.retailer}`;
    } else {
      return `✅ Best price found at ${bestDeal.retailer}`;
    }
  }

  generateTrendAnalysis(trend, recommendation) {
    const analyses = {
      decreasing: {
        wait: 'Prices are still dropping. Consider waiting a few days.',
        buy_now: 'Price just dropped! Good time to buy.',
        buy_soon: 'Prices dropping but holiday season approaching.'
      },
      increasing: {
        buy_now: 'Prices are rising. Buy now before they go higher!',
        wait: 'Prices rising but may stabilize soon.',
        buy_soon: 'Prices trending up. Buy within a week.'
      },
      stable: {
        buy_now: 'Prices stable. Safe to buy anytime.',
        wait: 'Prices stable. No rush to buy.',
        buy_soon: 'Prices stable but may increase for holidays.'
      }
    };

    return analyses[trend]?.[recommendation] || 'Monitor for changes.';
  }

  generateUrgencyRecommendation(options, daysUntilDeadline) {
    if (options.length === 0) {
      return '⚠️ Cannot deliver by deadline. Consider digital gift card or store pickup.';
    }

    const fastest = options[0];
    if (fastest.expedited) {
      return `✅ Can deliver tomorrow with ${fastest.retailer} expedited shipping!`;
    } else if (fastest.pickup) {
      return `✅ Available for same-day pickup at ${fastest.retailer}!`;
    } else if (fastest.guaranteed) {
      return `✅ Will arrive on time with ${fastest.deliveryDays}-day shipping from ${fastest.retailer}`;
    } else {
      return `⚡ Order TODAY from ${fastest.retailer} for delivery by deadline`;
    }
  }
}

module.exports = MarketIntelligenceService;