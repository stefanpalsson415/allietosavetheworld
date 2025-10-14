/**
 * InternationalShoppingService - Smart global shopping link generator
 *
 * Generates appropriate shopping links based on:
 * - User's location (detected or configured)
 * - Product availability in different regions
 * - Platform preferences by country
 *
 * Falls back to Google Shopping which works in 100+ countries
 */

class InternationalShoppingService {
  constructor() {
    // Google Shopping domains by country
    this.googleDomains = {
      'US': 'google.com',
      'UK': 'google.co.uk',
      'CA': 'google.ca',
      'AU': 'google.com.au',
      'DE': 'google.de',
      'FR': 'google.fr',
      'IT': 'google.it',
      'ES': 'google.es',
      'NL': 'google.nl',
      'BE': 'google.be',
      'SE': 'google.se',
      'NO': 'google.no',
      'DK': 'google.dk',
      'FI': 'google.fi',
      'PL': 'google.pl',
      'JP': 'google.co.jp',
      'KR': 'google.co.kr',
      'IN': 'google.co.in',
      'BR': 'google.com.br',
      'MX': 'google.com.mx',
      'AR': 'google.com.ar',
      'ZA': 'google.co.za',
      'AE': 'google.ae',
      'SG': 'google.com.sg',
      'HK': 'google.com.hk',
      'NZ': 'google.co.nz',
      'IE': 'google.ie',
      'CH': 'google.ch',
      'AT': 'google.at',
      'PT': 'google.pt',
      'default': 'google.com'
    };

    // Amazon domains (where available)
    this.amazonDomains = {
      'US': 'amazon.com',
      'UK': 'amazon.co.uk',
      'CA': 'amazon.ca',
      'AU': 'amazon.com.au',
      'DE': 'amazon.de',
      'FR': 'amazon.fr',
      'IT': 'amazon.it',
      'ES': 'amazon.es',
      'NL': 'amazon.nl',
      'JP': 'amazon.co.jp',
      'IN': 'amazon.in',
      'BR': 'amazon.com.br',
      'MX': 'amazon.com.mx',
      'AE': 'amazon.ae',
      'SG': 'amazon.sg',
      'SE': 'amazon.se',
      'PL': 'amazon.pl',
      'BE': 'amazon.com.be',
      'TR': 'amazon.com.tr',
      'SA': 'amazon.sa',
      'EG': 'amazon.eg'
    };

    // Regional shopping platforms
    this.regionalPlatforms = {
      'SE': { // Sweden
        name: 'PriceRunner',
        searchUrl: 'https://www.pricerunner.se/search?q=',
        icon: '🇸🇪'
      },
      'NO': { // Norway
        name: 'Prisjakt',
        searchUrl: 'https://www.prisjakt.no/search?search=',
        icon: '🇳🇴'
      },
      'DK': { // Denmark
        name: 'PriceRunner DK',
        searchUrl: 'https://www.pricerunner.dk/search?q=',
        icon: '🇩🇰'
      },
      'FR': { // France
        name: 'Cdiscount',
        searchUrl: 'https://www.cdiscount.com/search/10/',
        icon: '🇫🇷'
      },
      'DE': { // Germany
        name: 'Idealo',
        searchUrl: 'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=',
        icon: '🇩🇪'
      },
      'PL': { // Poland
        name: 'Allegro',
        searchUrl: 'https://allegro.pl/listing?string=',
        icon: '🇵🇱'
      },
      'IN': { // India
        name: 'Flipkart',
        searchUrl: 'https://www.flipkart.com/search?q=',
        icon: '🇮🇳'
      },
      'BR': { // Brazil
        name: 'Mercado Livre',
        searchUrl: 'https://lista.mercadolivre.com.br/',
        icon: '🇧🇷'
      }
    };

    // Try to detect user's country from browser
    this.userCountry = this.detectCountry();
  }

  /**
   * Detect user's country from browser settings
   */
  detectCountry() {
    // Try multiple methods to detect country
    const lang = navigator.language || navigator.userLanguage || 'en-US';
    const countryCode = lang.split('-')[1] || 'US';

    // Map common language codes to countries
    const langToCountry = {
      'en-GB': 'UK',
      'en-US': 'US',
      'en-AU': 'AU',
      'en-CA': 'CA',
      'sv-SE': 'SE',
      'nb-NO': 'NO',
      'da-DK': 'DK',
      'de-DE': 'DE',
      'fr-FR': 'FR',
      'es-ES': 'ES',
      'it-IT': 'IT',
      'nl-NL': 'NL',
      'pl-PL': 'PL',
      'pt-BR': 'BR',
      'ja-JP': 'JP',
      'ko-KR': 'KR',
      'zh-CN': 'CN',
      'hi-IN': 'IN'
    };

    return langToCountry[lang] || countryCode || 'US';
  }

  /**
   * Generate shopping links for a product
   */
  generateShoppingLinks(product) {
    const links = [];
    const country = this.userCountry;
    const searchQuery = encodeURIComponent(product.name || product.title || 'toy');

    // 1. Google Shopping (always available)
    const googleDomain = this.googleDomains[country] || this.googleDomains.default;
    links.push({
      platform: 'Google Shopping',
      url: `https://shopping.${googleDomain}/search?q=${searchQuery}&tbm=shop`,
      icon: '🛍️',
      availability: 'Global',
      primary: true
    });

    // 2. Amazon (if available in country)
    if (this.amazonDomains[country]) {
      const amazonDomain = this.amazonDomains[country];
      links.push({
        platform: 'Amazon',
        url: `https://www.${amazonDomain}/s?k=${searchQuery}`,
        icon: '📦',
        availability: 'Available'
      });
    }

    // 3. Regional platform (if available)
    if (this.regionalPlatforms[country]) {
      const regional = this.regionalPlatforms[country];
      links.push({
        platform: regional.name,
        url: `${regional.searchUrl}${searchQuery}`,
        icon: regional.icon,
        availability: 'Local'
      });
    }

    // 4. eBay (global fallback)
    links.push({
      platform: 'eBay',
      url: `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`,
      icon: '🏷️',
      availability: 'Global'
    });

    // 5. Local store finder
    links.push({
      platform: 'Find Locally',
      url: `https://maps.${googleDomain}/search/toy+store+${searchQuery}`,
      icon: '📍',
      availability: 'Near You'
    });

    return links;
  }

  /**
   * Get the best primary link for user's location
   */
  getPrimaryLink(product) {
    const country = this.userCountry;
    const searchQuery = encodeURIComponent(product.name || product.title || 'toy');

    // Priority order by country
    if (country === 'SE' || country === 'NO' || country === 'DK') {
      // Nordic countries - prefer Google Shopping
      const googleDomain = this.googleDomains[country] || 'google.com';
      return `https://shopping.${googleDomain}/search?q=${searchQuery}&tbm=shop`;
    } else if (this.amazonDomains[country]) {
      // Countries with Amazon - use Amazon
      return `https://www.${this.amazonDomains[country]}/s?k=${searchQuery}`;
    } else if (this.regionalPlatforms[country]) {
      // Countries with regional platform
      const regional = this.regionalPlatforms[country];
      return `${regional.searchUrl}${searchQuery}`;
    } else {
      // Default to Google Shopping
      const googleDomain = this.googleDomains[country] || 'google.com';
      return `https://shopping.${googleDomain}/search?q=${searchQuery}&tbm=shop`;
    }
  }

  /**
   * Generate smart shopping button with dropdown
   */
  generateShoppingButton(product, isParent = true) {
    if (!isParent) {
      // Kids don't see buy buttons
      return null;
    }

    const primaryLink = this.getPrimaryLink(product);
    const allLinks = this.generateShoppingLinks(product);

    return {
      primary: {
        url: primaryLink,
        text: 'Find Best Price',
        className: 'bg-gradient-to-r from-purple-500 to-pink-500'
      },
      alternatives: allLinks,
      country: this.userCountry
    };
  }

  /**
   * Get country-specific shopping tips
   */
  getShoppingTips() {
    const country = this.userCountry;

    const tips = {
      'SE': 'Google Shopping visar priser från svenska butiker. PriceRunner jämför också priser.',
      'US': 'Check Amazon for Prime delivery and Google Shopping for price comparison.',
      'UK': 'Compare prices on Google Shopping and check Amazon for next-day delivery.',
      'DE': 'Idealo zeigt Preisvergleiche. Amazon hat oft Prime-Versand.',
      'FR': 'Cdiscount et Amazon ont souvent les meilleurs prix.',
      'default': 'Google Shopping compares prices from multiple stores in your country.'
    };

    return tips[country] || tips.default;
  }
}

// Export singleton instance
const internationalShoppingService = new InternationalShoppingService();
export default internationalShoppingService;