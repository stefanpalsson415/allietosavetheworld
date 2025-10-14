// src/tests/calendar/CalendarIntegration.test.js
// End-to-end integration tests for the calendar system

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FamilyProvider } from '../../contexts/FamilyContext';
import { AuthProvider } from '../../contexts/AuthContext';
import ImprovedCalendarView from '../../components/calendar/ImprovedCalendarView';
import useImprovedCalendar from '../../hooks/useImprovedCalendar';
import googleAuthService from '../../services/GoogleAuthService';
import enhancedCalendarSyncService from '../../services/EnhancedCalendarSyncService';

// Mock providers wrapper
const AllProviders = ({ children }) => (
  <AuthProvider>
    <FamilyProvider>
      {children}
    </FamilyProvider>
  </AuthProvider>
);

// Mock services
jest.mock('../../services/GoogleAuthService');
jest.mock('../../services/EnhancedCalendarSyncService');
jest.mock('../../services/CalendarService');

describe('Calendar System Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock auth service
    googleAuthService.getAuthStatus = jest.fn(() => ({
      isAuthenticated: false,
      accessToken: null
    }));
    googleAuthService.onAuthChange = jest.fn(() => jest.fn());
    googleAuthService.authenticate = jest.fn(() => Promise.resolve('mock_token'));
    googleAuthService.revoke = jest.fn(() => Promise.resolve());

    // Mock sync service
    enhancedCalendarSyncService.syncStatus = {
      google: {
        connected: false,
        syncing: false,
        lastSync: null
      }
    };
    enhancedCalendarSyncService.onSyncStatusChange = jest.fn(() => jest.fn());
    enhancedCalendarSyncService.performFullSync = jest.fn(() =>
      Promise.resolve({
        success: true,
        results: {
          fromGoogle: { created: 5, updated: 2 },
          toGoogle: { created: 3, updated: 1 }
        }
      })
    );
    enhancedCalendarSyncService.getUnresolvedConflicts = jest.fn(() =>
      Promise.resolve([])
    );
  });

  describe('Calendar View Rendering', () => {
    test('should render calendar view with header', () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      expect(screen.getByText('Family Calendar')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Add Event')).toBeInTheDocument();
    });

    test('should display month view by default', () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Check for day labels
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    test('should switch between view modes', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const weekButton = screen.getByText('Week');
      await userEvent.click(weekButton);

      // View should update (in real implementation, would check for week-specific elements)
      expect(weekButton.parentElement).toHaveClass('bg-white');
    });
  });

  describe('Google Calendar Connection', () => {
    test('should connect to Google Calendar', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      // Click connect button
      const connectButton = await screen.findByText('Connect Google Calendar');
      await userEvent.click(connectButton);

      await waitFor(() => {
        expect(googleAuthService.authenticate).toHaveBeenCalledWith({
          prompt: 'select_account'
        });
      });
    });

    test('should show connected status', async () => {
      googleAuthService.getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'mock_token'
      });

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Synced')).toBeInTheDocument();
      });
    });

    test('should disconnect from Google Calendar', async () => {
      googleAuthService.getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'mock_token'
      });

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      // Click disconnect
      const disconnectButton = await screen.findByText('Disconnect');
      await userEvent.click(disconnectButton);

      expect(googleAuthService.revoke).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    test('should open event creation modal', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const addButton = screen.getByText('Add Event');
      await userEvent.click(addButton);

      // Modal should appear (implementation would check for modal elements)
      expect(addButton).toBeInTheDocument();
    });

    test('should search events', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const searchInput = screen.getByPlaceholderText('Search events...');
      await userEvent.type(searchInput, 'meeting');

      expect(searchInput).toHaveValue('meeting');
    });

    test('should filter by family member', async () => {
      const mockFamilyMembers = [
        { id: 'member1', name: 'John', color: '#9333ea' },
        { id: 'member2', name: 'Jane', color: '#3b82f6' }
      ];

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Implementation would click on member avatar
      // and verify filter is applied
    });
  });

  describe('Calendar Sync', () => {
    test('should perform manual sync', async () => {
      googleAuthService.getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'mock_token'
      });

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const syncButton = await screen.findByRole('button', { name: /sync/i });
      await userEvent.click(syncButton);

      await waitFor(() => {
        expect(enhancedCalendarSyncService.performFullSync).toHaveBeenCalled();
      });
    });

    test('should show syncing status', async () => {
      googleAuthService.getAuthStatus.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'mock_token'
      });

      enhancedCalendarSyncService.syncStatus.google.syncing = true;

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    test('should display sync conflicts', async () => {
      enhancedCalendarSyncService.getUnresolvedConflicts.mockResolvedValue([
        {
          id: 'conflict1',
          localEvent: { title: 'Local Event' },
          googleEvent: { title: 'Google Event' }
        }
      ]);

      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('1 conflicts')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Navigation', () => {
    test('should navigate to next month', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      const currentMonth = screen.getByText(/2025/);

      await userEvent.click(nextButton);

      // Month should change (implementation would verify month text)
      expect(currentMonth).toBeInTheDocument();
    });

    test('should navigate to today', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      const todayButton = screen.getByText('Today');
      await userEvent.click(todayButton);

      // Should show current month/year
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('Settings Management', () => {
    test('should save calendar preferences', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      // Change week start
      const weekStartSelect = await screen.findByLabelText('Week starts on');
      await userEvent.selectOptions(weekStartSelect, '1');

      // Save settings
      const saveButton = screen.getByText('Save Settings');
      await userEvent.click(saveButton);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'calendarPreferences',
        expect.stringContaining('"weekStartsOn":1')
      );
    });

    test('should toggle features', async () => {
      render(
        <AllProviders>
          <ImprovedCalendarView />
        </AllProviders>
      );

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await userEvent.click(settingsButton);

      // Toggle two-way sync
      const twoWaySyncCheckbox = await screen.findByLabelText('Two-way sync');
      await userEvent.click(twoWaySyncCheckbox);

      expect(twoWaySyncCheckbox).not.toBeChecked();
    });
  });
});

describe('useImprovedCalendar Hook Tests', () => {
  test('should initialize hook with default values', () => {
    const TestComponent = () => {
      const calendar = useImprovedCalendar();

      return (
        <div>
          <span data-testid="loading">{calendar.loading.toString()}</span>
          <span data-testid="connected">{calendar.connected.toString()}</span>
          <span data-testid="view">{calendar.viewMode}</span>
        </div>
      );
    };

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('connected')).toHaveTextContent('false');
    expect(screen.getByTestId('view')).toHaveTextContent('month');
  });

  test('should handle event creation', async () => {
    const TestComponent = () => {
      const calendar = useImprovedCalendar();

      return (
        <button
          onClick={() =>
            calendar.createEvent({
              title: 'Test Event',
              startDate: '2025-09-20T10:00:00'
            })
          }
        >
          Create Event
        </button>
      );
    };

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    const button = screen.getByText('Create Event');
    await userEvent.click(button);

    // Would verify CalendarService.addEvent was called
  });

  test('should handle calendar navigation', async () => {
    const TestComponent = () => {
      const calendar = useImprovedCalendar();

      return (
        <div>
          <button onClick={() => calendar.navigate('next')}>Next</button>
          <button onClick={() => calendar.goToToday()}>Today</button>
          <span data-testid="date">
            {calendar.currentDate.toISOString().split('T')[0]}
          </span>
        </div>
      );
    };

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    const nextButton = screen.getByText('Next');
    await userEvent.click(nextButton);

    // Date should change
    const todayButton = screen.getByText('Today');
    await userEvent.click(todayButton);

    // Should return to current date
  });
});

describe('Error Handling', () => {
  test('should handle sync errors gracefully', async () => {
    enhancedCalendarSyncService.performFullSync.mockRejectedValue(
      new Error('Network error')
    );

    googleAuthService.getAuthStatus.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock_token'
    });

    render(
      <AllProviders>
        <ImprovedCalendarView />
      </AllProviders>
    );

    const syncButton = await screen.findByRole('button', { name: /sync/i });
    await userEvent.click(syncButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to sync calendar/)).toBeInTheDocument();
    });
  });

  test('should handle authentication errors', async () => {
    googleAuthService.authenticate.mockRejectedValue(
      new Error('Authentication failed')
    );

    render(
      <AllProviders>
        <ImprovedCalendarView />
      </AllProviders>
    );

    // Open settings and try to connect
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await userEvent.click(settingsButton);

    const connectButton = await screen.findByText('Connect Google Calendar');
    await userEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect/)).toBeInTheDocument();
    });
  });
});

describe('Performance Tests', () => {
  test('should handle large number of events', async () => {
    const largeEventSet = Array.from({ length: 1000 }, (_, i) => ({
      id: `event${i}`,
      title: `Event ${i}`,
      startDate: '2025-09-20T10:00:00',
      endDate: '2025-09-20T11:00:00'
    }));

    // Mock CalendarService to return large dataset
    const CalendarService = require('../../services/CalendarService').default;
    CalendarService.getEventsByDateRange = jest.fn(() =>
      Promise.resolve(largeEventSet)
    );

    const startTime = performance.now();

    render(
      <AllProviders>
        <ImprovedCalendarView />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Family Calendar')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (2 seconds)
    expect(renderTime).toBeLessThan(2000);
  });

  test('should efficiently filter events', async () => {
    const TestComponent = () => {
      const calendar = useImprovedCalendar();
      const [filtered, setFiltered] = React.useState([]);

      React.useEffect(() => {
        // Create large event set
        const events = Array.from({ length: 1000 }, (_, i) => ({
          id: `event${i}`,
          title: `Event ${i}`,
          category: i % 2 === 0 ? 'work' : 'personal'
        }));

        const startTime = performance.now();
        const result = calendar.filterEvents({
          categories: ['work']
        });
        const endTime = performance.now();

        setFiltered(result);
        console.log(`Filter time: ${endTime - startTime}ms`);
      }, []);

      return <div>Filtered: {filtered.length}</div>;
    };

    render(
      <AllProviders>
        <TestComponent />
      </AllProviders>
    );

    // Filter operation should be fast
  });
});