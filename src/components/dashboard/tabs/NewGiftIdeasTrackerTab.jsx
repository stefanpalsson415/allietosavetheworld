import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Star, Calendar, Heart, ShoppingCart, TrendingUp, Plus, Edit2, Trash2, Check, X, Search, Filter, Package, Sparkles, Info, ThumbsUp, ThumbsDown, Meh, ArrowRight, Users, Zap, ChevronDown, ExternalLink } from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import UserAvatar from '../../common/UserAvatar';
import { useNavigate } from 'react-router-dom';
import { useSurveyDrawer } from '../../../contexts/SurveyDrawerContext';
import ChildInterestService from '../../../services/ChildInterestService';
import SiblingDynamicsService from '../../../services/SiblingDynamicsService';
import QuantumKnowledgeGraph from '../../../services/QuantumKnowledgeGraph';

import ClaudeService from '../../../services/ClaudeService';
import ProductImageService from '../../../services/ProductImageService';
import InternationalShoppingService from '../../../services/InternationalShoppingService';

const NewGiftIdeasTrackerTab = () => {
  const { familyId, familyMembers, selectedUser } = useFamily();
  const navigate = useNavigate();
  const { openSurveyDrawer } = useSurveyDrawer();
  const [activeChild, setActiveChild] = useState(null);
  const [giftIdeas, setGiftIdeas] = useState({});
  const [childInterests, setChildInterests] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingIdea, setEditingIdea] = useState(null);
  const [newIdea, setNewIdea] = useState({ 
    title: '', 
    description: '', 
    category: 'toys', 
    priority: 3,
    price: '',
    link: '',
    notes: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSmartRecommendations, setShowSmartRecommendations] = useState(false);
  const [siblingInsights, setSiblingInsights] = useState({});
  const [siblingInfluences, setSiblingInfluences] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [productCatalog, setProductCatalog] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);

  const categories = [
    { id: 'toys', label: 'Toys & Games', icon: '🎮', color: 'purple' },
    { id: 'books', label: 'Books', icon: '📚', color: 'blue' },
    { id: 'clothes', label: 'Clothing', icon: '👕', color: 'green' },
    { id: 'sports', label: 'Sports & Outdoors', icon: '⚽', color: 'orange' },
    { id: 'tech', label: 'Technology', icon: '💻', color: 'pink' },
    { id: 'arts', label: 'Arts & Crafts', icon: '🎨', color: 'indigo' },
    { id: 'music', label: 'Music', icon: '🎵', color: 'red' },
    { id: 'other', label: 'Other', icon: '🎁', color: 'gray' }
  ];

  const occasions = [
    { id: 'birthday', label: 'Birthday', icon: '🎂' },
    { id: 'christmas', label: 'Christmas', icon: '🎄' },
    { id: 'achievement', label: 'Achievement', icon: '🏆' },
    { id: 'anytime', label: 'Anytime', icon: '✨' }
  ];

  // Auto-select child based on logged-in user
  useEffect(() => {
    if (selectedUser && selectedUser.role === 'child') {
      // If logged in user is a child, auto-select them
      setActiveChild(selectedUser.id);
    } else if (familyMembers && familyMembers.length > 0) {
      // If logged in user is a parent, auto-select the first child
      const firstChild = familyMembers.find(m => m.role === 'child');
      if (firstChild) {
        setActiveChild(firstChild.id);
      }
    }
  }, [selectedUser, familyMembers]);

  // Refresh interests when survey drawer closes
  useEffect(() => {
    // Listen for survey completion event
    const handleSurveyComplete = (event) => {
      console.log('Survey complete event received', event.detail);
      // Add a delay to allow database to update
      setTimeout(() => {
        setRefreshKey(prev => prev + 1); // Trigger reload
        // Also clear product catalog to force re-fetch
        setProductCatalog([]);
      }, 1000);
    };

    window.addEventListener('survey-completed', handleSurveyComplete);
    return () => window.removeEventListener('survey-completed', handleSurveyComplete);
  }, []);

  // Load gift ideas, interests, and sibling insights
  useEffect(() => {
    if (!familyId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const ideas = {};
        const interests = {};
        const insights = {};
        const influences = {};
        const knowledgeGraph = QuantumKnowledgeGraph;
        
        for (const member of familyMembers) {
          if (member.role === 'child') {
            // Load gift ideas
            const ideasRef = collection(db, `families/${familyId}/members/${member.id}/giftIdeas`);
            const ideasQuery = query(ideasRef, orderBy('createdAt', 'desc'));
            const ideasSnapshot = await getDocs(ideasQuery);
            
            ideas[member.id] = ideasSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Load interests from survey results
            try {
              console.log('Loading interests for', member.name, member.id);
              const interestsData = await ChildInterestService.getClassifiedInterests(familyId, member.id);
              console.log('Interests loaded for', member.name, ':', interestsData);
              interests[member.id] = interestsData;
            } catch (error) {
              console.log('Error loading interests for', member.name, ':', error);
              interests[member.id] = { loves: [], likes: [], passes: [] };
            }
            
            // Load sibling dynamics
            try {
              const dynamics = await knowledgeGraph.getSiblingDynamics(familyId, member.id);
              insights[member.id] = dynamics;
              
              // Check if siblings have loved gifts that this child might like
              if (dynamics.siblings.length > 0) {
                const siblingGiftInfluences = [];
                for (const sibling of dynamics.siblings) {
                  const siblingIdeas = ideas[sibling.id] || [];
                  const lovedGifts = siblingIdeas.filter(gift => gift.rating === 5);
                  if (lovedGifts.length > 0) {
                    siblingGiftInfluences.push({
                      siblingName: sibling.properties.name,
                      siblingId: sibling.id,
                      lovedGifts
                    });
                  }
                }
                influences[member.id] = siblingGiftInfluences;
              }
            } catch (error) {
              console.log('No sibling dynamics found for', member.name);
            }
          }
        }
        
        setGiftIdeas(ideas);
        setChildInterests(interests);
        setSiblingInsights(insights);
        setSiblingInfluences(influences);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [familyId, familyMembers, refreshKey]); // Added refreshKey to dependencies

  // Fetch personalized gift recommendations from Claude
  const fetchPersonalizedProducts = async (childId) => {
    const interests = childInterests[childId];
    if (!interests) return;

    // Use loves if available, otherwise use uncategorized (survey data without ratings)
    const topInterests = interests.loves?.length > 0 ? interests.loves : interests.uncategorized;
    if (!topInterests?.length) return;

    setLoadingProducts(true);
    setProductError(null);

    try {
      const child = familyMembers.find(m => m.id === childId);

      // Create a prompt for Claude to find real products - limit to 10 to avoid truncation
      const prompt = `You are a gift discovery AI. Find 10 real, purchasable products for ${child.name}, age ${child.age || 'unknown'}.

Their top interests: ${topInterests.slice(0, 10).map(i => i.name).join(', ')}

Return ONLY a valid JSON array with 10 products. Each product must have:
- id: short unique identifier
- name: product name (keep short)
- price: number
- image: "placeholder" (we'll handle images separately)
- buyUrl: URL to buy product (Amazon ASIN or similar)
- description: one short sentence
- age: age range
- category: toys, lego, books, sports, games, crafts, or other
- rating: number between 3.5 and 5

Return ONLY the JSON array, no other text:
[{"id":"B07XYZ","name":"Product Name","price":29.99,"image":"placeholder","buyUrl":"https://amazon.com/dp/B123","description":"Short description.","age":"6+","category":"toys","rating":4.5}]`;

      const response = await ClaudeService.sendMessage(prompt, null, familyId);

      // Parse the response to extract product data
      let products = [];
      try {
        let jsonString = response;

        // Remove markdown code blocks if present
        if (jsonString.includes('```')) {
          const parts = jsonString.split('```');
          // Take the content between code blocks or after json marker
          jsonString = parts.length > 2 ? parts[1].trim() : jsonString;
          // Remove 'json' language identifier if present
          if (jsonString.startsWith('json')) {
            jsonString = jsonString.substring(4).trim();
          }
        }

        // Try to parse as-is first (if Claude returned raw JSON)
        try {
          products = JSON.parse(jsonString);
          console.log(`Directly parsed ${products.length} products`);
        } catch (e) {
          // If that fails, try to fix truncated JSON
          console.log('Direct parse failed, attempting recovery from truncated JSON');

          // Find where the JSON array starts
          const startIndex = jsonString.indexOf('[');
          if (startIndex === -1) throw new Error('No JSON array found');

          // Extract from start of array
          jsonString = jsonString.substring(startIndex);

          // Try to find complete objects even if array is truncated
          const objects = [];
          let braceCount = 0;
          let currentObject = '';
          let inString = false;
          let escapeNext = false;

          for (let i = 1; i < jsonString.length; i++) { // Start at 1 to skip opening [
            const char = jsonString[i];

            if (escapeNext) {
              currentObject += char;
              escapeNext = false;
              continue;
            }

            if (char === '\\') {
              escapeNext = true;
              currentObject += char;
              continue;
            }

            if (char === '"' && !escapeNext) {
              inString = !inString;
              currentObject += char;
              continue;
            }

            if (!inString) {
              if (char === '{') {
                if (braceCount === 0) currentObject = '{';
                else currentObject += char;
                braceCount++;
              } else if (char === '}') {
                currentObject += char;
                braceCount--;
                if (braceCount === 0) {
                  try {
                    const obj = JSON.parse(currentObject);
                    if (obj.name && obj.price) {
                      objects.push(obj);
                    }
                  } catch (e) {
                    console.log('Failed to parse object:', currentObject.substring(0, 100));
                  }
                  currentObject = '';
                }
              } else if (braceCount > 0) {
                currentObject += char;
              }
            } else {
              currentObject += char;
            }

            // Stop if we've found enough products
            if (objects.length >= 10) break;
          }

          products = objects;
          console.log(`Recovered ${products.length} products from truncated JSON`);
        }

        // Validate and add voting data
        if (Array.isArray(products) && products.length > 0) {
          // Filter and prepare products
          const validProducts = products
            .filter(p => p && typeof p === 'object' && p.name && p.price)
            .slice(0, 10) // Limit to 10 products max
            .map(product => ({
              ...product,
              id: product.id || `product-${Date.now()}-${Math.random()}`,
              votes: { up: 0, down: 0 },
              image: null, // Will be fetched by ProductImageService
              buyUrl: product.buyUrl || '#',
              description: product.description || '',
              age: product.age || 'All ages',
              category: product.category || 'toys',
              rating: product.rating || 4.0,
              brand: product.brand || null
            }));

          // Fetch real product images using the new service
          console.log(`Fetching images for ${validProducts.length} products...`);
          const productsWithImages = await ProductImageService.getProductImages(validProducts);

          products = productsWithImages;
          console.log(`Final product count with images: ${products.length}`);
        } else {
          console.error('No valid products found');
          products = [];
        }
      } catch (parseError) {
        console.error('Error parsing product data:', parseError);
        console.error('Response sample:', response.substring(0, 500));
        setProductError('Unable to load product recommendations. Please try again.');
      }

      setProductCatalog(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductError('Failed to load gift recommendations. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load products when child or interests change
  useEffect(() => {
    const interests = childInterests[activeChild];
    if (activeChild && interests) {
      // Check if we have any interests at all (in loves or uncategorized)
      const hasInterests = (interests.loves?.length > 0) || (interests.uncategorized?.length > 0);

      if (hasInterests) {
        console.log('Child interests found for', activeChild, interests);
        // Always fetch when switching children or when interests update
        fetchPersonalizedProducts(activeChild);
      } else {
        console.log('No interests found for', activeChild);
        setProductCatalog([]); // Clear products if no interests
      }
    }
  }, [activeChild, childInterests]);

  // Add new gift idea
  const addGiftIdea = async () => {
    if (!activeChild || !newIdea.title) return;

    try {
      const ideaData = {
        ...newIdea,
        createdAt: new Date(),
        childId: activeChild,
        status: 'active',
        purchased: false
      };

      const ideaRef = doc(collection(db, `families/${familyId}/members/${activeChild}/giftIdeas`));
      await setDoc(ideaRef, ideaData);

      // Update local state
      setGiftIdeas(prev => ({
        ...prev,
        [activeChild]: [{ id: ideaRef.id, ...ideaData }, ...(prev[activeChild] || [])]
      }));

      // Reset form
      setNewIdea({ 
        title: '', 
        description: '', 
        category: 'toys', 
        priority: 3,
        price: '',
        link: '',
        notes: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding gift idea:', error);
    }
  };

  // Update gift idea
  const updateGiftIdea = async (ideaId, updates) => {
    if (!activeChild) return;

    try {
      const ideaRef = doc(db, `families/${familyId}/members/${activeChild}/giftIdeas`, ideaId);
      await updateDoc(ideaRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Update local state
      setGiftIdeas(prev => ({
        ...prev,
        [activeChild]: prev[activeChild].map(idea => 
          idea.id === ideaId ? { ...idea, ...updates } : idea
        )
      }));

      setEditingIdea(null);
    } catch (error) {
      console.error('Error updating gift idea:', error);
    }
  };

  // Handle voting on products
  const handleVote = (productId, voteType) => {
    // Toggle vote
    setUserVotes(prev => ({
      ...prev,
      [productId]: prev[productId] === voteType ? null : voteType
    }));

    // Update product votes (in real app, this would be saved to database)
    setProductCatalog(prev => prev.map(product => {
      if (product.id === productId) {
        const newVotes = { ...product.votes };

        // Remove previous vote if exists
        if (userVotes[productId] === 'up') newVotes.up = Math.max(0, newVotes.up - 1);
        if (userVotes[productId] === 'down') newVotes.down = Math.max(0, newVotes.down - 1);

        // Add new vote
        if (userVotes[productId] !== voteType) {
          if (voteType === 'up') newVotes.up++;
          if (voteType === 'down') newVotes.down++;
        }

        return { ...product, votes: newVotes };
      }
      return product;
    }));
  };

  // Delete gift idea
  const deleteGiftIdea = async (ideaId) => {
    if (!activeChild || !window.confirm('Are you sure you want to delete this gift idea?')) return;

    try {
      await deleteDoc(doc(db, `families/${familyId}/members/${activeChild}/giftIdeas`, ideaId));

      // Update local state
      setGiftIdeas(prev => ({
        ...prev,
        [activeChild]: prev[activeChild].filter(idea => idea.id !== ideaId)
      }));
    } catch (error) {
      console.error('Error deleting gift idea:', error);
    }
  };

  // Filter and search ideas
  const getFilteredIdeas = () => {
    if (!activeChild || !giftIdeas[activeChild]) return [];

    let filtered = giftIdeas[activeChild];

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(idea => idea.category === filterCategory);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(idea => 
        idea.title.toLowerCase().includes(search) ||
        idea.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const renderStarRating = (priority, editable = false, onChange = null) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= priority 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${editable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={editable && onChange ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  // Generate smart recommendations based on interests
  const generateSmartRecommendations = () => {
    if (!activeChild || !childInterests[activeChild]) return [];
    
    const loves = childInterests[activeChild].loves || [];
    const likes = childInterests[activeChild].likes || [];
    const recommendations = [];
    
    // Combine interests for unique recommendations
    if (loves.length >= 2) {
      // Combine two loved interests
      for (let i = 0; i < Math.min(3, loves.length - 1); i++) {
        for (let j = i + 1; j < Math.min(4, loves.length); j++) {
          const interest1 = loves[i].name;
          const interest2 = loves[j].name;
          
          recommendations.push({
            title: `${interest1} + ${interest2} Combo`,
            description: `A perfect gift that combines their love for ${interest1.toLowerCase()} with ${interest2.toLowerCase()}`,
            category: loves[i].category || 'other',
            basedOn: [interest1, interest2]
          });
        }
      }
    }
    
    // Add recommendations based on single strong interests
    loves.slice(0, 3).forEach(love => {
      recommendations.push({
        title: `Advanced ${love.name} Kit`,
        description: `Take their ${love.name.toLowerCase()} interest to the next level with this comprehensive set`,
        category: love.category || 'other',
        basedOn: [love.name]
      });
    });
    
    return recommendations.slice(0, 4);
  };
  
  const renderGiftIdea = (idea) => {
    const category = categories.find(c => c.id === idea.category);
    
    if (editingIdea === idea.id) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={idea.title}
              onChange={(e) => setGiftIdeas(prev => ({
                ...prev,
                [activeChild]: prev[activeChild].map(i => 
                  i.id === idea.id ? { ...i, title: e.target.value } : i
                )
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Gift idea title"
            />
            
            <textarea
              value={idea.description || ''}
              onChange={(e) => setGiftIdeas(prev => ({
                ...prev,
                [activeChild]: prev[activeChild].map(i => 
                  i.id === idea.id ? { ...i, description: e.target.value } : i
                )
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description"
              rows={2}
            />
            
            <div className="flex items-center gap-3">
              <select
                value={idea.category}
                onChange={(e) => setGiftIdeas(prev => ({
                  ...prev,
                  [activeChild]: prev[activeChild].map(i => 
                    i.id === idea.id ? { ...i, category: e.target.value } : i
                  )
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={idea.price || ''}
                onChange={(e) => setGiftIdeas(prev => ({
                  ...prev,
                  [activeChild]: prev[activeChild].map(i => 
                    i.id === idea.id ? { ...i, price: e.target.value } : i
                  )
                }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Price"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Priority:</span>
                {renderStarRating(idea.priority || 3, true, (priority) => 
                  setGiftIdeas(prev => ({
                    ...prev,
                    [activeChild]: prev[activeChild].map(i => 
                      i.id === idea.id ? { ...i, priority } : i
                    )
                  }))
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => updateGiftIdea(idea.id, idea)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setEditingIdea(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all ${
        idea.purchased ? 'opacity-60' : ''
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${idea.purchased ? 'line-through' : ''}`}>
              {idea.title}
            </h3>
            {idea.description && (
              <p className="text-gray-600 text-sm mt-1">{idea.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setEditingIdea(idea.id)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => deleteGiftIdea(idea.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-1 px-2 py-1 bg-${category?.color || 'gray'}-100 text-${category?.color || 'gray'}-700 rounded-lg`}>
            <span>{category?.icon}</span>
            <span>{category?.label}</span>
          </div>
          
          {idea.price && (
            <div className="flex items-center gap-1 text-gray-600">
              <span className="font-medium">${idea.price}</span>
            </div>
          )}
          
          {renderStarRating(idea.priority || 3)}
          
          {idea.purchased && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
              <span className="text-sm font-medium">Purchased</span>
            </div>
          )}
        </div>
        
        {idea.link && (
          <a
            href={idea.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ShoppingCart size={16} />
            View Product
          </a>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const children = familyMembers.filter(m => m.role === 'child');

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {selectedUser?.role === 'child' ? 'My Gift Wishes' : 'Gift Ideas Tracker'}
        </h2>
        <p className="text-gray-600">
          {selectedUser?.role === 'child' 
            ? 'Keep track of all the gifts you wish for!' 
            : 'Keep track of gift ideas and wishes for each child'}
        </p>
      </div>

      {/* Child Selector - Only show for parents */}
      {selectedUser?.role === 'parent' && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {children.map(child => {
            const interests = childInterests[child.id] || {};
            const hasInterests = interests.loves?.length > 0 || interests.likes?.length > 0;
            
            return (
              <button
                key={child.id}
                onClick={() => setActiveChild(child.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  activeChild === child.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white border border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="relative">
                  <UserAvatar user={child} size={40} />
                  {hasInterests && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">{child.name}</div>
                  <div className={`text-xs ${activeChild === child.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {giftIdeas[child.id]?.length || 0} ideas
                    {hasInterests && ' • ✓ Survey done'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeChild && (
        <>
          {/* Interest Summary Bar */}
          {childInterests[activeChild] && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">What {children.find(c => c.id === activeChild)?.name} Loves</h3>
                  <div className="flex flex-wrap gap-2">
                    {childInterests[activeChild].loves?.slice(0, 5).map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                        <Heart size={14} className="inline mr-1 fill-current" />
                        {item.name}
                      </span>
                    ))}
                    {childInterests[activeChild].loves?.length > 5 && (
                      <span className="px-3 py-1 bg-purple-100 rounded-full text-sm text-purple-600">
                        +{childInterests[activeChild].loves.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openSurveyDrawer('kid-interest', activeChild)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap ml-4"
                >
                  <Sparkles size={18} />
                  Update Survey
                </button>
              </div>
            </div>
          )}
          
          {/* No Survey Prompt */}
          {!childInterests[activeChild]?.loves?.length && !childInterests[activeChild]?.likes?.length && (
            <div className="bg-yellow-50 rounded-xl p-6 mb-6 border border-yellow-200 text-center">
              <Sparkles size={32} className="mx-auto text-yellow-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Discover What {children.find(c => c.id === activeChild)?.name} Loves!</h3>
              <p className="text-gray-600 mb-4">Take a quick survey to uncover their interests and get personalized gift recommendations</p>
              <button
                onClick={() => openSurveyDrawer('kid-interest', activeChild)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors inline-flex items-center gap-2"
              >
                Start Interest Survey
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          
          {/* Actions Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                Add Gift Idea
              </button>

              {/* Debug: Clear image cache */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    ProductImageService.clearCache();
                    const stats = ProductImageService.getCacheStats();
                    alert(`Image cache cleared!\nPrevious cache had ${stats.totalEntries} entries`);
                    fetchPersonalizedProducts(activeChild);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                  title="Clear image cache and reload"
                >
                  Clear Cache
                </button>
              )}
              
              {childInterests[activeChild]?.loves?.length > 0 && (
                <button
                  onClick={() => setShowSmartRecommendations(!showSmartRecommendations)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Sparkles size={20} />
                  Smart Recommendations
                </button>
              )}
              
              <div className="flex items-center gap-2 flex-1">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search gift ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Gift Form */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Gift Idea</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Gift idea title *"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <select
                  value={newIdea.category}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                
                <textarea
                  placeholder="Description"
                  value={newIdea.description}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                  className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                
                <input
                  type="text"
                  placeholder="Price (optional)"
                  value={newIdea.price}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, price: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <input
                  type="url"
                  placeholder="Product link (optional)"
                  value={newIdea.link}
                  onChange={(e) => setNewIdea(prev => ({ ...prev, link: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                <div className="md:col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Priority:</span>
                    {renderStarRating(newIdea.priority, true, (priority) => 
                      setNewIdea(prev => ({ ...prev, priority }))
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addGiftIdea}
                      disabled={!newIdea.title}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Idea
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewIdea({ 
                          title: '', 
                          description: '', 
                          category: 'toys', 
                          priority: 3,
                          price: '',
                          link: '',
                          notes: ''
                        });
                      }}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sibling Insights */}
          {siblingInfluences[activeChild]?.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2 text-purple-600" size={20} />
                Sibling Gift Insights
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Based on what their siblings loved, here are some gift ideas that might work well:
              </p>
              <div className="space-y-3">
                {siblingInfluences[activeChild].map((influence, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-purple-600" size={16} />
                      <span className="text-sm font-medium text-purple-700">
                        {influence.siblingName} loved these gifts:
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {influence.lovedGifts.slice(0, 2).map((gift, gIdx) => (
                        <div key={gIdx} className="text-sm bg-purple-50 rounded p-2">
                          <div className="font-medium">{gift.title}</div>
                          <div className="text-xs text-gray-600">{categories.find(c => c.id === gift.category)?.label}</div>
                        </div>
                      ))}
                    </div>
                    {influence.lovedGifts.some(lovedGift => 
                      siblingInsights[activeChild]?.influences?.some(i => 
                        i.relationship?.properties?.type === lovedGift.category
                      )
                    ) && (
                      <p className="text-xs text-purple-600 mt-2">
                        ✨ Strong spillover effect detected in this category
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          {showSmartRecommendations && childInterests[activeChild]?.loves?.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Sparkles className="mr-2 text-blue-600" size={20} />
                Smart Gift Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateSmartRecommendations().map((rec, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-800 mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">
                        Based on: {rec.basedOn.join(' + ')}
                      </span>
                      <button
                        onClick={() => {
                          setNewIdea({
                            title: rec.title,
                            description: rec.description,
                            category: rec.category,
                            priority: 4,
                            price: '',
                            link: '',
                            notes: `Recommended based on interests in ${rec.basedOn.join(' and ')}`
                          });
                          setShowAddForm(true);
                          setShowSmartRecommendations(false);
                        }}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalized Product Catalog */}
          {childInterests[activeChild]?.loves?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Personalized Gift Suggestions
                </h3>
                <button
                  onClick={() => fetchPersonalizedProducts(activeChild)}
                  disabled={loadingProducts}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={18} />
                  {productCatalog.length > 0 ? 'Refresh Products' : 'Find Products'}
                </button>
              </div>

              {loadingProducts && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Finding perfect gifts based on {children.find(c => c.id === activeChild)?.name}'s interests...</p>
                  </div>
                </div>
              )}

              {productError && (
                <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
                  <p className="text-red-600">{productError}</p>
                  <button
                    onClick={() => fetchPersonalizedProducts(activeChild)}
                    className="mt-2 text-sm text-red-700 underline hover:no-underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {productCatalog.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {productCatalog.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                      {product.image && (
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain p-4"
                            onError={(e) => {
                              // Fallback to simple gift SVG
                              // Prevent infinite loop - just hide the broken image
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:60px;">🎁</div>';
                            }}
                          />
                        </div>
                      )}

                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h4>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-green-600">
                            ${product.price}
                          </span>
                          {product.age && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              Age {product.age}
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                        )}

                        {product.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">({product.rating})</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => handleVote(product.id, 'up')}
                            className={`flex-1 px-3 py-1.5 rounded-lg border transition-all ${
                              userVotes[product.id] === 'up'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-green-500 hover:text-green-500'
                            }`}
                          >
                            <ThumbsUp size={16} className="inline mr-1" />
                            <span className="text-sm">{product.votes?.up || 0}</span>
                          </button>
                          <button
                            onClick={() => handleVote(product.id, 'down')}
                            className={`flex-1 px-3 py-1.5 rounded-lg border transition-all ${
                              userVotes[product.id] === 'down'
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-red-500 hover:text-red-500'
                            }`}
                          >
                            <ThumbsDown size={16} className="inline mr-1" />
                            <span className="text-sm">{product.votes?.down || 0}</span>
                          </button>
                        </div>

                        {/* Only show buy button for parents */}
                        {selectedUser?.role === 'parent' && (
                          <div className="space-y-2">
                            <a
                              href={InternationalShoppingService.getPrimaryLink(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full text-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                              title="Compare prices from multiple stores"
                            >
                              <ShoppingCart size={16} />
                              Find Best Price
                              <ExternalLink size={14} />
                            </a>

                            {/* Shopping options dropdown */}
                            <button
                              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                              className="w-full text-center px-3 py-1 text-xs text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1"
                            >
                              More shopping options
                              <ChevronDown
                                size={12}
                                className={`transform transition-transform ${expandedProduct === product.id ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {expandedProduct === product.id && (
                              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                                {InternationalShoppingService.generateShoppingLinks(product).map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-2 hover:bg-white rounded transition-colors"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span>{link.icon}</span>
                                      <span className="text-gray-700">{link.platform}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">{link.availability}</span>
                                  </a>
                                ))}
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 italic">
                                    💡 {InternationalShoppingService.getShoppingTips()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Gift Ideas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFilteredIdeas().map(idea => (
              <div key={idea.id}>
                {renderGiftIdea(idea)}
              </div>
            ))}
          </div>

          {getFilteredIdeas().length === 0 && (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Gift size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchTerm || filterCategory !== 'all' 
                  ? 'No matching gift ideas found' 
                  : 'No gift ideas yet'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start adding gift ideas to keep track of what this child wants!'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewGiftIdeasTrackerTab;