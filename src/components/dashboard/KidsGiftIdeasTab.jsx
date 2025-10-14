// KidsGiftIdeasTab.jsx
import React, { useState, useEffect } from 'react';
import { Gift, Search, Plus, Heart, Star, Bookmark, Tag, Edit, Trash, Trophy, ThumbsUp, ThumbsDown, ShoppingBag, Zap, Sparkles, FileText, X } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';

// Category icons mapping
const categoryIcons = {
  toys: <Gift size={16} />,
  characters: <Star size={16} />,
  animals: <span className="text-sm">🦁</span>,
  sensory: <span className="text-sm">👐</span>,
  books: <span className="text-sm">📚</span>,
  lego: <span className="text-sm">🧱</span>,
  games: <span className="text-sm">🎮</span>,
  sports: <span className="text-sm">🏀</span>,
  science: <span className="text-sm">🔬</span>,
  arts: <span className="text-sm">🎨</span>,
  tech: <span className="text-sm">📱</span>,
  coding: <span className="text-sm">💻</span>,
  fashion: <span className="text-sm">👕</span>,
  music: <span className="text-sm">🎵</span>,
  collecting: <span className="text-sm">🏆</span>,
  default: <Tag size={16} />
};

const KidsGiftIdeasTab = ({ externalActiveChild }) => {
  const { familyMembers, selectedUser, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [activeChild, setActiveChild] = useState(externalActiveChild || null);
  
  // Sync with external active child if provided (from parent component)
  useEffect(() => {
    if (externalActiveChild && externalActiveChild !== activeChild) {
      setActiveChild(externalActiveChild);
    }
  }, [externalActiveChild]);
  const [searchQuery, setSearchQuery] = useState('');
  const [interests, setInterests] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [childInterests, setChildInterests] = useState({
    loves: [],
    likes: [],
    passes: [],
    uncategorized: []
  });
  
  // State for personalized recommendations
  const [recommendations, setRecommendations] = useState({
    activities: [],
    content: [],
    gifts: [],
    insights: [],
    topInterests: [],
    categoryScores: {},
    nextQuestions: []
  });

  // Initialize with sample data
  useEffect(() => {
    // Find children in the family
    const children = familyMembers.filter(member => member.role === 'child');
    
    // Set the first child as active if no child is selected
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }

    // Mock categories
    setCategories([
      { id: 'all', name: 'All Interests', count: 25 },
      { id: 'tech', name: 'Technology', count: 5 },
      { id: 'games', name: 'Video Games', count: 3 },
      { id: 'music', name: 'Music', count: 2 },
      { id: 'sports', name: 'Sports', count: 4 },
      { id: 'fashion', name: 'Fashion', count: 4 },
      { id: 'beauty', name: 'Beauty', count: 1 },
      { id: 'diy', name: 'DIY', count: 0 },
      { id: 'books', name: 'Books', count: 3 },
      { id: 'cooking', name: 'Cooking', count: 0 },
      { id: 'art', name: 'Art', count: 1 },
      { id: 'outdoors', name: 'Outdoors', count: 0 },
      { id: 'decor', name: 'Room Décor', count: 2 }
    ]);

    // Sample interests for the active child - based on Lilly's data from screenshot
    const sampleInterests = [
      { id: 'clothing', category: 'fashion', name: 'Clothing', confidence: 55 },
      { id: 'makeup', category: 'beauty', name: 'Makeup', confidence: 50 },
      { id: 'journaling', category: 'art', name: 'Journaling', confidence: 55 },
      { id: 'photography', category: 'art', name: 'Photography', confidence: 50 },
      { id: 'artsupplies', category: 'art', name: 'Art Supplies', confidence: 50 },
      { id: 'anime', category: 'entertainment', name: 'Anime', confidence: 40 },
      { id: 'books', category: 'books', name: 'Books', confidence: 40 },
      { id: 'basketball', category: 'sports', name: 'Basketball', confidence: 40 },
      { id: 'music', category: 'music', name: 'Music', confidence: 40 },
      { id: 'roomdecor', category: 'decor', name: 'Room Décor', confidence: 40 },
      { id: 'gaming', category: 'games', name: 'Gaming', confidence: 40 }
    ];
    
    setInterests(sampleInterests);
    
    // Organize the interests by tier for better display
    setChildInterests({
      loves: sampleInterests.slice(0, 4),
      likes: sampleInterests.slice(4, 8),
      passes: sampleInterests.slice(8, 10),
      uncategorized: sampleInterests.slice(10)
    });

    // Sample favorites
    setFavorites([
      { id: 'clothing1', category: 'fashion', name: 'Clothing', tags: ['Fashion', 'Clothing'] },
      { id: 'makeup1', category: 'beauty', name: 'Makeup', tags: ['Beauty', 'Cosmetics'] },
      { id: 'journaling1', category: 'art', name: 'Journaling', tags: ['Crafting', 'Journaling'] },
      { id: 'photography1', category: 'art', name: 'Photography', tags: ['Media', 'Photography'] }
    ]);
    
    // Sample recommendations
    setRecommendations({
      topInterests: sampleInterests.slice(0, 5).map(i => ({...i, confidence: Math.round(i.confidence + 20)})),
      categoryScores: {
        beauty: 11,
        books: 10,
        art: 10
      },
      gifts: [
        {
          id: 'gift1',
          title: 'Art Supply Set',
          description: 'Professional-quality drawing and painting supplies',
          priceRange: '$30-50',
          brand: 'Arteza',
          categoryMatch: 'art'
        },
        {
          id: 'gift2',
          title: 'Photography Book',
          description: 'Guide to composition and lighting',
          priceRange: '$25-40',
          brand: 'National Geographic',
          categoryMatch: 'photography'
        }
      ],
      insights: [
        {
          title: 'Creative Expression',
          description: 'Strong interest in artistic activities and self-expression through visual media.'
        }
      ]
    });

    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [familyMembers, activeChild]);

  // Handle child selection
  const handleChildSelect = (childId) => {
    setActiveChild(childId);
  };

  // Get the active child's name
  const getActiveChildName = () => {
    const child = familyMembers.find(member => member.id === activeChild);
    return child ? child.name : 'Unknown';
  };

  // Get the active child's age
  const getActiveChildAge = () => {
    const child = familyMembers.find(member => member.id === activeChild);
    return child ? child.age || 0 : 0;
  };
  
  // Get category icon
  const getCategoryIcon = (category) => {
    return categoryIcons[category] || categoryIcons.default;
  };
  
  // Get a color for an interest category
  const getCategoryColor = (category) => {
    const colorMap = {
      toys: 'bg-purple-100 text-purple-800',
      characters: 'bg-pink-100 text-pink-800',
      animals: 'bg-green-100 text-green-800',
      books: 'bg-blue-100 text-blue-800',
      lego: 'bg-yellow-100 text-yellow-800',
      games: 'bg-red-100 text-red-800',
      sports: 'bg-orange-100 text-orange-800',
      science: 'bg-teal-100 text-teal-800',
      arts: 'bg-indigo-100 text-indigo-800',
      tech: 'bg-gray-100 text-gray-800',
      music: 'bg-blue-100 text-blue-800',
      fashion: 'bg-pink-100 text-pink-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[category] || colorMap.default;
  };

  // Filter interests based on search query and active category
  const getFilteredInterests = () => {
    const searchLower = searchQuery.toLowerCase();
    
    // Combine all interests for searching
    const allInterests = [
      ...childInterests.loves,
      ...childInterests.likes,
      ...childInterests.passes,
      ...childInterests.uncategorized
    ];
    
    return allInterests.filter(interest => {
      // Search by name
      const nameMatch = interest.name.toLowerCase().includes(searchLower);
      
      // Filter by category if not 'all'
      const categoryMatch = activeCategory === 'all' || interest.category === activeCategory;
      
      return nameMatch && categoryMatch;
    });
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Handle recording a gift for an interest
  const handleRecordGift = async (interestId, interestName) => {
    if (!familyId || !activeChild) return;
    
    try {
      // Show a simple dialog for capturing gift details
      const giftName = prompt(`Record gift for ${interestName}:`, `${interestName} gift`);
      
      if (!giftName) return; // User cancelled
      
      setLoading(true);
      
      // Show success message
      alert(`Gift "${giftName}" recorded successfully!`);
      
      setLoading(false);
    } catch (error) {
      console.error("Error recording gift:", error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="container mx-auto p-4">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-bold font-roboto mb-1">Kids Gift Ideas Tracker</h2>
              <p className="text-gray-600 font-roboto text-sm">
                Keep track of your children's interests for gift ideas
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search interests..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-roboto"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Add Interest button */}
              <button
                className="py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center font-roboto"
              >
                <Plus size={16} className="mr-2" />
                Add Interest
              </button>
              
              {/* Personalized Kid Survey Button */}
              <button
                className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 flex items-center font-roboto font-medium shadow transition-all"
              >
                <Sparkles size={16} className="mr-2" />
                Personalized Kid Survey
              </button>
              
              {/* Legacy Survey Button */}
              <button
                className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center font-roboto"
              >
                <Zap size={16} className="mr-2" />
                Quick Survey
              </button>
            </div>
          </div>
        </div>
        
        {/* Child Selection - only show when not controlled by parent component */}
        {!externalActiveChild && (
          <div className="mb-4 flex flex-wrap gap-2">
            {familyMembers
              .filter(member => member.role === 'child')
              .map(child => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm ${
                    activeChild === child.id 
                      ? 'bg-blue-500 text-white font-medium shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                    {child.photoURL && (
                      <img 
                        src={child.photoURL} 
                        alt={child.name} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {child.name} {child.age ? `(${child.age})` : ''}
                </button>
              ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar - Categories */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h3 className="font-medium text-lg mb-3">Categories</h3>
              
              {/* All Interests category */}
              <button
                onClick={() => setActiveCategory('all')}
                className={`w-full flex items-center px-3 py-2 rounded-md mb-2 ${
                  activeCategory === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Star size={16} className="mr-2" />
                <span>All Interests</span>
              </button>
              
              {/* Interest categories */}
              {categories.slice(1).map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md mb-2 ${
                    activeCategory === category.id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{getCategoryIcon(category.id)}</span>
                    <span>{category.name}</span>
                  </div>
                  
                  {/* Count of interests in this category */}
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 text-xs rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Survey Info Card */}
            <div className="bg-purple-50 rounded-lg shadow-sm p-4 border border-purple-100">
              <h3 className="font-medium text-purple-800 flex items-center mb-2">
                <Sparkles size={18} className="mr-2 text-purple-600" />
                Kid Surveys
              </h3>
              
              <p className="text-sm text-purple-700 mb-3">
                Run personalized surveys to understand your child's interests, learning style, and get customized gift recommendations.
              </p>
              
              <div className="space-y-2">
                <button
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md text-sm hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center font-medium shadow transition-all"
                >
                  <Sparkles size={14} className="mr-2" />
                  Personalized Survey
                </button>
                
                <button
                  className="w-full py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center justify-center"
                >
                  <Zap size={14} className="mr-2" />
                  Quick Interest Survey
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:col-span-3">
            {/* Child profile header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 overflow-hidden">
                    {activeChild && (
                      <img 
                        src={familyMembers.find(m => m.id === activeChild)?.photoURL || ''} 
                        alt={getActiveChildName()}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold">{getActiveChildName()}'s Interests</h2>
                    <p className="text-sm text-gray-500">
                      {interests.length} interests tracked • Age: {getActiveChildAge()}
                    </p>
                    
                    {/* Show category scores if available */}
                    {recommendations.categoryScores && Object.keys(recommendations.categoryScores).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(recommendations.categoryScores)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([category, score]) => (
                            <span 
                              key={category}
                              className={`text-xs ${getCategoryColor(category)} px-2 py-0.5 rounded-full capitalize`}
                            >
                              {category}: {score}%
                            </span>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:ml-auto flex flex-col md:flex-row gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center font-medium"
                  >
                    <Plus size={14} className="mr-2" />
                    Add Interest
                  </button>
                  
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md text-sm hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center font-medium shadow transition-all"
                  >
                    <Zap size={14} className="mr-2" />
                    Start Kid Survey
                  </button>
                </div>
              </div>
              
              {/* Top interests chips */}
              {recommendations.topInterests && recommendations.topInterests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center mb-2">
                    <Trophy size={16} className="text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Top Interests</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Based on survey results
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {recommendations.topInterests.map(interest => (
                      <div 
                        key={interest.id}
                        className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        <span className="mr-2">{getCategoryIcon(interest.category)}</span>
                        <span className="font-medium">{interest.name}</span>
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          {Math.round(interest.confidence)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Loves (Top Tier) */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center font-medium text-lg text-red-600">
                  <Trophy size={18} className="mr-2 text-red-500" />
                  Current Favorites
                </h3>
                <span className="text-gray-500 text-sm">
                  {childInterests.loves.length} top interests
                </span>
              </div>
              
              {childInterests.loves.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {childInterests.loves
                    .filter(interest => activeCategory === 'all' || interest.category === activeCategory)
                    .map(interest => (
                      <div 
                        key={interest.id}
                        className="border border-red-200 rounded-lg p-3 hover:border-red-400 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start mb-2">
                          <div className={`rounded-full p-2 mr-2 ${getCategoryColor(interest.category)}`}>
                            {getCategoryIcon(interest.category)}
                          </div>
                          
                          <div className="flex-grow">
                            <h4 className="font-medium flex items-center">
                              {interest.name}
                              <span className="ml-1 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                ♥
                              </span>
                            </h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="capitalize">{interest.category}</span>
                            </div>
                          </div>
                          
                          {/* Gift button */}
                          <button 
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            title="Record gift"
                            onClick={() => handleRecordGift(interest.id, interest.name)}
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 mb-2">No favorite interests identified yet</p>
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md text-sm hover:from-purple-700 hover:to-indigo-700 font-medium shadow flex items-center mx-auto"
                  >
                    <Zap size={14} className="mr-2" />
                    Start Kid Survey
                  </button>
                </div>
              )}
            </div>
            
            {/* Likes (Middle Tier) */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center font-medium text-lg text-blue-600">
                  <ThumbsUp size={18} className="mr-2 text-blue-500" />
                  Interests & Likes
                </h3>
                <span className="text-gray-500 text-sm">
                  {childInterests.likes.length} interests
                </span>
              </div>
              
              {childInterests.likes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {childInterests.likes
                    .filter(interest => activeCategory === 'all' || interest.category === activeCategory)
                    .map(interest => (
                      <div 
                        key={interest.id}
                        className="border border-blue-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start mb-2">
                          <div className={`rounded-full p-2 mr-2 ${getCategoryColor(interest.category)}`}>
                            {getCategoryIcon(interest.category)}
                          </div>
                          
                          <div className="flex-grow">
                            <h4 className="font-medium">{interest.name}</h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="capitalize">{interest.category}</span>
                            </div>
                          </div>
                          
                          {/* Gift button */}
                          <button 
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            title="Record gift"
                            onClick={() => handleRecordGift(interest.id, interest.name)}
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <ThumbsUp size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 mb-2">No regular interests identified yet</p>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    Add interests manually
                  </button>
                </div>
              )}
            </div>
            
            {/* Gift Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center font-medium text-lg">
                  <ShoppingBag size={18} className="mr-2 text-green-600" />
                  Gift Recommendations
                </h3>
                <button className="text-blue-600 text-sm hover:text-blue-800 flex items-center">
                  <Plus size={14} className="mr-1" />
                  Add Gift Idea
                </button>
              </div>
              
              {recommendations.gifts && recommendations.gifts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.gifts.map(gift => (
                    <div 
                      key={gift.id}
                      className="border border-green-200 rounded-lg p-3 hover:border-green-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start">
                        <div className={`rounded-full p-2 mr-2 bg-green-100 text-green-700`}>
                          <ShoppingBag size={14} />
                        </div>
                        
                        <div className="flex-grow">
                          <h4 className="font-medium">{gift.title}</h4>
                          <p className="text-sm text-gray-600 mb-1">{gift.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              {gift.priceRange}
                            </span>
                            {gift.brand && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                {gift.brand}
                              </span>
                            )}
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">
                              {gift.categoryMatch}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <ShoppingBag size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 mb-2">No gift recommendations yet</p>
                  <p className="text-gray-400 text-sm">
                    Complete a survey to get personalized gift ideas
                  </p>
                  <button
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md text-sm hover:from-purple-700 hover:to-indigo-700 font-medium shadow flex items-center mx-auto"
                  >
                    <Zap size={14} className="mr-2" />
                    Start Kid Survey
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsGiftIdeasTab;