// src/components/calendar-v2/views/NotificationPreferences.js

import React, { useState, useEffect } from 'react';
import { Bell, Clock, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const notificationService = new NotificationService();

export function NotificationPreferences({ onClose }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState((typeof Notification !== 'undefined' && Notification?.permission) || 'default');
  const [preferences, setPreferences] = useState({
    enabled: true,
    defaultReminders: [15], // minutes before
    smartReminders: true,
    categories: {
      medical: { enabled: true, reminders: [15, 60, 1440] }, // 15 min, 1 hour, 1 day
      school: { enabled: true, reminders: [15, 720] }, // 15 min, 12 hours
      activity: { enabled: true, reminders: [15, 30] }, // 15 min, 30 min
      work: { enabled: true, reminders: [5, 15, 30] }, // 5 min, 15 min, 30 min
      personal: { enabled: true, reminders: [15] } // 15 min
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    travelTime: {
      enabled: true,
      defaultMinutes: 30
    },
    followUps: {
      missed: true,
      completed: false
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'preferences', 'notifications');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPreferences(docSnap.data());
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'preferences', 'notifications');
      await setDoc(docRef, preferences);
      alert('Notification preferences saved!');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission((typeof Notification !== 'undefined' && Notification?.permission) || 'default');
    if (granted) {
      // Test notification
      notificationService.showNotification({
        title: 'Notifications Enabled!',
        body: 'You will now receive calendar reminders.',
        icon: '/logo192.png'
      });
    }
  };

  const updateCategoryReminder = (category, reminderIndex, value) => {
    const newReminders = [...preferences.categories[category].reminders];
    newReminders[reminderIndex] = parseInt(value);
    
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          reminders: newReminders.sort((a, b) => b - a)
        }
      }
    }));
  };

  const addCategoryReminder = (category) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          reminders: [...prev.categories[category].reminders, 15].sort((a, b) => b - a)
        }
      }
    }));
  };

  const removeCategoryReminder = (category, index) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          reminders: prev.categories[category].reminders.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const formatReminderTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''}`;
    return `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          ×
        </button>
      </div>

      {/* Permission Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Browser Notifications</h3>
            <p className="text-sm text-gray-600 mt-1">
              Status: <span className={`font-medium ${
                permission === 'granted' ? 'text-green-600' : 
                permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {permission === 'granted' ? 'Enabled' : 
                 permission === 'denied' ? 'Blocked' : 'Not Set'}
              </span>
            </p>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={permission === 'denied'}
            >
              {permission === 'denied' ? 'Blocked by Browser' : 'Enable Notifications'}
            </button>
          )}
        </div>
        {permission === 'denied' && (
          <p className="text-sm text-red-600 mt-2">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Please enable notifications in your browser settings to receive reminders.
          </p>
        )}
      </div>

      {/* Master Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(e) => setPreferences(prev => ({ ...prev, enabled: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-600"
          />
          <span className="font-medium">Enable all notifications</span>
        </label>
      </div>

      {/* Smart Reminders */}
      <div className="mb-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.smartReminders}
            onChange={(e) => setPreferences(prev => ({ ...prev, smartReminders: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-600"
            disabled={!preferences.enabled}
          />
          <span className="font-medium">Smart Reminders</span>
        </label>
        <p className="text-sm text-gray-600 ml-7 mt-1">
          Automatically adjust reminder times based on event type, location, and time of day
        </p>
      </div>

      {/* Category-specific Reminders */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Reminders by Category
        </h3>
        <div className="space-y-4">
          {Object.entries(preferences.categories).map(([category, settings]) => (
            <div key={category} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        [category]: { ...settings, enabled: e.target.checked }
                      }
                    }))}
                    className="w-4 h-4 rounded text-blue-600"
                    disabled={!preferences.enabled}
                  />
                  <span className="font-medium capitalize">{category}</span>
                </label>
              </div>
              
              {settings.enabled && (
                <div className="ml-7">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.reminders.map((reminder, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <select
                          value={reminder}
                          onChange={(e) => updateCategoryReminder(category, index, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                          disabled={!preferences.enabled}
                        >
                          <option value="5">5 min</option>
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="720">12 hours</option>
                          <option value="1440">1 day</option>
                          <option value="2880">2 days</option>
                        </select>
                        <button
                          onClick={() => removeCategoryReminder(category, index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={!preferences.enabled || settings.reminders.length === 1}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addCategoryReminder(category)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={!preferences.enabled}
                  >
                    + Add reminder
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Travel Time */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Travel Time Reminders
        </h3>
        <label className="flex items-center gap-3 mb-2">
          <input
            type="checkbox"
            checked={preferences.travelTime.enabled}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              travelTime: { ...prev.travelTime, enabled: e.target.checked }
            }))}
            className="w-4 h-4 rounded text-blue-600"
            disabled={!preferences.enabled}
          />
          <span>Add travel time to reminders for events with locations</span>
        </label>
        {preferences.travelTime.enabled && (
          <div className="ml-7">
            <label className="text-sm text-gray-600">
              Default travel time:
              <select
                value={preferences.travelTime.defaultMinutes}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  travelTime: { ...prev.travelTime, defaultMinutes: parseInt(e.target.value) }
                }))}
                className="ml-2 px-2 py-1 border rounded text-sm"
                disabled={!preferences.enabled}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Quiet Hours
        </h3>
        <label className="flex items-center gap-3 mb-2">
          <input
            type="checkbox"
            checked={preferences.quietHours.enabled}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              quietHours: { ...prev.quietHours, enabled: e.target.checked }
            }))}
            className="w-4 h-4 rounded text-blue-600"
            disabled={!preferences.enabled}
          />
          <span>Don't send notifications during quiet hours</span>
        </label>
        {preferences.quietHours.enabled && (
          <div className="ml-7 flex items-center gap-2">
            <input
              type="time"
              value={preferences.quietHours.start}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                quietHours: { ...prev.quietHours, start: e.target.value }
              }))}
              className="px-2 py-1 border rounded text-sm"
              disabled={!preferences.enabled}
            />
            <span className="text-sm">to</span>
            <input
              type="time"
              value={preferences.quietHours.end}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                quietHours: { ...prev.quietHours, end: e.target.value }
              }))}
              className="px-2 py-1 border rounded text-sm"
              disabled={!preferences.enabled}
            />
          </div>
        )}
      </div>

      {/* Follow-up Notifications */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Follow-up Notifications</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.followUps.missed}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                followUps: { ...prev.followUps, missed: e.target.checked }
              }))}
              className="w-4 h-4 rounded text-blue-600"
              disabled={!preferences.enabled}
            />
            <span>Notify me about missed events</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.followUps.completed}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                followUps: { ...prev.followUps, completed: e.target.checked }
              }))}
              className="w-4 h-4 rounded text-blue-600"
              disabled={!preferences.enabled}
            />
            <span>Ask for notes after completed events</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}