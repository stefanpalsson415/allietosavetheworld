import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, ThumbsUp, ThumbsDown, Sparkles, Plus, X,
  Star, TrendingUp, Package, Gift, Gamepad2, Book,
  Palette, Music, Trophy, Shirt, Pizza, Car,
  Building, Trees, Zap, RefreshCw
} from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamily } from '../../contexts/FamilyContext';
import ChildInterestService from '../../services/ChildInterestService';

// Sortable Interest Card
const SortableInterestCard = ({ id, interest, onRate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-white rounded-xl shadow-md cursor-move hover:shadow-lg transition-shadow ${
        isDragging ? 'z-50' : 'z-10'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{interest.icon}</span>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRate(interest.id, 'love');
            }}
            className={`p-1 rounded ${
              interest.rating === 'love' ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart size={16} fill={interest.rating === 'love' ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRate(interest.id, 'like');
            }}
            className={`p-1 rounded ${
              interest.rating === 'like' ? 'bg-blue-100 text-blue-500' : 'text-gray-400 hover:text-blue-500'
            }`}
          >
            <ThumbsUp size={16} fill={interest.rating === 'like' ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRate(interest.id, 'pass');
            }}
            className={`p-1 rounded ${
              interest.rating === 'pass' ? 'bg-gray-100 text-gray-500' : 'text-gray-400 hover:text-gray-500'
            }`}
          >
            <ThumbsDown size={16} fill={interest.rating === 'pass' ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <h4 className="font-medium text-gray-800 text-sm">{interest.name}</h4>
      {interest.description && (
        <p className="text-xs text-gray-500 mt-1">{interest.description}</p>
      )}
    </div>
  );
};

const VisualInterestBoard = ({ childId, onUpdate }) => {
  const { familyId, familyMembers } = useFamily();
  const [interests, setInterests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInterest, setNewInterest] = useState({ name: '', category: '', icon: '⭐' });
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);

  const child = familyMembers?.find(m => m.id === childId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Interest categories with fun icons
  const interestCategories = [
    { id: 'all', name: 'All Interests', icon: <Sparkles />, color: 'purple' },
    { id: 'toys', name: 'Toys & Games', icon: <Gamepad2 />, color: 'blue' },
    { id: 'books', name: 'Books & Stories', icon: <Book />, color: 'green' },
    { id: 'arts', name: 'Arts & Crafts', icon: <Palette />, color: 'pink' },
    { id: 'music', name: 'Music', icon: <Music />, color: 'yellow' },
    { id: 'sports', name: 'Sports', icon: <Trophy />, color: 'orange' },
    { id: 'fashion', name: 'Fashion', icon: <Shirt />, color: 'indigo' },
    { id: 'food', name: 'Food & Treats', icon: <Pizza />, color: 'red' },
    { id: 'vehicles', name: 'Vehicles', icon: <Car />, color: 'gray' },
    { id: 'building', name: 'Building', icon: <Building />, color: 'cyan' },
    { id: 'nature', name: 'Nature', icon: <Trees />, color: 'emerald' }
  ];

  // Sample interests to get started
  const sampleInterests = [
    { name: 'LEGO Sets', category: 'toys', icon: '🧱', description: 'Build amazing creations' },
    { name: 'Pokemon Cards', category: 'toys', icon: '🎴', description: 'Gotta catch them all' },
    { name: 'Drawing', category: 'arts', icon: '🎨', description: 'Express creativity' },
    { name: 'Soccer', category: 'sports', icon: '⚽', description: 'Run and score goals' },
    { name: 'Minecraft', category: 'toys', icon: '🎮', description: 'Build virtual worlds' },
    { name: 'Harry Potter', category: 'books', icon: '📚', description: 'Magical adventures' },
    { name: 'Piano', category: 'music', icon: '🎹', description: 'Make beautiful music' },
    { name: 'Dinosaurs', category: 'nature', icon: '🦕', description: 'Prehistoric creatures' },
    { name: 'Pizza', category: 'food', icon: '🍕', description: 'Favorite food' },
    { name: 'Space', category: 'nature', icon: '🚀', description: 'Explore the universe' }
  ];

  // Load interests from database
  useEffect(() => {
    loadInterests();
  }, [childId, familyId]);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const savedInterests = await ChildInterestService.getChildInterests(familyId, childId);

      if (savedInterests.length === 0) {
        // If no interests, show sample interests
        const formattedSamples = sampleInterests.map((interest, index) => ({
          id: `sample_${index}`,
          ...interest,
          rating: null,
          isNew: true
        }));
        setInterests(formattedSamples);
      } else {
        // Format saved interests
        const formatted = savedInterests.map(interest => ({
          ...interest,
          icon: interest.icon || getIconForCategory(interest.category),
          rating: interest.loved ? 'love' : interest.liked ? 'like' : interest.passed ? 'pass' : null
        }));
        setInterests(formatted);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon based on category
  const getIconForCategory = (category) => {
    const categoryIcons = {
      toys: '🎮',
      books: '📚',
      arts: '🎨',
      music: '🎵',
      sports: '⚽',
      fashion: '👕',
      food: '🍔',
      vehicles: '🚗',
      building: '🏗️',
      nature: '🌳'
    };
    return categoryIcons[category] || '⭐';
  };

  // Handle rating an interest
  const handleRate = async (interestId, rating) => {
    const interest = interests.find(i => i.id === interestId);

    // Update UI immediately
    setInterests(prev => prev.map(i =>
      i.id === interestId ? { ...i, rating } : i
    ));

    // Save to database if not a sample
    if (!interestId.startsWith('sample_')) {
      try {
        await ChildInterestService.updateInterest(familyId, childId, interestId, {
          loved: rating === 'love',
          liked: rating === 'like',
          passed: rating === 'pass'
        });
      } catch (error) {
        console.error('Error updating interest rating:', error);
      }
    } else {
      // If it's a sample, save it as a real interest
      try {
        await ChildInterestService.addInterest(familyId, childId, {
          ...interest,
          loved: rating === 'love',
          liked: rating === 'like',
          passed: rating === 'pass'
        });
        // Reload interests to get the real ID
        loadInterests();
      } catch (error) {
        console.error('Error saving interest:', error);
      }
    }

    // Notify parent component
    if (onUpdate) {
      onUpdate({ interestId, rating });
    }
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setInterests((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setDraggedItem(null);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const item = interests.find(i => i.id === active.id);
    setDraggedItem(item);
  };

  // Add new custom interest
  const handleAddInterest = async () => {
    if (!newInterest.name || !newInterest.category) return;

    const interest = {
      name: newInterest.name,
      category: newInterest.category,
      icon: newInterest.icon || getIconForCategory(newInterest.category),
      source: 'manual',
      loved: false,
      liked: false,
      passed: false
    };

    try {
      const interestId = await ChildInterestService.addInterest(familyId, childId, interest);

      // Add to UI
      setInterests(prev => [...prev, { ...interest, id: interestId }]);

      // Reset form
      setNewInterest({ name: '', category: '', icon: '⭐' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  // Filter interests by category
  const filteredInterests = activeCategory === 'all'
    ? interests
    : interests.filter(i => i.category === activeCategory);

  // Group interests by rating
  const lovedInterests = filteredInterests.filter(i => i.rating === 'love');
  const likedInterests = filteredInterests.filter(i => i.rating === 'like');
  const passedInterests = filteredInterests.filter(i => i.rating === 'pass');
  const unratedInterests = filteredInterests.filter(i => !i.rating);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="mx-auto h-12 w-12 text-purple-500 animate-pulse" />
          <p className="mt-2 text-gray-600">Loading interests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <Sparkles className="mr-2 text-purple-500" />
            {child?.name}'s Interest Board
          </h3>
          <p className="text-gray-600 mt-1">Drag and drop to organize, click hearts to rate!</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
        >
          <Plus size={20} />
          <span>Add Interest</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {interestCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition ${
              activeCategory === category.id
                ? `bg-${category.color}-500 text-white`
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="w-5 h-5">{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
            {category.id !== 'all' && (
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                {interests.filter(i => i.category === category.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Interest Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Loved Section */}
          <div className="bg-red-50 rounded-xl p-4">
            <h4 className="font-bold text-red-600 flex items-center mb-3">
              <Heart className="mr-2" size={20} fill="currentColor" />
              Loves ({lovedInterests.length})
            </h4>
            <SortableContext items={lovedInterests.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {lovedInterests.map(interest => (
                  <SortableInterestCard
                    key={interest.id}
                    id={interest.id}
                    interest={interest}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Liked Section */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-bold text-blue-600 flex items-center mb-3">
              <ThumbsUp className="mr-2" size={20} fill="currentColor" />
              Likes ({likedInterests.length})
            </h4>
            <SortableContext items={likedInterests.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {likedInterests.map(interest => (
                  <SortableInterestCard
                    key={interest.id}
                    id={interest.id}
                    interest={interest}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Passed Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-600 flex items-center mb-3">
              <ThumbsDown className="mr-2" size={20} fill="currentColor" />
              Not Interested ({passedInterests.length})
            </h4>
            <SortableContext items={passedInterests.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {passedInterests.map(interest => (
                  <SortableInterestCard
                    key={interest.id}
                    id={interest.id}
                    interest={interest}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Unrated Section */}
          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-bold text-purple-600 flex items-center mb-3">
              <Star className="mr-2" size={20} />
              To Explore ({unratedInterests.length})
            </h4>
            <SortableContext items={unratedInterests.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {unratedInterests.map(interest => (
                  <SortableInterestCard
                    key={interest.id}
                    id={interest.id}
                    interest={interest}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {draggedItem ? (
            <div className="p-4 bg-white rounded-xl shadow-xl border-2 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{draggedItem.icon}</span>
              </div>
              <h4 className="font-medium text-gray-800 text-sm">{draggedItem.name}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Interest Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Add New Interest</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Name
                  </label>
                  <input
                    type="text"
                    value={newInterest.name}
                    onChange={(e) => setNewInterest({ ...newInterest, name: e.target.value })}
                    placeholder="e.g., Dinosaurs, Soccer, LEGO"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newInterest.category}
                    onChange={(e) => setNewInterest({ ...newInterest, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a category</option>
                    {interestCategories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (optional)
                  </label>
                  <input
                    type="text"
                    value={newInterest.icon}
                    onChange={(e) => setNewInterest({ ...newInterest, icon: e.target.value })}
                    placeholder="Enter an emoji"
                    maxLength="2"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-2xl text-center"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInterest}
                  disabled={!newInterest.name || !newInterest.category}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Interest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualInterestBoard;