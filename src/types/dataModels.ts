/**
 * Data Models - TypeScript Interfaces
 *
 * Generated from 2 days of agent-driven test data (Palsson Family Simulation)
 * Based on: DATA_SCHEMA_QUICK_REFERENCE.md
 *
 * Critical Patterns Implemented:
 * 1. Triple ID Pattern - Family members require id, memberId, AND userId
 * 2. CycleId Format - Habits use just number "45", not "weekly_45"
 * 3. Timestamp Duality - Store both Firestore Timestamp and ISO string
 * 4. Security userId - Events must include userId for security rules
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS & TYPES
// ============================================================================

export type Role = 'parent' | 'child';
export type HabitCategory = 'home' | 'kids' | 'work' | 'self';
export type CycleType = 'weekly' | 'monthly';
export type EventSource = 'google' | 'manual';
export type ContactCategory = 'Medical' | 'School' | 'Sports' | 'Education' | 'Childcare' | 'Friends' | 'Family' | 'Services';
export type Priority = 'high' | 'medium' | 'low';

// ============================================================================
// FAMILY & MEMBERS
// ============================================================================

/**
 * Personality Traits (Agent Simulation)
 * All values: 0.0-1.0 scale
 */
export interface PersonalityTraits {
  helpfulness: number;    // 0.0-1.0
  awareness: number;      // 0.0-1.0
  followThrough: number;  // 0.0-1.0
  initiative: number;     // 0.0-1.0
}

/**
 * Family Member
 *
 * CRITICAL: Triple ID Pattern
 * ALL THREE ID fields are REQUIRED because different services expect different fields:
 * - FamilyContext uses 'id'
 * - FamilyProfileService uses 'memberId'
 * - Firestore queries use 'userId'
 *
 * All three should have the same value: member.id === member.memberId === member.userId
 */
export interface FamilyMember {
  // Triple ID Pattern (ALL THREE REQUIRED)
  id: string;
  memberId: string;
  userId: string;

  // Core fields
  name: string;
  role: Role;
  isParent: boolean;
  age: number;
  email?: string;          // Required for parents
  phone?: string;          // E.164 format: +14155551234
  avatar: string;          // Emoji or URL

  // Agent Simulation Fields (optional)
  personality?: PersonalityTraits;
  mentalLoad?: number;              // 0.0-1.0 scale
  taskCreationRate?: number;        // 0.0-1.0 scale
  agentType?: string;               // "StefanAgent", "KimberlyAgent", etc.
  isSimulatedAgent?: boolean;
}

/**
 * Family Document
 * Root document for each family
 */
export interface Family {
  familyName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentWeek: number;              // 1-52 for cycle tracking
  familyMembers: FamilyMember[];
}

// ============================================================================
// HABITS & CYCLES
// ============================================================================

/**
 * Habit
 *
 * CRITICAL: CycleId Format
 * - Document path: cycles/weekly/cycles/weekly_45
 * - Habit field: cycleId: "45" (JUST THE NUMBER)
 * - UI query: getHabits(familyId, '45')
 *
 * DO NOT use "weekly_45" - UI expects just the cycle number
 */
export interface Habit {
  userId: string;                   // Must match FamilyMember.userId
  userName: string;
  habitText: string;
  description: string;
  category: HabitCategory;

  // CycleId Format (CRITICAL)
  cycleId: string;                  // "45" (NOT "weekly_45")
  cycleType: CycleType;

  createdAt: Timestamp;
  completionCount: number;          // 0-5 (target is usually 5)
  targetFrequency: number;          // Usually 5
  eloRating: number;                // Starts at 1200, adapts based on effectiveness
  active: boolean;
  lastCompletedAt?: Timestamp;
}

/**
 * Cycle Progress Tracking
 * Tracks 3-step progression: Habits → Survey → Meeting
 */
export interface CycleStep {
  selected?: boolean;
  completed: boolean;
  completedAt?: Timestamp;
  scheduledDate?: Timestamp;        // For meeting step
}

/**
 * Cycle Document
 *
 * Document ID: "weekly_45" (includes cycle type prefix)
 * Query ID: "45" (just the number)
 */
export interface Cycle {
  cycleNumber: number;              // 45
  cycleType: CycleType;
  startDate: Timestamp;
  endDate: Timestamp;
  step: number;                     // 1=Habits, 2=Survey, 3=Meeting

  habits: CycleStep;
  survey: CycleStep;
  meeting: CycleStep;
}

// ============================================================================
// SURVEYS
// ============================================================================

/**
 * Survey Response (Individual Question)
 * Value: 0-10 scale
 * Text: Optional explanation
 */
export interface SurveyResponse {
  value: number;                    // 0-10 scale
  text?: string;                    // Optional explanation (max 500 chars)
}

/**
 * Survey Data
 * 72 questions per survey (24 Anticipation + 24 Monitoring + 24 Execution)
 * Auto-syncs to Neo4j Knowledge Graph
 */
export interface SurveyData {
  userId: string;
  userName: string;
  surveyType: CycleType;
  cycleNumber: number;
  startedAt: Timestamp;
  completedAt?: Timestamp;

  // Responses map: questionId -> response
  responses: {
    [questionId: string]: SurveyResponse;
  };

  // Calculated scores (0.0-1.0)
  anticipationScore?: number;       // Questions 1-24
  monitoringScore?: number;         // Questions 25-48
  executionScore?: number;          // Questions 49-72
  cognitiveLoad?: number;           // Weighted combination
}

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

/**
 * Event Reminder
 */
export interface EventReminder {
  minutes: number;                  // Minutes before event
  method: string;                   // "popup", "email", etc.
}

/**
 * Calendar Event
 *
 * CRITICAL: Security Requirement
 * Events MUST include userId field for security rules to work
 * Events without userId will fail Firestore queries
 *
 * Timestamp Duality:
 * - Store both Firestore Timestamp (for queries) and ISO string (for display)
 */
export interface CalendarEvent {
  // Security & Multi-Tenant (REQUIRED)
  familyId: string;                 // REQUIRED for multi-tenant queries
  userId: string;                   // REQUIRED for security rules + filtering

  // Core fields
  title: string;
  description?: string;

  // Timestamp Duality (BOTH formats required)
  startTime: Timestamp;             // Firestore Timestamp (for queries)
  endTime: Timestamp;
  startDate: string;                // ISO string (compatibility/display)
  endDate: string;

  allDay: boolean;
  location?: string;

  // Source tracking
  source: EventSource;
  googleEventId?: string;           // If source === "google"

  // Additional fields
  reminders?: EventReminder[];
  attendees?: string[];             // Array of family member names
  category?: string;                // "Medical", "School", "Sports", etc.

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// CONTACTS
// ============================================================================

/**
 * Contact
 * Family contact database (100 contacts in test data)
 */
export interface Contact {
  name: string;                     // "Dr. Sarah Johnson"
  category: ContactCategory;
  role: string;                     // "Pediatrician", "Teacher", "Coach", etc.
  phone: string;                    // E.164: +14155551234
  email: string;
  address?: string;

  notes?: string;
  favorite: boolean;

  createdAt: Timestamp;
}

// ============================================================================
// INBOX (EMAIL & SMS)
// ============================================================================

/**
 * Email Sender/Recipient
 */
export interface EmailContact {
  name: string;
  email: string;
}

/**
 * Email Attachment
 */
export interface EmailAttachment {
  filename: string;
  url: string;
  size: number;
}

/**
 * Email
 * Centralized email inbox
 */
export interface Email {
  from: EmailContact;
  to: string[];                     // Recipient emails
  subject: string;
  body: string;                     // Plain text
  htmlBody?: string;                // HTML version

  receivedAt: Timestamp;
  read: boolean;
  starred: boolean;
  archived: boolean;

  category?: string;                // Auto-categorized by AI
  priority?: Priority;

  attachments?: EmailAttachment[];

  // Allie AI processing
  processedByAllie?: boolean;
  allieExtractedTasks?: string[];
  allieExtractedEvents?: string[];
}

/**
 * SMS Message
 */
export interface SMS {
  from: string;                     // Phone number or contact name
  to: string;
  body: string;
  receivedAt: Timestamp;
  read: boolean;

  category?: string;
  priority?: Priority;

  processedByAllie?: boolean;
}

// ============================================================================
// TASKS
// ============================================================================

/**
 * Task
 * 443 tasks in test data across 1 year
 */
export interface Task {
  familyId: string;
  userId: string;                   // Creator
  title: string;
  description?: string;
  category?: string;

  status: 'todo' | 'in-progress' | 'done';
  priority?: Priority;

  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // Task assignment
  assignedTo?: string[];            // Array of userIds

  // Cognitive load tracking (for Knowledge Graph)
  cognitiveLoad?: number;           // 0.0-1.0
}

// ============================================================================
// CHORES (KIDS)
// ============================================================================

/**
 * Chore Instance
 * Kid-specific chore assignments with points/rewards
 */
export interface ChoreInstance {
  choreId: string;
  childId: string;
  childName: string;
  title: string;
  description?: string;

  dueDate: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;

  points: number;

  createdAt: Timestamp;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

/**
 * Document
 * Uploaded documents with OCR (25 documents in test data)
 */
export interface Document {
  familyId: string;
  userId: string;                   // Uploader

  filename: string;
  url: string;
  type: string;                     // "pdf", "image", "scan"
  size: number;

  // OCR processing
  ocrText?: string;
  ocrProcessed: boolean;

  category?: string;
  tags?: string[];

  uploadedAt: Timestamp;
}

// ============================================================================
// MESSAGES (ALLIE AI)
// ============================================================================

/**
 * Message
 * Allie AI conversation history (280+ interactions in test data)
 */
export interface Message {
  familyId: string;
  userId: string;

  role: 'user' | 'assistant' | 'system';
  content: string;

  timestamp: Timestamp;

  // Context tracking
  conversationId?: string;
  contextType?: string;             // "task", "event", "habit", "survey"
  contextId?: string;               // Related document ID

  // Audio (if voice message)
  audioUrl?: string;
  voiceModel?: string;              // "nova", "alloy", etc.
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation Result
 * Standard return type for all validation functions
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Age Range Validation
 */
export interface AgeRange {
  min: number;
  max: number;
}

export const AGE_RANGES: Record<Role, AgeRange> = {
  child: { min: 0, max: 17 },
  parent: { min: 18, max: 120 }
};

/**
 * Cycle Number Ranges
 */
export const CYCLE_RANGES: Record<CycleType, AgeRange> = {
  weekly: { min: 1, max: 52 },
  monthly: { min: 1, max: 12 }
};

/**
 * Survey Response Range
 */
export const SURVEY_RESPONSE_RANGE = { min: 0, max: 10 };

/**
 * Personality Trait Range
 */
export const PERSONALITY_TRAIT_RANGE = { min: 0.0, max: 1.0 };

/**
 * Mental Load Range
 */
export const MENTAL_LOAD_RANGE = { min: 0.0, max: 1.0 };
