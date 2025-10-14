import React, { useEffect, useRef, useState } from 'react';
import {
  X, Target, Calendar, Clock, Users, Bell, Save, AlertCircle,
  Zap, Star, CheckSquare, Award, TrendingUp, MessageSquare, Trash2, GripVertical
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';
import HabitService2 from '../../services/HabitService2';

const DEFAULT_DRAWER_WIDTH = 480;
const MIN_DRAWER_WIDTH = 400;
const MAX_DRAWER_WIDTH = 800;

const HabitDrawer = ({ isOpen, onClose, habit, onUpdate, isNewHabit = false }) => {
  const drawerRef = useRef(null);
  const { familyMembers = [], familyId } = useFamily();
  const { currentUser, currentUserProfile } = useAuth();
  const [editedHabit, setEditedHabit] = useState(habit || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const habitIdRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false);

  // Resizable drawer state
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_DRAWER_WIDTH);

  // Days of week for schedule
  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  // Update editedHabit when habit prop changes
  useEffect(() => {
    if (habit && habit.habitId !== habitIdRef.current) {
      setEditedHabit(habit);
      habitIdRef.current = habit.habitId;
    }
  }, [habit]);

  // Auto-save on changes (debounced) - only for existing habits
  useEffect(() => {
    if (!editedHabit.habitId || isNewHabit) return; // Don't auto-save for new habits

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedHabit, isNewHabit]);

  // Handle save
  const handleSave = async () => {
    if (!editedHabit.habitId || !familyId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const habitRef = doc(db, 'families', familyId, 'habits2', editedHabit.habitId);

      const updates = {
        title: editedHabit.title,
        description: editedHabit.description,
        category: editedHabit.category,
        identityStatement: editedHabit.identityStatement,
        twoMinuteVersion: editedHabit.twoMinuteVersion,
        fullVersion: editedHabit.fullVersion,
        fourLaws: editedHabit.fourLaws,
        schedule: editedHabit.schedule,
        kidsCanHelp: editedHabit.kidsCanHelp,
        updatedAt: serverTimestamp()
      };

      await updateDoc(habitRef, updates);

      if (onUpdate) {
        onUpdate({ ...editedHabit, ...updates });
      }

      console.log('✅ Habit saved successfully');
    } catch (error) {
      console.error('Error saving habit:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle create new habit
  const handleCreate = async () => {
    if (!editedHabit.title) {
      alert('Please enter a habit name');
      return;
    }

    setIsCreating(true);
    setSaveError(null);

    try {
      const habitData = {
        title: editedHabit.title,
        description: editedHabit.description || '',
        category: editedHabit.category || 'personal',
        identityStatement: editedHabit.identityStatement || '',
        twoMinuteVersion: editedHabit.twoMinuteVersion || '',
        fullVersion: editedHabit.fullVersion || editedHabit.description || '',
        fourLaws: editedHabit.fourLaws || {
          obvious: [],
          attractive: [],
          easy: [],
          satisfying: []
        },
        schedule: editedHabit.schedule || {
          frequency: 'daily',
          daysOfWeek: [1, 2, 3, 4, 5],
          timeOfDay: '',
          duration: 10,
          reminder: true,
          reminderMinutesBefore: 15
        },
        kidsCanHelp: editedHabit.kidsCanHelp !== false,
        visualizationType: 'mountain'
      };

      const userInfo = {
        name: currentUserProfile?.name || currentUser?.email,
        roleType: currentUserProfile?.roleType || currentUserProfile?.role || 'parent'
      };

      const newHabit = await HabitService2.createHabit(
        habitData,
        familyId,
        currentUser.uid,
        userInfo
      );

      // Dispatch event to refresh habits list
      window.dispatchEvent(new CustomEvent('habit-created', {
        detail: newHabit
      }));

      onClose();
      if (onUpdate) {
        onUpdate(newHabit);
      }

      console.log('✅ Habit created successfully');
    } catch (error) {
      console.error('Error creating habit:', error);
      setSaveError(error.message);
      alert('Failed to create habit. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this habit?')) return;

    try {
      await HabitService2.archiveHabit(familyId, editedHabit.habitId);
      onClose();
      if (onUpdate) {
        onUpdate(null); // Signal deletion
      }
    } catch (error) {
      console.error('Error archiving habit:', error);
      alert('Failed to archive habit');
    }
  };

  // Handle field changes
  const handleChange = (field, value) => {
    setEditedHabit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (field, value) => {
    setEditedHabit(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const handleFourLawsChange = (law, index, value) => {
    setEditedHabit(prev => ({
      ...prev,
      fourLaws: {
        ...prev.fourLaws,
        [law]: prev.fourLaws[law].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const addFourLawItem = (law) => {
    setEditedHabit(prev => ({
      ...prev,
      fourLaws: {
        ...prev.fourLaws,
        [law]: [...(prev.fourLaws[law] || []), '']
      }
    }));
  };

  const removeFourLawItem = (law, index) => {
    setEditedHabit(prev => ({
      ...prev,
      fourLaws: {
        ...prev.fourLaws,
        [law]: prev.fourLaws[law].filter((_, i) => i !== index)
      }
    }));
  };

  const toggleDayOfWeek = (day) => {
    const currentDays = editedHabit.schedule?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();

    handleScheduleChange('daysOfWeek', newDays);
  };

  // Resize handlers
  const handleResizeStart = (e) => {
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = drawerWidth;
    e.preventDefault();
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;

    const deltaX = resizeStartX.current - e.clientX;
    const newWidth = Math.min(
      Math.max(resizeStartWidth.current + deltaX, MIN_DRAWER_WIDTH),
      MAX_DRAWER_WIDTH
    );

    setDrawerWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add/remove resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  if (!isOpen || !habit) return null;

  return (
    <>
      {/* Drawer (no overlay) */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{
          width: `${drawerWidth}px`,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          zIndex: 40 // Lower than chat drawer (50) so it doesn't shadow it
        }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-purple-400 cursor-ew-resize flex items-center justify-center group transition-all"
          onMouseDown={handleResizeStart}
          style={{ zIndex: 51 }}
        >
          <div className="opacity-0 group-hover:opacity-100 bg-purple-500 rounded-full p-1">
            <GripVertical className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isNewHabit ? 'Create New Habit' : 'Habit Details'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {(isSaving || isCreating) && (
              <span className="text-sm text-gray-500 flex items-center">
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                {isNewHabit ? 'Creating...' : 'Saving...'}
              </span>
            )}
            {saveError && (
              <span className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Error
              </span>
            )}
            {isNewHabit && (
              <button
                onClick={handleCreate}
                disabled={isCreating || !editedHabit.title}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Habit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={editedHabit.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Morning Exercise"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editedHabit.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="What does this habit involve?"
            />
          </div>

          {/* Identity Statement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              Identity Statement
            </label>
            <input
              type="text"
              value={editedHabit.identityStatement || ''}
              onChange={(e) => handleChange('identityStatement', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="I am someone who..."
            />
          </div>

          {/* 2-Minute Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Zap className="w-4 h-4 mr-1 text-orange-500" />
              2-Minute Version
            </label>
            <input
              type="text"
              value={editedHabit.twoMinuteVersion || ''}
              onChange={(e) => handleChange('twoMinuteVersion', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Simplest version to start with..."
            />
          </div>

          {/* Schedule */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Schedule
            </h3>

            {/* Days of Week */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editedHabit.schedule?.daysOfWeek?.includes(day.value)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time of Day
              </label>
              <input
                type="text"
                value={editedHabit.schedule?.timeOfDay || ''}
                onChange={(e) => handleScheduleChange('timeOfDay', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Morning, After lunch"
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={editedHabit.schedule?.duration || 10}
                onChange={(e) => handleScheduleChange('duration', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                max="180"
              />
            </div>

            {/* Reminder */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminder"
                checked={editedHabit.schedule?.reminder !== false}
                onChange={(e) => handleScheduleChange('reminder', e.target.checked)}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="reminder" className="text-sm text-gray-700">
                Send reminders
              </label>
            </div>
          </div>

          {/* Four Laws */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-purple-600" />
              Four Laws of Behavior Change
            </h3>

            {/* Law 1: Make it Obvious */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1️⃣ Make it Obvious (Cues)
              </label>
              {(editedHabit.fourLaws?.obvious || []).map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleFourLawsChange('obvious', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Visual reminder or trigger..."
                  />
                  <button
                    onClick={() => removeFourLawItem('obvious', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addFourLawItem('obvious')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add cue
              </button>
            </div>

            {/* Law 2: Make it Attractive */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2️⃣ Make it Attractive (Motivation)
              </label>
              {(editedHabit.fourLaws?.attractive || []).map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleFourLawsChange('attractive', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Reward or motivation..."
                  />
                  <button
                    onClick={() => removeFourLawItem('attractive', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addFourLawItem('attractive')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add motivation
              </button>
            </div>

            {/* Law 3: Make it Easy */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3️⃣ Make it Easy (Reduce Friction)
              </label>
              {(editedHabit.fourLaws?.easy || []).map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleFourLawsChange('easy', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="How to make it easier..."
                  />
                  <button
                    onClick={() => removeFourLawItem('easy', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addFourLawItem('easy')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add ease strategy
              </button>
            </div>

            {/* Law 4: Make it Satisfying */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4️⃣ Make it Satisfying (Reward)
              </label>
              {(editedHabit.fourLaws?.satisfying || []).map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleFourLawsChange('satisfying', index, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Immediate reward..."
                  />
                  <button
                    onClick={() => removeFourLawItem('satisfying', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addFourLawItem('satisfying')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add reward
              </button>
            </div>
          </div>

          {/* Kids Can Help */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="kidsCanHelp"
                checked={editedHabit.kidsCanHelp !== false}
                onChange={(e) => handleChange('kidsCanHelp', e.target.checked)}
                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="kidsCanHelp" className="text-sm text-gray-700 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Kids can help with this habit
              </label>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Progress
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Completions</div>
                <div className="text-2xl font-bold text-gray-900">
                  {editedHabit.totalCompletions || 0}/60
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Current Streak</div>
                <div className="text-2xl font-bold text-orange-600 flex items-center">
                  {editedHabit.currentStreak || 0}
                  {editedHabit.currentStreak > 0 && <span className="ml-1">🔥</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Archive Button - only for existing habits */}
          {!isNewHabit && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleArchive}
                className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Archive This Habit
              </button>
            </div>
          )}

          {/* Create Button - only for new habits */}
          {isNewHabit && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleCreate}
                disabled={isCreating || !editedHabit.title}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
              >
                <Save className="w-5 h-5 mr-2" />
                {isCreating ? 'Creating Habit...' : 'Create Habit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HabitDrawer;
