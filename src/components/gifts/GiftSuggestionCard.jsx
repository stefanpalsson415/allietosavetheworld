// src/components/gifts/GiftSuggestionCard.jsx
import React, { useState } from 'react';
import { ShoppingCart, Heart, TrendingDown, ExternalLink, Sparkles, Trophy, Gem, Rocket } from 'lucide-react';

const GiftSuggestionCard = ({ suggestion, rank, childName, onBuyNow, onSaveLater, onTrackPrice }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const getRankEmoji = (rank) => {
    const emojis = ['🥇', '🥈', '🥉'];
    return emojis[rank - 1] || '🎁';
  };

  const getRankIcon = (rank) => {
    const icons = [Trophy, Gem, Rocket];
    const Icon = icons[rank - 1] || Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  const getActionVerb = (rank) => {
    const verbs = ['PERFECT MATCH', 'AMAZING FIND', 'GREAT CHOICE'];
    return verbs[rank - 1] || 'RECOMMENDED';
  };

  const getRankColor = (rank) => {
    const colors = [
      'from-yellow-400 to-amber-500',
      'from-gray-300 to-gray-400',
      'from-orange-400 to-orange-500'
    ];
    return colors[rank - 1] || 'from-purple-400 to-purple-500';
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    if (!isSaved && onSaveLater) {
      onSaveLater(suggestion);
    }
  };

  const handleTrackPrice = () => {
    setIsTracking(true);
    if (onTrackPrice) {
      onTrackPrice(suggestion);
    }
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(suggestion);
    } else if (suggestion.product.url) {
      window.open(suggestion.product.url, '_blank');
    }
  };

  return (
    <div className={`
      relative bg-white rounded-xl shadow-lg overflow-hidden
      ${rank === 1 ? 'ring-2 ring-yellow-400 animate-pulse-subtle' : ''}
      hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
    `}>
      {/* Rank Badge */}
      <div className={`
        absolute top-4 left-4 z-10
        bg-gradient-to-r ${getRankColor(rank)}
        text-white rounded-full px-3 py-1 flex items-center gap-2
        shadow-lg animate-float
      `}>
        <span className="text-2xl">{getRankEmoji(rank)}</span>
        <span className="text-xs font-bold uppercase tracking-wide">
          {getActionVerb(rank)}
        </span>
      </div>

      {/* Availability/Urgency Badge */}
      {suggestion.product.availability === 'low' && (
        <div className="absolute top-4 right-4 z-10 bg-red-500 text-white rounded-full px-3 py-1 animate-pulse">
          <span className="text-xs font-bold">Only {suggestion.product.stock || 3} left!</span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        {suggestion.product.image ? (
          <img
            src={suggestion.product.image}
            alt={suggestion.product.name}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="text-6xl">🎁</div>
        )}

        {/* Discount Badge */}
        {suggestion.product.originalPrice && suggestion.product.originalPrice > suggestion.product.price && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full px-2 py-1">
            <span className="text-xs font-bold">
              Save ${(suggestion.product.originalPrice - suggestion.product.price).toFixed(0)}!
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {suggestion.product.name}
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold text-green-600">
            ${suggestion.product.price}
          </span>
          {suggestion.product.originalPrice && (
            <span className="text-lg text-gray-400 line-through">
              ${suggestion.product.originalPrice}
            </span>
          )}
        </div>

        {/* Why It's Perfect */}
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed mb-2">
            {suggestion.whyPerfect}
          </p>
          <p className="text-purple-600 font-medium text-sm italic">
            {suggestion.quickReason}
          </p>
        </div>

        {/* Matched Interests */}
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestion.matchedInterests.map((interest, i) => (
            <span
              key={i}
              className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Confidence Meter */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Confidence {childName} will love this</span>
            <span className="font-bold">{(suggestion.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${
                suggestion.confidence > 0.9 ? 'from-green-400 to-green-500' :
                suggestion.confidence > 0.8 ? 'from-blue-400 to-blue-500' :
                'from-purple-400 to-purple-500'
              } animate-width`}
              style={{ width: `${suggestion.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Buy Now
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveToggle}
            className={`p-3 rounded-lg transition-all duration-200 ${
              isSaved
                ? 'bg-red-100 text-red-500 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isSaved ? "Saved!" : "Save for later"}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleTrackPrice}
            className={`p-3 rounded-lg transition-all duration-200 ${
              isTracking
                ? 'bg-blue-100 text-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isTracking ? "Tracking price!" : "Track price"}
            disabled={isTracking}
          >
            <TrendingDown className="w-5 h-5" />
          </button>
        </div>

        {/* Additional Info */}
        {(isTracking || isSaved) && (
          <div className="mt-3 text-center text-sm">
            {isTracking && (
              <p className="text-blue-600">
                ✅ We'll notify you when the price drops!
              </p>
            )}
            {isSaved && (
              <p className="text-red-600">
                ❤️ Saved to your gift ideas list
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Container component for displaying multiple gift cards
export const GiftSuggestionsDisplay = ({ suggestions, childName, onAction }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion, index) => (
          <GiftSuggestionCard
            key={suggestion.product.name}
            suggestion={suggestion}
            rank={suggestion.rank || index + 1}
            childName={childName}
            onBuyNow={(gift) => onAction?.('buy', gift)}
            onSaveLater={(gift) => onAction?.('save', gift)}
            onTrackPrice={(gift) => onAction?.('track', gift)}
          />
        ))}
      </div>
    </div>
  );
};

export default GiftSuggestionCard;