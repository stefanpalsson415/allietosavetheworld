// src/services/ProactiveAlertSystem.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProactiveAlertSystem from './ProactiveAlertSystem';
import ProactiveAlertsWidget from '../components/notifications/ProactiveAlertsWidget';
import { FamilyContext } from '../contexts/FamilyContext';
import React from 'react';

// Mock Firebase
jest.mock('./firebase', () => {
  const firebaseMock = {
    db: {},
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    setDoc: jest.fn().mockResolvedValue({}),
    updateDoc: jest.fn().mockResolvedValue({}),
    deleteDoc: jest.fn().mockResolvedValue({}),
    getDoc: jest.fn().mockResolvedValue({ 
      data: () => ({ title: 'Test Alert' }),
      exists: true 
    }),
    getDocs: jest.fn().mockResolvedValue({
      forEach: jest.fn((callback) => {
        callback({
          id: 'test-alert-1',
          data: () => ({
            id: 'test-alert-1',
            title: 'Test Alert 1',
            message: 'This is a test alert',
            priority: 3,
            alertType: 'MORNING_BRIEFING',
            wholeFamily: true,
            isDismissed: false,
            expiration: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
            createdAt: { toDate: () => new Date() }
          })
        });
      })
    }),
    query: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    Timestamp: {
      fromDate: jest.fn(date => date),
      now: jest.fn(() => new Date())
    },
    serverTimestamp: jest.fn(() => new Date())
  };
  
  return {
    db: firebaseMock,
    collection: jest.fn(() => firebaseMock),
    doc: jest.fn(() => firebaseMock),
    getDoc: firebaseMock.getDoc,
    getDocs: firebaseMock.getDocs,
    setDoc: firebaseMock.setDoc,
    updateDoc: firebaseMock.updateDoc,
    deleteDoc: firebaseMock.deleteDoc,
    query: firebaseMock.query,
    where: firebaseMock.where,
    orderBy: firebaseMock.orderBy,
    limit: firebaseMock.limit,
    Timestamp: firebaseMock.Timestamp,
    serverTimestamp: firebaseMock.serverTimestamp
  };
});

// Mock CalendarService and other dependencies
jest.mock('./CalendarService', () => ({
  __esModule: true,
  default: {
    getEvents: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('./EventStore', () => ({
  __esModule: true,
  default: {
    getEvents: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('./ActivityManager', () => ({
  __esModule: true,
  default: {
    getTransportationNeeds: jest.fn().mockResolvedValue([]),
    getEquipmentNeeds: jest.fn().mockResolvedValue([])
  }
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}));

describe('ProactiveAlertSystem', () => {
  // Basic test to verify service exists
  test('creates an alert', async () => {
    const result = await ProactiveAlertSystem.createAlert(
      'test-family',
      'MORNING_BRIEFING',
      { title: 'Test Alert', message: 'This is a test' }
    );
    
    expect(result.success).toBeTruthy();
    expect(result.alertId).toBeDefined();
  });
  
  // Test generating test alerts
  test('generates test alerts', async () => {
    const result = await ProactiveAlertSystem.generateTestAlerts(
      'test-family',
      'test-member'
    );
    
    expect(result.success).toBeTruthy();
    expect(result.count).toBeGreaterThan(0);
  });
  
  // Test fetching alerts
  test('fetches alerts for a member', async () => {
    const alerts = await ProactiveAlertSystem.getAlertsForMember(
      'test-family',
      'test-member'
    );
    
    expect(Array.isArray(alerts)).toBeTruthy();
    expect(alerts.length).toBeGreaterThan(0);
  });
  
  // Test ProactiveAlertsWidget component rendering
  test('renders ProactiveAlertsWidget component', () => {
    render(
      <FamilyContext.Provider value={{ 
        currentMember: { id: 'test-member', name: 'Test User' },
        familyId: 'test-family'
      }}>
        <ProactiveAlertsWidget position="bottom-right" />
      </FamilyContext.Provider>
    );
    
    // Test widget button is present
    expect(screen.getByLabelText('Generate Test Alerts')).toBeInTheDocument();
    expect(screen.getByLabelText('Proactive Alerts')).toBeInTheDocument();
  });
});