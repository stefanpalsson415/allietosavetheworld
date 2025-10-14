import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Shirt, Users, Calendar, TrendingUp, Plus, Search, Filter,
  Heart, Star, Package, ArrowRight, CheckCircle, AlertCircle, 
  Sparkles, RefreshCw, Gift, Tag, Zap, Award, Image, Clock,
  Sun, Cloud, Snowflake, Droplets, ChevronRight, X, Check,
  ShoppingBag, Recycle, CircleDollarSign, Trophy, Scissors
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import UserAvatar from '../../common/UserAvatar';
import { useNavigate } from 'react-router-dom';

const ClosetCompanionTab = () => {
  const { familyId, familyMembers } = useFamily();
  const navigate = useNavigate();
  const [activeChild, setActiveChild] = useState(null);
  const [activeView, setActiveView] = useState('closet'); // closet, outfit, memories, eco
  const [loading, setLoading] = useState(true);
  const [clothingItems, setClothingItems] = useState({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [itemForm, setItemForm] = useState({
    type: 'top',
    size: '',
    brand: '',
    color: '',
    season: 'all',
    condition: 'excellent',
    notes: ''
  });

  // Season definitions with icons
  const seasons = {
    spring: { name: 'Spring', icon: Droplets, color: 'emerald' },
    summer: { name: 'Summer', icon: Sun, color: 'yellow' },
    fall: { name: 'Fall', icon: Cloud, color: 'orange' },
    winter: { name: 'Winter', icon: Snowflake, color: 'blue' },
    all: { name: 'All Seasons', icon: Calendar, color: 'gray' }
  };

  // Clothing types
  const clothingTypes = {
    top: { name: 'Tops', icon: '👕', color: 'blue' },
    bottom: { name: 'Bottoms', icon: '👖', color: 'indigo' },
    dress: { name: 'Dresses', icon: '👗', color: 'pink' },
    outerwear: { name: 'Outerwear', icon: '🧥', color: 'gray' },
    shoes: { name: 'Shoes', icon: '👟', color: 'green' },
    accessories: { name: 'Accessories', icon: '🧢', color: 'purple' }
  };

  // Size progressions
  const sizeCharts = {
    'EU': ['56', '62', '68', '74', '80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152'],
    'US': ['NB', '3M', '6M', '9M', '12M', '18M', '24M', '2T', '3T', '4T', '5', '6', '7', '8', '10', '12', '14']
  };

  const children = familyMembers.filter(member => member.role === 'child');

  useEffect(() => {
    if (children.length > 0 && !activeChild) {
      setActiveChild(children[0].id);
    }
  }, [children, activeChild]);

  useEffect(() => {
    if (activeChild && familyId) {
      loadClothingData();
    }
  }, [activeChild, familyId]);

  const loadClothingData = async () => {
    try {
      setLoading(true);
      const itemsRef = collection(db, 'families', familyId, 'wardrobes', activeChild, 'items');
      const itemsQuery = query(itemsRef, orderBy('createdAt', 'desc'));
      const itemsSnapshot = await getDocs(itemsQuery);
      
      const items = {};
      itemsSnapshot.forEach(doc => {
        items[doc.id] = { id: doc.id, ...doc.data() };
      });
      
      setClothingItems(items);
    } catch (error) {
      console.error('Error loading clothing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        setShowCamera(false);
        setShowAddItem(true);
        // TODO: Add computer vision to detect color/type
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async () => {
    if (!capturedImage || !itemForm.size) return;

    try {
      const itemData = {
        ...itemForm,
        imageUrl: capturedImage,
        childId: activeChild,
        currentOwner: activeChild,
        previousOwners: [],
        memories: [],
        wornCount: 0,
        createdAt: new Date(),
        status: 'active',
        growthProgress: 0
      };

      const itemRef = await addDoc(
        collection(db, 'families', familyId, 'wardrobes', activeChild, 'items'),
        itemData
      );

      setClothingItems(prev => ({
        ...prev,
        [itemRef.id]: { id: itemRef.id, ...itemData }
      }));

      // Reset form
      setShowAddItem(false);
      setCapturedImage(null);
      setItemForm({
        type: 'top',
        size: '',
        brand: '',
        color: '',
        season: 'all',
        condition: 'excellent',
        notes: ''
      });

      // Award Palsson Bucks for adding item
      // TODO: Award bucks through BucksService
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handlePassDown = async (itemId, toChildId) => {
    try {
      const item = clothingItems[itemId];
      
      // Update item with new owner
      const updatedItem = {
        ...item,
        currentOwner: toChildId,
        previousOwners: [...(item.previousOwners || []), {
          childId: activeChild,
          date: new Date(),
          size: item.size
        }]
      };

      // Remove from current child
      await deleteDoc(doc(db, 'families', familyId, 'wardrobes', activeChild, 'items', itemId));
      
      // Add to new child
      await setDoc(
        doc(db, 'families', familyId, 'wardrobes', toChildId, 'items', itemId),
        updatedItem
      );

      // Update local state
      setClothingItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });

      // Award eco points
      // TODO: Update eco-warrior score
    } catch (error) {
      console.error('Error passing down item:', error);
    }
  };

  const getFilteredItems = () => {
    return Object.values(clothingItems).filter(item => {
      if (selectedSeason !== 'all' && item.season !== selectedSeason && item.season !== 'all') return false;
      if (selectedSize !== 'all' && item.size !== selectedSize) return false;
      if (searchTerm && !item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.color?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.notes?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  const renderClosetView = () => {
    const filteredItems = getFilteredItems();
    const groupedItems = {};
    
    filteredItems.forEach(item => {
      if (!groupedItems[item.type]) {
        groupedItems[item.type] = [];
      }
      groupedItems[item.type].push(item);
    });

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Shirt className="text-blue-600" size={24} />
              <span className="text-2xl font-bold text-blue-800">{Object.keys(clothingItems).length}</span>
            </div>
            <p className="text-sm text-blue-600">Total Items</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Recycle className="text-green-600" size={24} />
              <span className="text-2xl font-bold text-green-800">
                {Object.values(clothingItems).filter(i => i.previousOwners?.length > 0).length}
              </span>
            </div>
            <p className="text-sm text-green-600">Hand-me-downs</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="text-purple-600" size={24} />
              <span className="text-2xl font-bold text-purple-800">
                {Object.values(clothingItems).filter(i => i.condition === 'excellent').length}
              </span>
            </div>
            <p className="text-sm text-purple-600">Excellent Condition</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-orange-600" size={24} />
              <span className="text-2xl font-bold text-orange-800">
                {Object.values(clothingItems).filter(i => i.growthProgress > 80).length}
              </span>
            </div>
            <p className="text-sm text-orange-600">Nearly Outgrown</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Seasons</option>
              {Object.entries(seasons).filter(([key]) => key !== 'all').map(([key, season]) => (
                <option key={key} value={key}>{season.name}</option>
              ))}
            </select>
            
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Sizes</option>
              {sizeCharts.EU.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search by brand, color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Clothing Grid by Type */}
        {Object.entries(groupedItems).map(([type, items]) => (
          <div key={type} className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-xl">{clothingTypes[type].icon}</span>
              {clothingTypes[type].name}
              <span className="text-sm text-gray-500">({items.length})</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id} className="group relative">
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all">
                    {/* Image */}
                    <div className="aspect-square relative bg-gray-50">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={`${item.brand || 'Item'} ${item.type}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt size={48} className="text-gray-300" />
                        </div>
                      )}
                      
                      {/* Growth Progress Indicator */}
                      {item.growthProgress > 70 && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.growthProgress}% outgrown
                        </div>
                      )}
                      
                      {/* Hand-me-down Badge */}
                      {item.previousOwners?.length > 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Recycle size={12} />
                          From {children.find(c => c.id === item.previousOwners[item.previousOwners.length - 1].childId)?.name}
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">Size {item.size}</span>
                        <div className="flex items-center gap-1">
                          {item.season !== 'all' && seasons[item.season] && (
                            <div className={`w-6 h-6 rounded bg-${seasons[item.season].color}-100 flex items-center justify-center`}>
                              {React.createElement(seasons[item.season].icon, { size: 14, className: `text-${seasons[item.season].color}-600` })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.brand && (
                        <p className="text-sm text-gray-600">{item.brand}</p>
                      )}
                      
                      {item.memories?.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                          <Heart size={12} className="fill-current" />
                          {item.memories.length} memories
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                        <Heart size={16} />
                      </button>
                      <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                        <Users size={16} />
                      </button>
                      <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                        <Gift size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedItems).length === 0 && (
          <div className="text-center py-12">
            <Shirt size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No clothing items found</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderOutfitView = () => {
    return (
      <div className="text-center py-12">
        <Sparkles size={48} className="mx-auto text-purple-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Fashion Show Friday</h3>
        <p className="text-gray-600 mb-6">Create and share outfit combinations!</p>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Coming Soon
        </button>
      </div>
    );
  };

  const renderMemoriesView = () => {
    return (
      <div className="text-center py-12">
        <Image size={48} className="mx-auto text-pink-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Memory Mosaic</h3>
        <p className="text-gray-600 mb-6">See all the memories created in these clothes!</p>
        <button className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
          Coming Soon
        </button>
      </div>
    );
  };

  const renderEcoView = () => {
    return (
      <div className="text-center py-12">
        <Trophy size={48} className="mx-auto text-green-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Eco Warrior Score</h3>
        <p className="text-gray-600 mb-6">Track your family's sustainable fashion impact!</p>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Coming Soon
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Allie's Closet Companion</h2>
        <p className="text-gray-600">Making wardrobe management as memorable as it is organized</p>
      </div>

      {/* Child Selector */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {children.map(child => {
          const childItems = Object.values(clothingItems).filter(item => item.childId === child.id);
          
          return (
            <button
              key={child.id}
              onClick={() => setActiveChild(child.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeChild === child.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white border border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="w-10 h-10 flex-shrink-0">
                <UserAvatar user={child} size={40} />
              </div>
              <div className="text-left">
                <div className="font-medium">{child.name}</div>
                <div className={`text-xs ${activeChild === child.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {childItems.length} items
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeChild && (
        <>
          {/* View Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveView('closet')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                  activeView === 'closet'
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shirt size={18} />
                My Closet
              </button>
              
              <button
                onClick={() => setActiveView('outfit')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                  activeView === 'outfit'
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sparkles size={18} />
                Outfits
              </button>
              
              <button
                onClick={() => setActiveView('memories')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                  activeView === 'memories'
                    ? 'bg-pink-100 text-pink-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} />
                Memories
              </button>
              
              <button
                onClick={() => setActiveView('eco')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                  activeView === 'eco'
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Trophy size={18} />
                Eco Score
              </button>
            </div>
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
          >
            <Camera size={24} />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />

          {/* Content Views */}
          {activeView === 'closet' && renderClosetView()}
          {activeView === 'outfit' && renderOutfitView()}
          {activeView === 'memories' && renderMemoriesView()}
          {activeView === 'eco' && renderEcoView()}
        </>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
            
            {capturedImage && (
              <img src={capturedImage} alt="Captured item" className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={itemForm.type}
                    onChange={(e) => setItemForm({...itemForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(clothingTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                  <input
                    type="text"
                    value={itemForm.size}
                    onChange={(e) => setItemForm({...itemForm, size: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 122"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={itemForm.brand}
                    onChange={(e) => setItemForm({...itemForm, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., H&M"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={itemForm.color}
                    onChange={(e) => setItemForm({...itemForm, color: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Blue"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select
                    value={itemForm.season}
                    onChange={(e) => setItemForm({...itemForm, season: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(seasons).map(([key, season]) => (
                      <option key={key} value={key}>{season.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    value={itemForm.condition}
                    onChange={(e) => setItemForm({...itemForm, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="repair">Needs Repair</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({...itemForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Any special memories or notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setCapturedImage(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!itemForm.size}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosetCompanionTab;