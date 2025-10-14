import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, ExternalLink, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import CalendarIntegrationService from '../../../services/CalendarIntegrationService';
import googleAuthService from '../../../services/GoogleAuthService';
import enhancedCalendarSyncService from '../../../services/EnhancedCalendarSyncService';
import outlookAuthService from '../../../services/OutlookAuthService';
import outlookCalendarSyncService from '../../../services/OutlookCalendarSyncService';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';

// Pre-configured credentials (these would normally be environment variables)
const GOOGLE_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '1234567890-example.apps.googleusercontent.com',
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'your-api-key-here',
  scope: 'https://www.googleapis.com/auth/calendar'  // Full calendar access: read, write, delete events
};

const OUTLOOK_CONFIG = {
  clientId: process.env.REACT_APP_OUTLOOK_CLIENT_ID || 'your-outlook-client-id',
  scope: 'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/calendars.readwrite.shared'  // Full calendar access including shared calendars
};

export function SimpleCalendarSync({ onClose, embedded = false }) {
  const { familyId } = useFamily();
  const { currentUser } = useAuth();
  const googleAuth = googleAuthService;
  const calendarSync = enhancedCalendarSyncService;
  
  const [connections, setConnections] = useState({
    google: { connected: false, loading: false, error: null },
    outlook: { connected: false, loading: false, error: null }
  });
  
  // Calendar selection state
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  
  // Sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  
  // Two-way sync settings
  const [twoWaySync, setTwoWaySync] = useState(false);
  const [primaryCalendarId, setPrimaryCalendarId] = useState(null);

  useEffect(() => {
    // Check existing connections for both Google and Outlook
    const checkAuthStatus = async () => {
      // Check Google
      const isGoogleAuth = googleAuth.isTokenValid ? googleAuth.isTokenValid() : await googleAuth.isAuthenticated();
      if (isGoogleAuth) {
        setConnections(prev => ({
          ...prev,
          google: { connected: true, loading: false, error: null }
        }));

        // Load saved calendar selection and fetch available calendars
        const savedCalendars = localStorage.getItem('selectedCalendars');
        if (savedCalendars) {
          const calendars = JSON.parse(savedCalendars);
          setSelectedCalendars(calendars);

          // Find and set primary calendar
          const primary = calendars.find(cal => cal.primary);
          if (primary) {
            setPrimaryCalendarId(primary.id);
          }
        }

        // Load two-way sync setting
        const savedTwoWaySync = localStorage.getItem('twoWaySync');
        if (savedTwoWaySync === 'true') {
          setTwoWaySync(true);
        }

        // Auto-load calendars for connected account
        setTimeout(() => {
          loadGoogleCalendars().catch(err => {
            // Failed to auto-load calendars
          });
        }, 1000);

        // Load sync status
        loadSyncStatus();
      }

      // Check Outlook
      const isOutlookAuth = await outlookAuthService.isAuthenticated();
      if (isOutlookAuth) {
        setConnections(prev => ({
          ...prev,
          outlook: { connected: true, loading: false, error: null }
        }));

        // Auto-load Outlook calendars
        setTimeout(() => {
          loadOutlookCalendars().catch(err => {
            console.error('Failed to auto-load Outlook calendars:', err);
          });
        }, 1000);

        // Load sync status
        loadSyncStatus();
      }
    };

    checkAuthStatus();
  }, [googleAuth, outlookAuthService]);
  
  // Load Google Calendars
  const loadGoogleCalendars = async () => {
    setLoadingCalendars(true);
    try {
      // Ensure we have gapi client
      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        // Google Calendar API not ready
        return;
      }

      const response = await googleAuth.executeWithRetry(async () => {
        return await window.gapi.client.calendar.calendarList.list({
          maxResults: 50,
          showDeleted: false,
          showHidden: false
        });
      });

      if (response && response.result && response.result.items) {
        const calendars = response.result.items.map(cal => ({
          id: cal.id,
          summary: cal.summary || cal.id,
          description: cal.description || '',
          primary: cal.primary || false,
          accessRole: cal.accessRole,
          backgroundColor: cal.backgroundColor || '#4285f4',
          selected: cal.primary || false // Auto-select primary
        }));

        setAvailableCalendars(calendars);

        // Auto-select primary calendar
        const primary = calendars.find(cal => cal.primary);
        if (primary) {
          setPrimaryCalendarId(primary.id);
          setSelectedCalendars([primary]);
        }
      }
    } catch (error) {
    } finally {
      setLoadingCalendars(false);
    }
  };

  // Load Outlook Calendars
  const loadOutlookCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const calendarsList = await outlookCalendarSyncService.fetchCalendarsList();

      const calendars = calendarsList.map(cal => ({
        id: cal.id,
        name: cal.name,
        description: cal.description || '',
        primary: cal.isDefaultCalendar || false,
        backgroundColor: cal.color || '#0078d4',
        selected: cal.isDefaultCalendar || false
      }));

      setAvailableCalendars(calendars);

      // Auto-select primary calendar
      const primary = calendars.find(cal => cal.primary);
      if (primary) {
        setPrimaryCalendarId(primary.id);
        setSelectedCalendars([primary]);
      }
    } catch (error) {
      console.error('Failed to load Outlook calendars:', error);
    } finally {
      setLoadingCalendars(false);
    }
  };

  // Load sync status from Firestore
  const loadSyncStatus = async () => {
    if (!familyId) return;

    try {
      const status = await CalendarIntegrationService.getSyncStatus(familyId);
      if (status) {
        setSyncStatus(status);
        setLastSyncTime(status.lastSync);
      }
    } catch (error) {
    }
  };

  const handleGoogleConnect = async () => {
    setConnections(prev => ({
      ...prev,
      google: { ...prev.google, loading: true, error: null }
    }));

    try {
      // Initialize GoogleAuthService (it handles its own initialization state)
      await googleAuth.initialize();

      // Authenticate with Google using our improved service
      const token = await googleAuth.authenticate({ prompt: 'select_account' });
      const authResult = { success: !!token, error: !token ? 'Authentication failed' : null };

      if (!authResult.success) {
        throw new Error(authResult.error || 'Failed to authenticate with Google');
      }

      // Load available calendars using the Google Calendar API
      const calendarsResult = await googleAuth.executeWithRetry(async () => {
        const response = await window.gapi.client.calendar.calendarList.list();
        return response.result;
      });

      if (!calendarsResult?.items) {
        throw new Error('Failed to fetch calendar list');
      }

      // Store available calendars
      const calendars = calendarsResult.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary,
        accessRole: cal.accessRole,
        backgroundColor: cal.backgroundColor,
        selected: cal.primary // Auto-select primary calendar
      }));

      setAvailableCalendars(calendars);
      setSelectedCalendars(calendars.filter(cal => cal.selected));

      // Initialize the sync service with the authenticated token
      await calendarSync.initialize(familyId, currentUser?.uid);

      // Success
      setConnections({
        google: { connected: true, loading: false, error: null },
        outlook: connections.outlook
      });

    } catch (error) {
      const errorMessage = error.message || 'Failed to connect to Google Calendar';

      setConnections(prev => ({
        ...prev,
        google: {
          connected: false,
          loading: false,
          error: errorMessage
        }
      }));
    }
  };

  const handleOutlookConnect = async () => {
    setConnections(prev => ({
      ...prev,
      outlook: { ...prev.outlook, loading: true, error: null }
    }));

    try {
      // Use the new OutlookAuthService
      await outlookAuthService.authenticate(currentUser?.uid);

      setConnections(prev => ({
        ...prev,
        outlook: { connected: true, loading: false, error: null }
      }));

      // Load Outlook calendars
      await loadOutlookCalendars();

      // Load sync status
      loadSyncStatus();
    } catch (error) {
      console.error('Outlook connection error:', error);
      const errorMessage = error.message || 'Failed to connect to Outlook Calendar';

      setConnections(prev => ({
        ...prev,
        outlook: {
          connected: false,
          loading: false,
          error: errorMessage
        }
      }));
    }
  };

  const handleDisconnect = async (provider) => {
    if (provider === 'google') {
      try {
        // Revoke Google auth token
        await googleAuth.revoke();
        // Google auth revoked successfully
      } catch (error) {
        // Error revoking Google auth
        // Continue with disconnect even if revoke fails
      }
    } else if (provider === 'outlook') {
      try {
        // Revoke Outlook auth token
        await outlookAuthService.revoke();
      } catch (error) {
        console.error('Error revoking Outlook auth:', error);
        // Continue with disconnect even if revoke fails
      }
    }

    const newConnections = {
      ...connections,
      [provider]: { connected: false, loading: false, error: null }
    };
    setConnections(newConnections);
    localStorage.setItem('calendarConnections', JSON.stringify(newConnections));

    // Clear calendar selection and cached data
    if (provider === 'google' || provider === 'outlook') {
      setAvailableCalendars([]);
      setSelectedCalendars([]);
      localStorage.removeItem('selectedCalendars');
      localStorage.removeItem('googleAuthToken');
      localStorage.removeItem('googleRefreshToken');

      // Clear any sync status
      setSyncStatus(null);
      setLastSyncTime(null);
    }
  };

  const handleCalendarToggle = (calendarId) => {
    const updatedCalendars = availableCalendars.map(cal => {
      if (cal.id === calendarId) {
        return { ...cal, selected: !cal.selected };
      }
      return cal;
    });

    setAvailableCalendars(updatedCalendars);

    const selected = updatedCalendars.filter(cal => cal.selected);
    setSelectedCalendars(selected);
    localStorage.setItem('selectedCalendars', JSON.stringify(selected));
  };

  const handleSelectAll = () => {
    const updatedCalendars = availableCalendars.map(cal => ({ ...cal, selected: true }));
    setAvailableCalendars(updatedCalendars);
    setSelectedCalendars(updatedCalendars);
    localStorage.setItem('selectedCalendars', JSON.stringify(updatedCalendars));
  };

  const handleDeselectAll = () => {
    const updatedCalendars = availableCalendars.map(cal => ({ ...cal, selected: false }));
    setAvailableCalendars(updatedCalendars);
    setSelectedCalendars([]);
    localStorage.setItem('selectedCalendars', JSON.stringify([]));
  };

  // Sync Calendars with Allie (Google or Outlook)
  const handleSync = async () => {
    console.log('🔄 handleSync started with:', {
      familyId,
      selectedCalendarsCount: selectedCalendars.length,
      selectedCalendars: selectedCalendars.map(c => ({ id: c.id, summary: c.summary })),
      currentUserId: currentUser?.uid
    });

    if (!familyId || selectedCalendars.length === 0) {
      const error = !familyId ? 'Missing familyId' : 'Please select at least one calendar to sync';
      console.error('❌ Sync validation failed:', error);
      setSyncError(error);
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      let result;

      // Determine which provider to sync
      if (connections.google.connected) {
        console.log('✅ Google Calendar connected, starting sync...');

        // Ensure we're authenticated with Google
        const isAuth = googleAuth.isTokenValid ? googleAuth.isTokenValid() : await googleAuth.isAuthenticated();
        if (!isAuth) {
          throw new Error('Please reconnect to Google Calendar');
        }

        // Initialize the sync service if needed
        console.log(`📝 Initializing sync service with familyId: "${familyId}"`);
        await calendarSync.initialize(familyId, currentUser?.uid);

        // Sync Google Calendar
        console.log(`📝 Calling CalendarIntegrationService.syncGoogleCalendars...`);
        result = await CalendarIntegrationService.syncGoogleCalendars(
          selectedCalendars,
          familyId
        );
        console.log('✅ syncGoogleCalendars completed:', result);
      } else if (connections.outlook.connected) {
        // Ensure we're authenticated with Outlook
        const isAuth = await outlookAuthService.isAuthenticated();
        if (!isAuth) {
          throw new Error('Please reconnect to Outlook Calendar');
        }

        // Sync Outlook Calendar
        const calendarIds = selectedCalendars.map(cal => cal.id);
        const syncResult = await outlookCalendarSyncService.performSync(
          familyId,
          calendarIds,
          { twoWaySync }
        );

        if (!syncResult.success) {
          throw new Error(syncResult.error || 'Sync failed');
        }

        result = {
          imported: syncResult.results.fromOutlook.created + syncResult.results.fromOutlook.updated,
          exported: syncResult.results.toOutlook.created + syncResult.results.toOutlook.updated,
          total: syncResult.results.fromOutlook.created + syncResult.results.fromOutlook.updated +
                 syncResult.results.toOutlook.created + syncResult.results.toOutlook.updated
        };
      } else {
        throw new Error('No calendar provider connected');
      }

      // Sync completed

      // Update sync status with enhanced metrics
      setSyncStatus({
        lastSync: new Date().toISOString(),
        eventsImported: result.imported || 0,
        eventsExported: result.exported || 0,
        totalEvents: result.total || 0,
        conflicts: result.conflicts || [],
        errors: result.errors || []
      });
      setLastSyncTime(new Date().toISOString());

      // Handle conflicts and errors
      if (result.conflicts && result.conflicts.length > 0) {
        setSyncError(`${result.conflicts.length} conflicts detected and resolved.`);
      } else if (result.errors && result.errors.length > 0) {
        setSyncError(`Sync completed with ${result.errors.length} errors.`);
      } else {
        setSyncError(null); // Clear errors on successful sync
      }

      // Trigger calendar refresh
      // Method 1: Try refreshing through the event context
      if (window.refreshCalendarData) {
        window.refreshCalendarData();
      }
      
      // Method 2: Try refreshing through the NewEventContext
      const eventContext = window._eventContext;
      if (eventContext && eventContext.refreshEvents) {
        // Refreshing events through NewEventContext
        await eventContext.refreshEvents();
      }
      
      // Method 3: Dispatch a custom event to trigger refresh
      window.dispatchEvent(new CustomEvent('calendar-sync-completed', {
        detail: {
          familyId,
          eventsImported: result.eventsImported,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Method 4: Force reload the calendar provider if available
      if (window.__calendarProviderSetLoading) {
        // Forcing calendar provider to reload
        window.__calendarProviderSetLoading(true);
        setTimeout(() => {
          window.__calendarProviderSetLoading(false);
        }, 100);
      }
      
    } catch (error) {
      setSyncError(error.message || 'Failed to sync calendars');
    } finally {
      setIsSyncing(false);
    }
  };


  // Google API loading is now handled by GoogleAuthService

  // Conditional styling based on whether it's embedded or modal
  const containerClass = embedded 
    ? "space-y-6" 
    : "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden";
  
  const contentClass = embedded 
    ? "space-y-6" 
    : "p-6 space-y-6";

  return (
    <div className={containerClass}>
      {/* Header - only show for modal mode */}
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Calendar Sync Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div className={contentClass}>
        {/* Google Calendar */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://www.google.com/images/branding/product/2x/calendar_48dp.png" 
                alt="Google Calendar" 
                className="w-10 h-10"
              />
              <div>
                <h3 className="font-medium text-gray-900">Google Calendar</h3>
                <p className="text-sm text-gray-500">
                  {connections.google.connected 
                    ? 'Connected - Events will sync automatically' 
                    : 'Not connected'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {connections.google.connected && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              
              {connections.google.connected ? (
                <button
                  onClick={() => handleDisconnect('google')}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  disabled={connections.google.loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {connections.google.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Connect with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {connections.google.error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{connections.google.error}</span>
            </div>
          )}

          {connections.google.connected && (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
                <p className="font-medium">✓ Connected successfully!</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Two-way sync between Allie and Google Calendar</li>
                  <li>• Events created in either calendar will appear in both</li>
                  <li>• Changes made in one calendar sync to the other</li>
                </ul>
              </div>
              
              {/* Inline Calendar Selection */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Select Calendars to Sync</h4>
                  {availableCalendars.length === 0 && (
                    <button
                      onClick={loadGoogleCalendars}
                      disabled={loadingCalendars}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      {loadingCalendars ? 'Loading...' : 'Load Calendars'}
                    </button>
                  )}
                </div>
                
                {availableCalendars.length > 0 && (
                  <>
                    {/* Select All / Deselect All buttons */}
                    <div className="flex items-center justify-between mb-2 px-3">
                      <span className="text-sm text-gray-600">
                        {selectedCalendars.length} of {availableCalendars.length} selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        >
                          Select All
                        </button>
                        <button
                          onClick={handleDeselectAll}
                          className="text-xs px-2 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      {availableCalendars.map((calendar) => (
                      <div
                        key={calendar.id}
                        className="flex items-center space-x-3 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleCalendarToggle(calendar.id)}
                      >
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={calendar.selected}
                            onChange={() => handleCalendarToggle(calendar.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: calendar.backgroundColor || '#3B82F6'
                              }}
                            />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {calendar.summary}
                              {calendar.primary && (
                                <span className="ml-1 text-xs text-blue-600">(Primary)</span>
                              )}
                            </p>
                          </div>
                          {calendar.description && (
                            <p className="text-xs text-gray-500 truncate mt-1 ml-5">
                              {calendar.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-400 capitalize">
                            {calendar.accessRole}
                          </span>
                        </div>
                      </div>
                      ))}
                    </div>
                  </>
                )}

                {availableCalendars.length > 0 && (
                  <div className="space-y-3">
                    
                    {/* Two-way sync toggle */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">Two-way Sync</h5>
                          <p className="text-xs text-gray-600 mt-1">
                            Sync changes from Allie back to Google Calendar
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newValue = !twoWaySync;
                            setTwoWaySync(newValue);
                            localStorage.setItem('twoWaySync', newValue.toString());
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            twoWaySync ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              twoWaySync ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {twoWaySync && primaryCalendarId && (
                        <div className="mt-2 text-xs text-gray-600">
                          New events will be created in: <span className="font-medium">
                            {availableCalendars.find(c => c.id === primaryCalendarId)?.summary || 'Primary calendar'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Sync Button and Status */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {lastSyncTime && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              Last synced: {new Date(lastSyncTime).toLocaleString()}
                            </div>
                          )}
                          {syncStatus && syncStatus.eventsImported !== undefined && (
                            <div className="text-xs text-gray-600 mt-1">
                              {syncStatus.eventsImported} events imported
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleSync}
                            disabled={isSyncing || selectedCalendars.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Syncing...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Sync Now</span>
                              </>
                            )}
                          </button>
                          
                          {twoWaySync && primaryCalendarId && (
                            <button
                              onClick={async () => {
                                setIsSyncing(true);
                                setSyncError(null);
                                try {
                                  const result = await CalendarIntegrationService.pushAllieEventsToGoogle(
                                    familyId, 
                                    primaryCalendarId
                                  );
                                  
                                  // Push to Google result
                                  
                                  // Update sync status to show results
                                  setSyncStatus({
                                    ...syncStatus,
                                    pushedToGoogle: result.created + result.updated,
                                    pushErrors: result.errors.length,
                                    lastPushTime: new Date().toISOString()
                                  });
                                } catch (error) {
                                  setSyncError(`Failed to push to Google: ${error.message}`);
                                } finally {
                                  setIsSyncing(false);
                                }
                              }}
                              disabled={isSyncing}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                              {isSyncing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Pushing...</span>
                                </>
                              ) : (
                                <>
                                  <span>📤</span>
                                  <span>Push to Google</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {syncError && (
                        <div className="mt-3 p-2 bg-red-50 text-red-600 text-xs rounded">
                          {syncError}
                        </div>
                      )}
                      
                      {syncStatus && syncStatus.errors && syncStatus.errors.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded">
                          <p className="font-medium">Some calendars had issues:</p>
                          <ul className="mt-1 list-disc list-inside">
                            {syncStatus.errors.map((error, index) => (
                              <li key={index}>{error.calendar}: {error.error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Outlook Calendar */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Outlook Calendar</h3>
                <p className="text-sm text-gray-500">
                  {connections.outlook.connected 
                    ? 'Connected - Events will sync automatically' 
                    : 'Not connected'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {connections.outlook.connected && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              
              {connections.outlook.connected ? (
                <button
                  onClick={() => handleDisconnect('outlook')}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleOutlookConnect}
                  disabled={connections.outlook.loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {connections.outlook.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Connect with Outlook</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {connections.outlook.error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{connections.outlook.error}</span>
            </div>
          )}

          {connections.outlook.connected && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              <p className="font-medium">✓ Connected successfully!</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Two-way sync between Allie and Outlook Calendar</li>
                <li>• Events created in either calendar will appear in both</li>
                <li>• Works with Office 365 and Outlook.com</li>
              </ul>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Calendar Sync Works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Connect your existing calendar accounts with one click</li>
            <li>• Events automatically sync in both directions</li>
            <li>• Family events from Allie appear in your personal calendar</li>
            <li>• Personal events can be shared with your family when appropriate</li>
          </ul>
        </div>

        {/* Development Notice - only show in modal mode */}
        {!embedded && (!GOOGLE_CONFIG.clientId || !GOOGLE_CONFIG.apiKey || 
          GOOGLE_CONFIG.clientId.includes('example') || 
          GOOGLE_CONFIG.apiKey.includes('your-api-key')) && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">⚙️ Development Mode</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Calendar integration requires OAuth credentials to be configured.
            </p>
            <details className="text-xs text-yellow-600">
              <summary className="cursor-pointer font-medium">Setup Instructions</summary>
              <ol className="mt-2 ml-4 space-y-1 list-decimal">
                <li>Go to Google Cloud Console</li>
                <li>Enable Google Calendar API</li>
                <li>Create OAuth 2.0 Client ID</li>
                <li>Set environment variables:
                  <br />• REACT_APP_GOOGLE_CLIENT_ID
                  <br />• REACT_APP_GOOGLE_API_KEY
                </li>
                <li>Restart the development server</li>
              </ol>
              <p className="mt-2 text-yellow-600">
                See CALENDAR_OAUTH_SETUP.md for detailed instructions.
              </p>
            </details>
          </div>
        )}
      </div>

    </div>
  );
}

export default SimpleCalendarSync;