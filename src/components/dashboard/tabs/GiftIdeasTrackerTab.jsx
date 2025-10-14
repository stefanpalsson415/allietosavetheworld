import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Search, Plus, Heart, Star, Bookmark, Tag, ShoppingBag, Sparkles, TrendingUp, Calendar, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import UserAvatar from '../../common/UserAvatar';
import ChildInterestService from '../../../services/ChildInterestService';

const GiftIdeasTrackerTab = () => {
  const { familyId, familyMembers } = useFamily();
  const [activeChild, setActiveChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [editingGift, setEditingGift] = useState(null);

  // State for child data
  const [childProfile, setChildProfile] = useState({});
  const [interests, setInterests] = useState([]);
  const [giftIdeas, setGiftIdeas] = useState([]);
  const [purchasedGifts, setPurchasedGifts] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});

  // Gift form state
  const [giftForm, setGiftForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    link: '',
    priority: 'medium',
    occasion: '',
    notes: ''
  });

  // Category definitions
  const categories = {
    toys: { name: 'Toys & Games', icon: '🎮', color: 'purple' },
    books: { name: 'Books', icon: '📚', color: 'blue' },
    clothes: { name: 'Clothing', icon: '👕', color: 'pink' },
    sports: { name: 'Sports', icon: '⚽', color: 'green' },
    arts: { name: 'Arts & Crafts', icon: '🎨', color: 'orange' },
    tech: { name: 'Technology', icon: '💻', color: 'gray' },
    music: { name: 'Music', icon: '🎵', color: 'indigo' },
    outdoor: { name: 'Outdoor', icon: '🏕️', color: 'teal' },
    education: { name: 'Educational', icon: '🎓', color: 'yellow' },
    collectibles: { name: 'Collectibles', icon: '🏆', color: 'red' }
  };

  // Get children from family members
  const children = familyMembers.filter(member => member.role === 'child');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    if (activeChild && familyId) {
      loadChildData();
    }
  }, [activeChild, familyId]);

  const loadChildData = async () => {
    try {
      setLoading(true);
      
      // Load child profile
      const childRef = doc(db, 'families', familyId, 'childProfiles', activeChild);
      const childDoc = await getDoc(childRef);
      
      if (childDoc.exists()) {
        setChildProfile(childDoc.data());
      } else {
        // Initialize profile
        const child = children.find(c => c.id === activeChild);
        const newProfile = {
          childId: activeChild,
          name: child?.name || 'Unknown',
          age: child?.age || 0,
          birthDate: child?.birthDate,
          interests: [],
          favoriteColors: [],
          clothingSize: '',
          shoeSize: '',
          lastUpdated: new Date().toISOString()
        };
        await setDoc(childRef, newProfile);
        setChildProfile(newProfile);
      }

      // Load interests
      const interestsData = await ChildInterestService.getChildInterests(familyId, activeChild);
      setInterests(interestsData.interests || []);

      // Load gift ideas
      const giftsQuery = query(
        collection(db, 'families', familyId, 'giftIdeas'),
        where('childId', '==', activeChild),
        where('purchased', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const giftsSnapshot = await getDocs(giftsQuery);
      const giftsData = [];
      giftsSnapshot.forEach(doc => {
        giftsData.push({ id: doc.id, ...doc.data() });
      });
      setGiftIdeas(giftsData);

      // Load purchased gifts
      const purchasedQuery = query(
        collection(db, 'families', familyId, 'giftIdeas'),
        where('childId', '==', activeChild),
        where('purchased', '==', true),
        orderBy('purchasedDate', 'desc')
      );
      
      const purchasedSnapshot = await getDocs(purchasedQuery);
      const purchasedData = [];
      purchasedSnapshot.forEach(doc => {
        purchasedData.push({ id: doc.id, ...doc.data() });
      });
      setPurchasedGifts(purchasedData);

      // Calculate category statistics
      calculateCategoryStats(interestsData.interests || []);

    } catch (error) {
      console.error('Error loading child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryStats = (interestsList) => {
    const stats = {};
    interestsList.forEach(interest => {
      const category = interest.category || 'other';
      if (!stats[category]) {
        stats[category] = { count: 0, totalScore: 0 };
      }
      stats[category].count++;
      stats[category].totalScore += interest.score || 50;
    });

    // Calculate average scores
    Object.keys(stats).forEach(category => {
      stats[category].averageScore = Math.round(stats[category].totalScore / stats[category].count);
    });

    setCategoryStats(stats);
  };

  const handleAddGift = async () => {
    try {
      const giftData = {
        ...giftForm,
        childId: activeChild,
        createdAt: new Date().toISOString(),
        purchased: false,
        createdBy: 'parent' // You might want to track which parent added it
      };

      await addDoc(collection(db, 'families', familyId, 'giftIdeas'), giftData);
      
      // Reset form and reload
      setGiftForm({
        title: '',
        description: '',
        category: '',
        price: '',
        link: '',
        priority: 'medium',
        occasion: '',
        notes: ''
      });
      setShowAddGiftModal(false);
      await loadChildData();
    } catch (error) {
      console.error('Error adding gift:', error);
    }
  };

  const handleMarkPurchased = async (giftId) => {
    try {
      const giftRef = doc(db, 'families', familyId, 'giftIdeas', giftId);
      await updateDoc(giftRef, {
        purchased: true,
        purchasedDate: new Date().toISOString()
      });
      await loadChildData();
    } catch (error) {
      console.error('Error marking gift as purchased:', error);
    }
  };

  const handleDeleteGift = async (giftId) => {
    if (window.confirm('Are you sure you want to delete this gift idea?')) {
      try {
        await deleteDoc(doc(db, 'families', familyId, 'giftIdeas', giftId));
        await loadChildData();
      } catch (error) {
        console.error('Error deleting gift:', error);
      }
    }
  };

  const getFilteredGifts = () => {
    let filtered = giftIdeas;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gift => 
        gift.title.toLowerCase().includes(query) ||
        gift.description?.toLowerCase().includes(query) ||
        gift.notes?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(gift => gift.category === activeCategory);
    }
    
    return filtered;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTopInterests = () => {
    return interests
      .sort((a, b) => (b.score || 50) - (a.score || 50))
      .slice(0, 5);
  };

  const getRecommendedCategories = () => {
    return Object.entries(categoryStats)
      .sort((a, b) => b[1].averageScore - a[1].averageScore)
      .slice(0, 3)
      .map(([category, stats]) => ({
        category,
        score: stats.averageScore,
        name: categories[category]?.name || category
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Gift className="animate-pulse h-12 w-12 text-purple-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading gift ideas...</p>
        </div>
      </div>
    );
  }

  const activeChildData = children.find(c => c.id === activeChild);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gift Ideas Tracker</h1>
            <p className="text-gray-600 mt-1">Track interests and gift ideas for your children</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInterestModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Sparkles size={18} className="mr-2" />
              Kid Survey
            </button>
            <button
              onClick={() => setShowAddGiftModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add Gift Idea
            </button>
          </div>
        </div>

        {/* Child Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChild(child.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeChild === child.id
                  ? 'bg-purple-50 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <UserAvatar user={child} size="small" />
              <span className="font-medium whitespace-nowrap">{child.name}</span>
              {child.age && <span className="text-sm text-gray-500">Age {child.age}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gift ideas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center ${
                  activeCategory === key
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Gift Ideas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Gift Ideas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Gift className="mr-2 text-purple-500" size={20} />
              Gift Ideas ({getFilteredGifts().length})
            </h2>
            
            {getFilteredGifts().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredGifts().map(gift => (
                  <div key={gift.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{gift.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(gift.priority)}`}>
                        {gift.priority}
                      </span>
                    </div>
                    
                    {gift.description && (
                      <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        {gift.price && (
                          <span className="text-gray-700 font-medium">${gift.price}</span>
                        )}
                        {gift.category && categories[gift.category] && (
                          <span className="text-gray-500">
                            {categories[gift.category].icon} {categories[gift.category].name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {gift.link && (
                          <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ShoppingBag size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => handleMarkPurchased(gift.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Mark as purchased"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGift(gift.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {gift.occasion && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Calendar size={12} className="inline mr-1" />
                        {gift.occasion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift className="mx-auto mb-2" size={32} />
                <p>No gift ideas yet. Add some ideas to get started!</p>
              </div>
            )}
          </div>

          {/* Purchase History */}
          {purchasedGifts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-500" size={20} />
                Recently Purchased
              </h2>
              
              <div className="space-y-3">
                {purchasedGifts.slice(0, 5).map(gift => (
                  <div key={gift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{gift.title}</h4>
                      <p className="text-sm text-gray-600">
                        Purchased {new Date(gift.purchasedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {gift.price && (
                      <span className="text-gray-700 font-medium">${gift.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Interests and Insights */}
        <div className="space-y-6">
          {/* Top Interests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="mr-2 text-yellow-500" size={20} />
              Top Interests
            </h2>
            
            {getTopInterests().length > 0 ? (
              <div className="space-y-3">
                {getTopInterests().map((interest, index) => (
                  <div key={interest.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{index + 1}</span>
                      <div>
                        <div className="font-medium">{interest.name}</div>
                        <div className="text-sm text-gray-500">{interest.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">
                        {interest.score || 50}%
                      </div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Sparkles className="mx-auto mb-2" size={24} />
                <p className="text-sm">Run a kid survey to discover interests</p>
              </div>
            )}
          </div>

          {/* Category Insights */}
          {Object.keys(categoryStats).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-blue-500" size={20} />
                Category Insights
              </h2>
              
              <div className="space-y-3">
                {getRecommendedCategories().map(cat => (
                  <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{categories[cat.category]?.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{cat.score}%</div>
                      <div className="text-xs text-gray-500">interest</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <AlertCircle size={16} className="inline mr-1" />
                  Focus gift searches on these categories for best matches!
                </p>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2 text-gray-500" size={20} />
              {activeChildData?.name}'s Info
            </h2>
            
            <div className="space-y-3">
              {activeChildData?.age && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Age</span>
                  <span className="font-medium">{activeChildData.age} years</span>
                </div>
              )}
              {childProfile.clothingSize && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Clothing Size</span>
                  <span className="font-medium">{childProfile.clothingSize}</span>
                </div>
              )}
              {childProfile.shoeSize && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shoe Size</span>
                  <span className="font-medium">{childProfile.shoeSize}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Gift Ideas</span>
                <span className="font-medium">{giftIdeas.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purchased This Year</span>
                <span className="font-medium">{purchasedGifts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Gift Modal */}
      {showAddGiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Gift Idea</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gift Title *
                </label>
                <input
                  type="text"
                  value={giftForm.title}
                  onChange={(e) => setGiftForm({ ...giftForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., LEGO Star Wars Set"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={giftForm.description}
                  onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  rows="2"
                  placeholder="Additional details about the gift..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={giftForm.category}
                    onChange={(e) => setGiftForm({ ...giftForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {Object.entries(categories).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={giftForm.price}
                    onChange={(e) => setGiftForm({ ...giftForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="25.99"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link
                </label>
                <input
                  type="url"
                  value={giftForm.link}
                  onChange={(e) => setGiftForm({ ...giftForm, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={giftForm.priority}
                    onChange={(e) => setGiftForm({ ...giftForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={giftForm.occasion}
                    onChange={(e) => setGiftForm({ ...giftForm, occasion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Birthday, Christmas..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={giftForm.notes}
                  onChange={(e) => setGiftForm({ ...giftForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  rows="2"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddGiftModal(false);
                  setGiftForm({
                    title: '',
                    description: '',
                    category: '',
                    price: '',
                    link: '',
                    priority: 'medium',
                    occasion: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGift}
                disabled={!giftForm.title}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Gift Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interest Survey Modal Placeholder */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Kid Interest Survey</h3>
            
            <div className="text-center py-8">
              <Sparkles className="mx-auto mb-4 text-purple-500" size={48} />
              <p className="text-gray-600 mb-4">
                The personalized kid survey helps you understand your child's interests, 
                preferences, and gift ideas through fun, age-appropriate questions.
              </p>
              <p className="text-sm text-gray-500">
                This feature will launch the full survey experience.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInterestModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftIdeasTrackerTab;