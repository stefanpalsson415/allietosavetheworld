import React, { useState, useEffect, useCallback } from 'react';
import { Shirt, TrendingUp, Calendar, ShoppingBag, RefreshCw, Users, Plus, AlertCircle, CheckCircle, Sun, Cloud, Snowflake, Droplets, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import UserAvatar from '../../common/UserAvatar';
import QuantumKnowledgeGraph from '../../../services/QuantumKnowledgeGraph';

const WardrobeConciergeTab = () => {
  const { familyId, familyMembers } = useFamily();
  const [activeChild, setActiveChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wardrobeData, setWardrobeData] = useState({});
  const [currentSeason, setCurrentSeason] = useState('summer');
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [shoppingList, setShoppingList] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [siblingHandMeDowns, setSiblingHandMeDowns] = useState({});
  const [siblingStyleInfluences, setSiblingStyleInfluences] = useState({});

  // Clothing categories
  const clothingCategories = {
    tops: { name: 'Tops', icon: Shirt, color: 'blue' },
    bottoms: { name: 'Bottoms', icon: Shirt, color: 'purple' },
    shoes: { name: 'Shoes', icon: Shirt, color: 'green' },
    outerwear: { name: 'Outerwear', icon: Cloud, color: 'gray' },
    accessories: { name: 'Accessories', icon: Sun, color: 'yellow' }
  };

  // Size chart data
  const sizeProgression = {
    tops: ['2T', '3T', '4T', '5', '6', '6X', '7', '8', '10', '12', '14', '16'],
    bottoms: ['2T', '3T', '4T', '5', '6', '6X', '7', '8', '10', '12', '14', '16'],
    shoes: ['6', '7', '8', '9', '10', '11', '12', '13', '1', '2', '3', '4', '5', '6', '7']
  };

  // Season definitions
  const seasons = {
    spring: { name: 'Spring', icon: Droplets, months: [3, 4, 5] },
    summer: { name: 'Summer', icon: Sun, months: [6, 7, 8] },
    fall: { name: 'Fall', icon: Cloud, months: [9, 10, 11] },
    winter: { name: 'Winter', icon: Snowflake, months: [12, 1, 2] }
  };

  // Get children from family members
  const children = familyMembers.filter(member => member.role === 'child');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    // Determine current season based on month
    const currentMonth = new Date().getMonth() + 1;
    const season = Object.entries(seasons).find(([key, data]) => 
      data.months.includes(currentMonth)
    );
    if (season) {
      setCurrentSeason(season[0]);
    }
  }, []);

  useEffect(() => {
    if (activeChild && familyId) {
      loadWardrobeData();
    }
  }, [activeChild, familyId]);

  const loadWardrobeData = async () => {
    try {
      setLoading(true);
      const wardrobeRef = doc(db, 'families', familyId, 'wardrobes', activeChild);
      const wardrobeDoc = await getDoc(wardrobeRef);
      
      if (wardrobeDoc.exists()) {
        const data = wardrobeDoc.data();
        setWardrobeData(data);
        calculateInventoryStatus(data);
        generateShoppingRecommendations(data);
      } else {
        // Initialize with default data
        const defaultData = initializeWardrobeData();
        await setDoc(wardrobeRef, defaultData);
        setWardrobeData(defaultData);
        calculateInventoryStatus(defaultData);
      }
      
      // Load sibling wardrobe data for hand-me-downs
      await loadSiblingWardrobeInsights();
    } catch (error) {
      console.error('Error loading wardrobe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWardrobeData = () => {
    const child = children.find(c => c.id === activeChild);
    return {
      childId: activeChild,
      childName: child?.name || 'Unknown',
      currentSizes: {
        tops: '6T',
        bottoms: '6',
        shoes: '11'
      },
      inventory: {
        tops: { sufficient: 0, low: 0, needed: 0 },
        bottoms: { sufficient: 0, low: 0, needed: 0 },
        shoes: { sufficient: 0, low: 0, needed: 0 },
        outerwear: { sufficient: 0, low: 0, needed: 0 },
        accessories: { sufficient: 0, low: 0, needed: 0 }
      },
      growthHistory: [],
      preferences: {
        favoriteColors: [],
        avoidPatterns: [],
        preferredBrands: []
      },
      lastUpdated: new Date().toISOString()
    };
  };

  const calculateInventoryStatus = (data) => {
    const status = {};
    Object.entries(data.inventory || {}).forEach(([category, counts]) => {
      const total = (counts.sufficient || 0) + (counts.low || 0);
      const needed = counts.needed || 0;
      
      let level = 'sufficient';
      if (needed > 0) level = 'needed';
      else if (counts.low > total * 0.3) level = 'low';
      
      status[category] = {
        level,
        percentage: total > 0 ? ((counts.sufficient || 0) / (total + needed)) * 100 : 0
      };
    });
    setInventoryStatus(status);
  };

  const generateShoppingRecommendations = (data) => {
    const recommendations = [];
    const child = children.find(c => c.id === activeChild);
    
    Object.entries(data.inventory || {}).forEach(([category, counts]) => {
      if (counts.needed > 0) {
        recommendations.push({
          id: `${category}-needed`,
          category,
          item: clothingCategories[category]?.name || category,
          size: data.currentSizes?.[category] || 'Check size',
          priority: 'High',
          quantity: counts.needed,
          season: currentSeason
        });
      }
      
      if (counts.low > 0) {
        recommendations.push({
          id: `${category}-low`,
          category,
          item: clothingCategories[category]?.name || category,
          size: predictNextSize(category, data.currentSizes?.[category]),
          priority: 'Medium',
          quantity: Math.ceil(counts.low / 2),
          season: 'next'
        });
      }
    });
    
    setShoppingList(recommendations.sort((a, b) => {
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }));
  };

  const predictNextSize = (category, currentSize) => {
    const sizes = sizeProgression[category];
    if (!sizes || !currentSize) return currentSize;
    
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex === -1 || currentIndex === sizes.length - 1) return currentSize;
    
    return sizes[currentIndex + 1];
  };

  const loadSiblingWardrobeInsights = async () => {
    try {
      const knowledgeGraph = QuantumKnowledgeGraph;
      const dynamics = await knowledgeGraph.getSiblingDynamics(familyId, activeChild);
      
      // Find older siblings who could provide hand-me-downs
      const olderSiblings = [];
      const potentialHandMeDowns = {};
      
      for (const sibling of dynamics.siblings) {
        const siblingAge = familyMembers.find(m => m.id === sibling.id)?.age;
        const childAge = familyMembers.find(m => m.id === activeChild)?.age;
        
        if (siblingAge > childAge) {
          // Load sibling's wardrobe data
          const siblingWardrobeRef = doc(db, 'families', familyId, 'wardrobes', sibling.id);
          const siblingWardrobeDoc = await getDoc(siblingWardrobeRef);
          
          if (siblingWardrobeDoc.exists()) {
            const siblingData = siblingWardrobeDoc.data();
            
            // Check for clothes that might fit soon
            Object.entries(clothingCategories).forEach(([category, info]) => {
              const siblingSize = siblingData.currentSizes?.[category];
              const childSize = wardrobeData.currentSizes?.[category];
              
              if (siblingSize && childSize) {
                const siblingIndex = sizeProgression[category]?.indexOf(siblingSize) || -1;
                const childIndex = sizeProgression[category]?.indexOf(childSize) || -1;
                
                // If sibling's current size is 1-2 sizes ahead, it's a good hand-me-down candidate
                if (siblingIndex > childIndex && siblingIndex - childIndex <= 2) {
                  if (!potentialHandMeDowns[category]) {
                    potentialHandMeDowns[category] = [];
                  }
                  potentialHandMeDowns[category].push({
                    fromSibling: sibling.properties.name,
                    size: siblingSize,
                    quantity: siblingData.inventory?.[category]?.goodCondition || 0
                  });
                }
              }
            });
          }
        }
      }
      
      setSiblingHandMeDowns(potentialHandMeDowns);
      
      // Check for style influences based on sibling spillover effects
      const styleInfluences = dynamics.influences
        .filter(i => i.relationship?.properties?.type === 'style' || i.relationship?.properties?.type === 'fashion')
        .map(i => ({
          sibling: i.entity.properties.name,
          influence: i.relationship.properties
        }));
      
      setSiblingStyleInfluences(styleInfluences);
    } catch (error) {
      console.error('Error loading sibling wardrobe insights:', error);
    }
  };

  const updateSize = async (category, newSize) => {
    try {
      const wardrobeRef = doc(db, 'families', familyId, 'wardrobes', activeChild);
      const updates = {
        [`currentSizes.${category}`]: newSize,
        lastUpdated: new Date().toISOString(),
        [`growthHistory`]: [...(wardrobeData.growthHistory || []), {
          category,
          oldSize: wardrobeData.currentSizes?.[category],
          newSize,
          date: new Date().toISOString()
        }]
      };
      
      await updateDoc(wardrobeRef, updates);
      await loadWardrobeData();
    } catch (error) {
      console.error('Error updating size:', error);
    }
  };

  const updateInventory = async (category, type, value) => {
    try {
      const wardrobeRef = doc(db, 'families', familyId, 'wardrobes', activeChild);
      const updates = {
        [`inventory.${category}.${type}`]: value,
        lastUpdated: new Date().toISOString()
      };
      
      await updateDoc(wardrobeRef, updates);
      await loadWardrobeData();
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const getInventoryColor = (level) => {
    switch (level) {
      case 'sufficient': return 'green';
      case 'low': return 'yellow';
      case 'needed': return 'red';
      default: return 'gray';
    }
  };

  const getSeasonIcon = () => {
    const SeasonIcon = seasons[currentSeason]?.icon || Sun;
    return <SeasonIcon size={20} />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading wardrobe data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Wardrobe Concierge</h1>
            <p className="text-gray-600 mt-1">Track sizes, manage inventory, and plan ahead</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              {getSeasonIcon()}
              <span className="ml-2 font-medium">Current Season: {seasons[currentSeason]?.name}</span>
            </div>
            <button
              onClick={() => loadWardrobeData()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Child Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChild(child.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeChild === child.id
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white border border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 flex-shrink-0">
                <UserAvatar user={child} size={40} />
              </div>
              <div className="text-left">
                <div className="font-medium">{child.name}</div>
                <div className={`text-xs ${activeChild === child.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {wardrobeData.currentSizes?.tops || 'Size not set'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Sizes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-blue-500" size={20} />
          Current Sizes for {activeChildData?.name}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(wardrobeData.currentSizes || {}).map(([category, size]) => {
            const CategoryIcon = clothingCategories[category]?.icon || Shirt;
            return (
              <div key={category} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CategoryIcon className="text-gray-600 mr-2" size={20} />
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowUpdateModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Update
                  </button>
                </div>
                <div className="text-2xl font-bold text-gray-900">{size}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Next size: {predictNextSize(category, size)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShoppingBag className="mr-2 text-green-500" size={20} />
          Inventory Status
        </h2>
        
        <div className="space-y-4">
          {Object.entries(inventoryStatus).map(([category, status]) => {
            const CategoryIcon = clothingCategories[category]?.icon || Shirt;
            const color = getInventoryColor(status.level);
            
            return (
              <div key={category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CategoryIcon className="text-gray-600 mr-2" size={20} />
                    <span className="font-medium capitalize">{category}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-700`}>
                    {status.level === 'needed' ? 'Needed' : status.level === 'low' ? 'Low' : 'Sufficient'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all bg-${color}-500`}
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2 text-sm">
                  <div className="flex space-x-4">
                    <span className="text-gray-600">
                      Sufficient: {wardrobeData.inventory?.[category]?.sufficient || 0}
                    </span>
                    <span className="text-yellow-600">
                      Low: {wardrobeData.inventory?.[category]?.low || 0}
                    </span>
                    <span className="text-red-600">
                      Needed: {wardrobeData.inventory?.[category]?.needed || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowUpdateModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shopping Recommendations */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="mr-2 text-yellow-500" size={20} />
          Shopping Recommendations
        </h2>
        
        {shoppingList.length > 0 ? (
          <div className="space-y-3">
            {shoppingList.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </div>
                  <div>
                    <div className="font-medium">{item.item}</div>
                    <div className="text-sm text-gray-600">
                      Size {item.size} • Qty: {item.quantity}
                    </div>
                  </div>
                </div>
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={() => {
                    // Mark as purchased logic here
                  }}
                >
                  <CheckCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto mb-2" size={32} />
            <p>All set! No shopping needed right now.</p>
          </div>
        )}
      </div>

      {/* Sibling Hand-Me-Down Insights */}
      {Object.keys(siblingHandMeDowns).length > 0 && (
        <div className="bg-purple-50 rounded-lg shadow-sm p-6 border border-purple-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="mr-2 text-purple-600" size={20} />
            Sibling Hand-Me-Down Opportunities
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Save money and reduce waste by using clothes from older siblings!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(siblingHandMeDowns).map(([category, opportunities]) => (
              <div key={category} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize flex items-center">
                    {clothingCategories[category]?.icon && 
                      <clothingCategories[category].icon className="mr-2" size={16} />
                    }
                    {category}
                  </h3>
                  <Zap className="text-purple-600" size={16} />
                </div>
                
                {opportunities.map((opp, idx) => (
                  <div key={idx} className="text-sm space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">From {opp.fromSibling}:</span>
                      <span className="font-medium">Size {opp.size}</span>
                    </div>
                    {opp.quantity > 0 && (
                      <div className="flex items-center text-green-600">
                        <ArrowRight size={14} className="mr-1" />
                        <span>{opp.quantity} items in good condition</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-800">
              💡 Tip: Check with siblings before buying new clothes. You could save time and money!
            </p>
          </div>
        </div>
      )}

      {/* Style Influences */}
      {siblingStyleInfluences.length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="mr-2 text-blue-600" size={20} />
            Sibling Style Influences
          </h2>
          <div className="text-sm text-gray-600">
            {activeChildData?.name} is influenced by their siblings' style choices:
            <ul className="mt-2 space-y-1">
              {siblingStyleInfluences.map((influence, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="text-blue-600 mr-2">•</span>
                  Looks up to {influence.sibling}'s fashion sense
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Update {clothingCategories[selectedCategory]?.name || selectedCategory}
            </h3>
            
            {/* Size Update */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Size
              </label>
              <select
                value={wardrobeData.currentSizes?.[selectedCategory] || ''}
                onChange={(e) => updateSize(selectedCategory, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {sizeProgression[selectedCategory]?.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            {/* Inventory Update */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sufficient Items
                </label>
                <input
                  type="number"
                  min="0"
                  value={wardrobeData.inventory?.[selectedCategory]?.sufficient || 0}
                  onChange={(e) => updateInventory(selectedCategory, 'sufficient', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Getting Low
                </label>
                <input
                  type="number"
                  min="0"
                  value={wardrobeData.inventory?.[selectedCategory]?.low || 0}
                  onChange={(e) => updateInventory(selectedCategory, 'low', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Need to Buy
                </label>
                <input
                  type="number"
                  min="0"
                  value={wardrobeData.inventory?.[selectedCategory]?.needed || 0}
                  onChange={(e) => updateInventory(selectedCategory, 'needed', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedCategory(null);
                }}
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

export default WardrobeConciergeTab;