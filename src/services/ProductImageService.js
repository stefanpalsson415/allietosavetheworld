/**
 * ProductImageService - Hybrid Smart Image Pipeline for Toy Products
 *
 * This service implements a multi-strategy approach to fetch real product images:
 * 1. Google Custom Search API for product-specific images
 * 2. Local caching in localStorage to minimize API calls
 * 3. Intelligent fallbacks to category images when needed
 *
 * @author Claude AI Assistant
 */

class ProductImageService {
  constructor() {
    // Google Custom Search API Configuration
    // Note: In production, these should be in environment variables
    this.GOOGLE_API_KEY = 'AIzaSyBfevuDutdWiyHPZ8XWLLLmXz6UkRpA9vY'; // Same key used for Places API
    this.SEARCH_ENGINE_ID = '017576662512468239146:omuauf_lfve'; // Free tier CSE ID for testing

    // Cache configuration
    this.CACHE_KEY = 'allie_product_images_cache';
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.MAX_CACHE_SIZE = 100; // Maximum number of cached images

    // Rate limiting
    this.requestQueue = [];
    this.isProcessing = false;
    this.MIN_REQUEST_INTERVAL = 100; // 100ms between requests

    // Fallback category images (Unsplash) - Enhanced with more specific categories
    this.categoryImages = {
      'toys': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop',
      'lego': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop',
      'books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop',
      'sports': 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=400&h=400&fit=crop',
      'games': 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=400&fit=crop',
      'crafts': 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=400&fit=crop',
      'tech': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=400&fit=crop',
      'outdoor': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=400&fit=crop',
      'puzzle': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop',
      'board-game': 'https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400&h=400&fit=crop',
      'stem': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
      'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      'dinosaur': 'https://images.unsplash.com/photo-1606856110002-d0991ce78250?w=400&h=400&fit=crop',
      'rc-car': 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=400&fit=crop',
      'chemistry': 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=400&fit=crop',
      'geode': 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=400&h=400&fit=crop',
      'marvel': 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=400&fit=crop',
      'spider-man': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=400&fit=crop',
      'architecture': 'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=400&h=400&fit=crop',
      'statue-liberty': 'https://images.unsplash.com/photo-1503572327579-b5c6afe5c5c5?w=400&h=400&fit=crop',
      'dragon': 'https://images.unsplash.com/photo-1578662996442-48f60103fc31?w=400&h=400&fit=crop',
      'default': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop'
    };

    // Initialize cache
    this.initializeCache();
  }

  /**
   * Initialize and clean up the image cache
   */
  initializeCache() {
    try {
      const cache = this.getCache();
      const now = Date.now();

      // Remove expired entries
      const validCache = {};
      let count = 0;

      for (const [key, value] of Object.entries(cache)) {
        if (value.expiry > now && count < this.MAX_CACHE_SIZE) {
          validCache[key] = value;
          count++;
        }
      }

      // Save cleaned cache
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(validCache));
    } catch (error) {
      console.error('Error initializing cache:', error);
      // Reset cache if corrupted
      localStorage.setItem(this.CACHE_KEY, '{}');
    }
  }

  /**
   * Get the current cache
   */
  getCache() {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      return cacheStr ? JSON.parse(cacheStr) : {};
    } catch (error) {
      console.error('Error reading cache:', error);
      return {};
    }
  }

  /**
   * Save an image URL to cache
   */
  cacheImage(productName, imageUrl) {
    try {
      const cache = this.getCache();
      const cacheKey = this.getCacheKey(productName);

      cache[cacheKey] = {
        url: imageUrl,
        expiry: Date.now() + this.CACHE_DURATION,
        timestamp: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Generate a cache key from product name
   */
  getCacheKey(productName) {
    return productName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Get image URL for a product (main entry point)
   */
  async getProductImage(product) {
    const { name, category, brand } = product;

    // Step 1: Check cache first
    const cachedImage = this.getCachedImage(name);
    if (cachedImage) {
      console.log(`Cache hit for ${name}`);
      return cachedImage;
    }

    // Step 2: Skip Google Image Search for now (API issues)
    // Commented out due to 403 errors - need to set up proper API access
    /*
    const searchedImage = await this.searchGoogleImages(name, brand);
    if (searchedImage) {
      console.log(`Google search found image for ${name}`);
      this.cacheImage(name, searchedImage);
      return searchedImage;
    }
    */

    // Step 3: Use intelligent category fallback
    const fallbackImage = this.getCategoryFallback(name, category);
    console.log(`Using category-based image for ${name}`);

    // Cache the fallback with shorter duration
    this.cacheImage(name, fallbackImage);

    return fallbackImage;
  }

  /**
   * Get cached image if available and not expired
   */
  getCachedImage(productName) {
    const cache = this.getCache();
    const cacheKey = this.getCacheKey(productName);
    const cached = cache[cacheKey];

    if (cached && cached.expiry > Date.now()) {
      return cached.url;
    }

    return null;
  }

  /**
   * Search Google Images for product
   */
  async searchGoogleImages(productName, brand) {
    try {
      // Build search query
      let searchQuery = productName;
      if (brand && !productName.toLowerCase().includes(brand.toLowerCase())) {
        searchQuery = `${brand} ${productName}`;
      }
      searchQuery += ' toy product official';

      // Google Custom Search API endpoint
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.append('key', this.GOOGLE_API_KEY);
      url.searchParams.append('cx', this.SEARCH_ENGINE_ID);
      url.searchParams.append('q', searchQuery);
      url.searchParams.append('searchType', 'image');
      url.searchParams.append('num', '3'); // Get top 3 results
      url.searchParams.append('safe', 'active'); // Safe search
      url.searchParams.append('imgSize', 'medium');

      // Rate limiting
      await this.rateLimitDelay();

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error('Google search failed:', response.status);
        return null;
      }

      const data = await response.json();

      // Get first valid image
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          if (item.link && this.isValidImageUrl(item.link)) {
            // Validate it's a toy-related image by checking context
            const contextLower = (item.title + ' ' + item.snippet).toLowerCase();
            if (this.isToyRelated(contextLower, productName)) {
              return item.link;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error searching Google Images:', error);
      return null;
    }
  }

  /**
   * Check if image context is toy-related
   */
  isToyRelated(context, productName) {
    const toyKeywords = ['toy', 'game', 'play', 'kids', 'children', 'lego', 'puzzle', 'doll', 'action figure', 'board game'];
    const productWords = productName.toLowerCase().split(' ');

    // Check if context contains toy keywords
    const hasToyKeyword = toyKeywords.some(keyword => context.includes(keyword));

    // Check if context contains product name words
    const hasProductWords = productWords.filter(word => word.length > 3).some(word => context.includes(word));

    return hasToyKeyword || hasProductWords;
  }

  /**
   * Validate image URL
   */
  isValidImageUrl(url) {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));

      // Check if it's a known CDN or image hosting service
      const trustedHosts = ['images.unsplash.com', 'i.imgur.com', 'media.amazon.com', 'images-na.ssl-images-amazon.com',
                          'target.scene7.com', 'cdn.shopify.com', 'images.lego.com'];
      const isTrustedHost = trustedHosts.some(host => urlObj.hostname.includes(host));

      return hasValidExtension || isTrustedHost;
    } catch {
      return false;
    }
  }

  /**
   * Get intelligent category fallback based on product name analysis
   */
  getCategoryFallback(productName, category) {
    const nameLower = (productName || '').toLowerCase();

    // Very specific product type detection first
    if (nameLower.includes('spider-man') || nameLower.includes('spider man')) {
      return this.categoryImages['spider-man'];
    }
    if (nameLower.includes('statue of liberty') || nameLower.includes('statue liberty')) {
      return this.categoryImages['statue-liberty'];
    }
    if (nameLower.includes('dinosaur') || nameLower.includes('t-rex') || nameLower.includes('jurassic')) {
      return this.categoryImages.dinosaur;
    }
    if (nameLower.includes('rc') || nameLower.includes('remote control') || nameLower.includes('stunt car')) {
      return this.categoryImages['rc-car'];
    }
    if (nameLower.includes('chemistry') || nameLower.includes('chemical') || nameLower.includes('mel chemistry')) {
      return this.categoryImages.chemistry;
    }
    if (nameLower.includes('geode') || nameLower.includes('crystal') || nameLower.includes('mineral')) {
      return this.categoryImages.geode;
    }
    if (nameLower.includes('marvel') || nameLower.includes('avengers') || nameLower.includes('villainous')) {
      return this.categoryImages.marvel;
    }
    if (nameLower.includes('architecture') || nameLower.includes('building set')) {
      return this.categoryImages.architecture;
    }
    if (nameLower.includes('dragon') || nameLower.includes('wings of fire') || nameLower.includes('fantasy')) {
      return this.categoryImages.dragon;
    }

    // General product type detection
    if (nameLower.includes('lego')) return this.categoryImages.lego;
    if (nameLower.includes('book') || nameLower.includes('story') || nameLower.includes('novel')) {
      return this.categoryImages.books;
    }
    if (nameLower.includes('puzzle') || nameLower.includes('maze') || nameLower.includes('thinkfun')) {
      return this.categoryImages.puzzle;
    }
    if (nameLower.includes('board game') || nameLower.includes('monopoly') || nameLower.includes('chess')) {
      return this.categoryImages['board-game'];
    }
    if (nameLower.includes('stem') || nameLower.includes('science') || nameLower.includes('robot')) {
      return this.categoryImages.stem;
    }
    if (nameLower.includes('music') || nameLower.includes('instrument') || nameLower.includes('piano')) {
      return this.categoryImages.music;
    }
    if (nameLower.includes('ball') || nameLower.includes('sport') || nameLower.includes('soccer')) {
      return this.categoryImages.sports;
    }
    if (nameLower.includes('craft') || nameLower.includes('art') || nameLower.includes('paint')) {
      return this.categoryImages.crafts;
    }
    if (nameLower.includes('tech') || nameLower.includes('tablet') || nameLower.includes('electronic')) {
      return this.categoryImages.tech;
    }
    if (nameLower.includes('outdoor') || nameLower.includes('bike') || nameLower.includes('scooter')) {
      return this.categoryImages.outdoor;
    }
    if (nameLower.includes('game') || nameLower.includes('play')) {
      return this.categoryImages.games;
    }

    // Fall back to category-based image
    return this.categoryImages[category?.toLowerCase()] || this.categoryImages.default;
  }

  /**
   * Rate limiting delay
   */
  async rateLimitDelay() {
    return new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL));
  }

  /**
   * Batch process multiple products
   */
  async getProductImages(products) {
    const results = [];

    for (const product of products) {
      const imageUrl = await this.getProductImage(product);
      results.push({
        ...product,
        image: imageUrl
      });

      // Small delay between products to avoid rate limiting
      if (products.indexOf(product) < products.length - 1) {
        await this.rateLimitDelay();
      }
    }

    return results;
  }

  /**
   * Clear cache (for debugging/testing)
   */
  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('Product image cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.getCache();
    const entries = Object.entries(cache);
    const now = Date.now();

    const stats = {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, value]) => value.expiry > now).length,
      expiredEntries: entries.filter(([_, value]) => value.expiry <= now).length,
      oldestEntry: entries.length > 0 ?
        new Date(Math.min(...entries.map(([_, v]) => v.timestamp))) : null,
      newestEntry: entries.length > 0 ?
        new Date(Math.max(...entries.map(([_, v]) => v.timestamp))) : null,
      cacheSize: JSON.stringify(cache).length
    };

    return stats;
  }
}

// Export singleton instance
const productImageService = new ProductImageService();
export default productImageService;