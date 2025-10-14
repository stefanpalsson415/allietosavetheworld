// src/components/calendar-v2/views/CalendarSyncSettings.js

import React, { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarSyncService } from '../services/CalendarSyncService';
import { GoogleCalendarAdapter } from '../services/GoogleCalendarAdapter';
import { OutlookCalendarAdapter } from '../services/OutlookCalendarAdapter';
import { Calendar, RefreshCw, CheckCircle, XCircle, Settings, LogOut } from 'lucide-react';

// Initialize sync service
const syncService = new CalendarSyncService();

// Register adapters
syncService.registerAdapter('google', new GoogleCalendarAdapter());
syncService.registerAdapter('outlook', new OutlookCalendarAdapter());

export function CalendarSyncSettings({ onClose }) {
  const { events, createEvent, updateEvent, deleteEvent } = useCalendar();
  const [syncStatuses, setSyncStatuses] = useState({});
  const [syncConfig, setSyncConfig] = useState({
    google: {
      clientId: '',
      apiKey: '',
      enabled: false
    },
    outlook: {
      clientId: '',
      enabled: false
    }
  });
  const [syncing, setSyncing] = useState({});
  const [selectedCalendars, setSelectedCalendars] = useState({
    google: 'primary',
    outlook: 'primary'
  });

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('calendarSyncConfig');
    if (savedConfig) {
      setSyncConfig(JSON.parse(savedConfig));
    }

    // Get initial sync statuses
    setSyncStatuses(syncService.getAllSyncStatuses());
  }, []);

  const handleConnect = async (provider) => {
    setSyncing(prev => ({ ...prev, [provider]: true }));

    try {
      // Initialize the provider
      await syncService.initializeSync(provider, syncConfig[provider]);
      
      // Perform initial sync
      await handleSync(provider);
      
      // Update status
      setSyncStatuses(syncService.getAllSyncStatuses());
      
      // Save config
      localStorage.setItem('calendarSyncConfig', JSON.stringify(syncConfig));
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      alert(`Failed to connect ${provider}: ${error.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider) => {
    try {
      const adapter = syncService.syncAdapters.get(provider);
      if (adapter) {
        await adapter.disconnect();
      }
      
      // Update status
      syncService.setSyncStatus(provider, 'disconnected');
      setSyncStatuses(syncService.getAllSyncStatuses());
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
    }
  };

  const handleSync = async (provider) => {
    setSyncing(prev => ({ ...prev, [provider]: true }));

    try {
      // Sync from external calendar
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

      const externalEvents = await syncService.syncFromExternal(provider, {
        startDate,
        endDate
      });

      // Create or update local events
      for (const externalEvent of externalEvents) {
        const existingEvent = events.find(e => 
          e.syncedCalendars?.[provider]?.id === externalEvent.externalId
        );

        if (existingEvent) {
          // Check for conflicts
          const conflict = syncService.resolveConflict(existingEvent, externalEvent, 'newest');
          
          if (conflict.action === 'updateLocal') {
            await updateEvent(existingEvent.id, conflict.event);
          }
        } else {
          // Create new local event
          await createEvent(externalEvent);
        }
      }

      // Sync local events to external
      const localEventsToSync = events.filter(e => 
        !e.syncedCalendars?.[provider] && e.source !== provider
      );

      if (localEventsToSync.length > 0) {
        await syncService.syncToExternal(provider, localEventsToSync);
      }

      // Update sync status
      setSyncStatuses(syncService.getAllSyncStatuses());
    } catch (error) {
      console.error(`Failed to sync ${provider}:`, error);
      alert(`Failed to sync ${provider}: ${error.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleConfigChange = (provider, field, value) => {
    setSyncConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Calendar Sync Settings</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Google Calendar */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://www.google.com/images/branding/product/2x/calendar_48dp.png" 
              alt="Google Calendar" 
              className="w-8 h-8"
            />
            <div>
              <h3 className="font-medium">Google Calendar</h3>
              <p className="text-sm text-gray-600">
                {syncStatuses.google?.status === 'connected' 
                  ? `Last synced: ${syncStatuses.google?.lastSync ? new Date(syncStatuses.google.lastSync).toLocaleString() : 'Never'}`
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          {getStatusIcon(syncStatuses.google?.status)}
        </div>

        {syncStatuses.google?.status !== 'connected' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={syncConfig.google.clientId}
                onChange={(e) => handleConfigChange('google', 'clientId', e.target.value)}
                placeholder="Your Google OAuth Client ID"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={syncConfig.google.apiKey}
                onChange={(e) => handleConfigChange('google', 'apiKey', e.target.value)}
                placeholder="Your Google API Key"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <button
              onClick={() => handleConnect('google')}
              disabled={!syncConfig.google.clientId || !syncConfig.google.apiKey || syncing.google}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing.google ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleSync('google')}
              disabled={syncing.google}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing.google ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => handleDisconnect('google')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {syncStatuses.google?.error && (
          <p className="mt-2 text-sm text-red-600">{syncStatuses.google.error}</p>
        )}
      </div>

      {/* Outlook Calendar */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/732/732221.png" 
              alt="Outlook" 
              className="w-8 h-8"
            />
            <div>
              <h3 className="font-medium">Outlook Calendar</h3>
              <p className="text-sm text-gray-600">
                {syncStatuses.outlook?.status === 'connected' 
                  ? `Last synced: ${syncStatuses.outlook?.lastSync ? new Date(syncStatuses.outlook.lastSync).toLocaleString() : 'Never'}`
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          {getStatusIcon(syncStatuses.outlook?.status)}
        </div>

        {syncStatuses.outlook?.status !== 'connected' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application (Client) ID
              </label>
              <input
                type="text"
                value={syncConfig.outlook.clientId}
                onChange={(e) => handleConfigChange('outlook', 'clientId', e.target.value)}
                placeholder="Your Azure App Client ID"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <button
              onClick={() => handleConnect('outlook')}
              disabled={!syncConfig.outlook.clientId || syncing.outlook}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing.outlook ? 'Connecting...' : 'Connect Outlook Calendar'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleSync('outlook')}
              disabled={syncing.outlook}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing.outlook ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={() => handleDisconnect('outlook')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {syncStatuses.outlook?.error && (
          <p className="mt-2 text-sm text-red-600">{syncStatuses.outlook.error}</p>
        )}
      </div>

      {/* Sync Settings */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">Sync Settings</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-blue-600"
              defaultChecked
            />
            <span className="text-sm">Automatically sync every hour</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-blue-600"
              defaultChecked
            />
            <span className="text-sm">Two-way sync (sync changes both ways)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-blue-600"
            />
            <span className="text-sm">Sync attendees and invitations</span>
          </label>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Google Calendar:</strong> Create a project in Google Cloud Console, 
            enable Calendar API, and create OAuth 2.0 credentials.
          </p>
          <p>
            <strong>Outlook Calendar:</strong> Register an app in Azure Portal, 
            add Calendar permissions, and configure redirect URI.
          </p>
        </div>
      </div>
    </div>
  );
}