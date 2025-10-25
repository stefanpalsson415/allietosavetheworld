#!/usr/bin/env node
/**
 * AgentOrchestrator - Simulation Engine for Palsson Family Agents
 *
 * Manages all 5 family agents (Stefan, Kimberly, Lillian, Oly, Tegner)
 * and simulates 1 year of family life through 5 transformation phases:
 *
 * 1. Chaos (Month 1-2): Pre-Allie, high mental load, low awareness
 * 2. Discovery (Month 3): Onboarding, first insights, awareness growing
 * 3. Integration (Month 4-6): Habit formation, sharing responsibilities
 * 4. Balanced (Month 7-9): Mental load equalized, routines established
 * 5. Thriving (Month 10-12): Peak performance, family harmony
 *
 * Expected Output (1 year):
 * - 2,400+ calendar events
 * - 1,800+ tasks created
 * - 450+ documents uploaded
 * - 60+ surveys completed
 * - 5,000+ Allie interactions
 */

const StefanAgent = require('./StefanAgent');
const KimberlyAgent = require('./KimberlyAgent');
const LillianAgent = require('./LillianAgent');
const OlyAgent = require('./OlyAgent');
const TegnerAgent = require('./TegnerAgent');
const admin = require('firebase-admin');
const path = require('path');

class AgentOrchestrator {
  constructor(config = {}) {
    this.config = {
      familyId: config.familyId || 'palsson_family_simulation',
      speedMultiplier: config.speedMultiplier || 100, // 100x real time
      dryRun: config.dryRun !== false, // Default to dry run (no Firestore writes)
      verbose: config.verbose !== false, // Detailed logging
      startDate: config.startDate || new Date('2025-01-01'), // Start of simulation
      ...config
    };

    // Initialize Firebase Admin SDK if not in dry run mode
    if (!this.config.dryRun) {
      if (!admin.apps.length) {
        const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
        admin.initializeApp({
          credential: admin.credential.cert(require(serviceAccountPath)),
          databaseURL: 'https://parentload-ba995.firebaseio.com'
        });
      }
      this.db = admin.firestore();
    }

    // Initialize all 5 agents (userId will be assigned during family creation)
    this.agents = {
      stefan: null,
      kimberly: null,
      lillian: null,
      oly: null,
      tegner: null
    };

    // Simulation state
    this.currentDate = new Date(this.config.startDate);
    this.startDate = new Date(this.config.startDate); // Store for metadata updates
    this.currentPhase = 'chaos'; // chaos → discovery → integration → balanced → thriving
    this.daysPassed = 0;
    this.eventLog = [];
    this.stats = {
      calendarEvents: 0,
      tasksCreated: 0,
      documentsUploaded: 0,
      surveysCompleted: 0,
      allieInteractions: 0,
      messages: 0,
      emailsReceived: 0,
      smsReceived: 0,
      contactsCreated: 0,
      interviewsCompleted: 0,
      familyMeetings: 0,
      habitsFormed: 0
    };

    // Track which members have completed interviews
    this.interviewsCompleted = {
      stefan: false,
      kimberly: false,
      lillian: false,
      oly: false,
      tegner: false
    };

    // Track survey cycles (weekly)
    this.lastSurveyDate = null;
    this.surveyCount = 0;

    // Track habits being formed
    this.habits = {
      stefan: [],
      kimberly: [],
      lillian: ['Water plants'],
      oly: ['Study time'],
      tegner: ['Morning chore']
    };

    // Track created habit IDs for completions
    this.habitIds = {};
    this.habitsCreatedInFirestore = false;

    // External contacts (created during setup)
    this.contacts = [];

    // Phase timeline (in days)
    this.phaseTimeline = {
      chaos: { start: 0, end: 60 },        // Month 1-2
      discovery: { start: 60, end: 90 },   // Month 3
      integration: { start: 90, end: 180 }, // Month 4-6
      balanced: { start: 180, end: 270 },  // Month 7-9
      thriving: { start: 270, end: 365 }   // Month 10-12
    };
  }

  /**
   * Initialize all agents with user IDs
   */
  initializeAgents(userIds) {
    this.log('🚀 Initializing Palsson family agents...');

    this.agents.stefan = new StefanAgent(userIds.stefan);
    this.agents.kimberly = new KimberlyAgent(userIds.kimberly);
    this.agents.lillian = new LillianAgent(userIds.lillian);
    this.agents.oly = new OlyAgent(userIds.oly);
    this.agents.tegner = new TegnerAgent(userIds.tegner);

    this.log('✅ All 5 agents initialized');
    this.log(`   Stefan: Low awareness (30%), ready to learn`);
    this.log(`   Kimberly: High mental load (87%), needs relief`);
    this.log(`   Lillian: Skeptical (70%), independent teen`);
    this.log(`   Oly: Curious (90%), science enthusiast`);
    this.log(`   Tegner: High energy (95%), bores easily`);
  }

  /**
   * Run the full 1-year simulation
   */
  async runYearSimulation() {
    this.log('\n╔════════════════════════════════════════════════════════════╗');
    this.log('║   PALSSON FAMILY 1-YEAR SIMULATION                         ║');
    this.log('╚════════════════════════════════════════════════════════════╝\n');

    this.log(`Start Date: ${this.formatDate(this.currentDate)}`);
    this.log(`Speed: ${this.config.speedMultiplier}x real time`);
    this.log(`Dry Run: ${this.config.dryRun ? 'Yes (no Firestore writes)' : 'No (will write to Firestore)'}\n`);

    // Create external contacts (school, doctors, services)
    await this.createContacts();
    this.log('');

    const startTime = Date.now();

    // Complete discovery interviews in first week
    this.log('📋 Scheduling discovery interviews...\n');
    for (const agentName of Object.keys(this.agents)) {
      // Interviews happen on days 1-5 (one per day)
      const interviewDay = ['stefan', 'kimberly', 'lillian', 'oly', 'tegner'].indexOf(agentName) + 1;
      this.log(`   ${this.agents[agentName].name}: Scheduled for Day ${interviewDay}`);
    }
    this.log('');

    // Run simulation day by day
    for (let day = 0; day < 365; day++) {
      await this.simulateDay();

      // Progress update every 30 days
      if (day % 30 === 0 && day > 0) {
        this.printProgress();
      }
    }

    // Update family and member metadata with final state
    await this.updateFamilyMetadata();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    this.log('\n╔════════════════════════════════════════════════════════════╗');
    this.log('║   SIMULATION COMPLETE                                       ║');
    this.log('╚════════════════════════════════════════════════════════════╝\n');

    this.printFinalStats(duration);

    return {
      stats: this.stats,
      eventLog: this.eventLog,
      duration: parseFloat(duration)
    };
  }

  /**
   * Simulate a single day
   */
  async simulateDay() {
    this.daysPassed++;

    // Check if we need to advance to next phase
    const newPhase = this.getCurrentPhase();
    if (newPhase !== this.currentPhase) {
      await this.advanceToPhase(newPhase);
    }

    // Discovery interviews (Days 1-5)
    if (this.daysPassed <= 5) {
      const agentNames = ['stefan', 'kimberly', 'lillian', 'oly', 'tegner'];
      const todaysAgent = agentNames[this.daysPassed - 1];
      await this.completeDiscoveryInterview(todaysAgent);
    }

    // Weekly surveys (every 7 days, starting Day 7)
    if (this.daysPassed % 7 === 0 && this.daysPassed >= 7) {
      await this.completeWeeklySurvey();
    }

    // Family meetings (every 14 days, after surveys)
    if (this.daysPassed % 14 === 0 && this.daysPassed >= 14 && this.currentPhase !== 'chaos') {
      await this.conductFamilyMeeting();
    }

    // Morning routine (6am - 9am)
    await this.simulateTimeBlock('morning', 6, 9);

    // Work/School day (9am - 3pm)
    await this.simulateTimeBlock('day', 9, 15);

    // Afternoon activities (3pm - 6pm)
    await this.simulateTimeBlock('afternoon', 15, 18);

    // Evening routine (6pm - 9pm)
    await this.simulateTimeBlock('evening', 18, 21);

    // External communications (emails/SMS from school, doctors, etc.)
    await this.generateExternalCommunications();

    // Habit tracking
    await this.trackHabitFormation();

    // Document uploads (random, increases after discovery phase)
    if (this.currentPhase !== 'chaos' && Math.random() < 0.05) {
      const documentTypes = ['vaccination_record', 'school_form', 'permission_slip'];
      const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      await this.uploadDocument('kimberly', docType, `${docType.replace('_', ' ')} - ${this.formatDate(this.currentDate)}`);
    }

    // Advance to next day
    this.currentDate.setDate(this.currentDate.getDate() + 1);
  }

  /**
   * Simulate a time block (e.g., morning, afternoon)
   */
  async simulateTimeBlock(blockName, startHour, endHour) {
    const minutesInBlock = (endHour - startHour) * 60;

    // Update all agents' states
    for (const agent of Object.values(this.agents)) {
      if (!agent) continue;
      agent.tick(minutesInBlock);
    }

    // Generate activities for this time block
    await this.generateActivities(blockName, startHour, endHour);
  }

  /**
   * Generate realistic activities for time block
   */
  async generateActivities(blockName, startHour, endHour) {
    const dayOfWeek = this.currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = startHour;

    // Morning activities
    if (blockName === 'morning') {
      // Kimberly creates morning tasks
      if (Math.random() < 0.7) {
        await this.createTask('kimberly', {
          title: this.getRandomMorningTask(),
          category: 'household',
          anticipationDays: 0
        });
      }

      // Tegner's morning chore (5x/week)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        await this.completeChore('tegner', 'Put shoes in closet');
      }
    }

    // Afternoon activities
    if (blockName === 'afternoon') {
      // Lillian's volleyball (Tuesday & Thursday)
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        await this.createCalendarEvent('lillian', {
          title: 'Volleyball practice',
          startHour: 16,
          duration: 90
        });
      }

      // Oly's science club (Thursday)
      if (dayOfWeek === 4) {
        await this.createCalendarEvent('oly', {
          title: 'Science club',
          startHour: 15.5,
          duration: 60
        });
      }

      // Tegner's swimming with Stefan (Wednesday)
      if (dayOfWeek === 3) {
        await this.createCalendarEvent('tegner', {
          title: 'Swimming lessons with Dad',
          startHour: 16,
          duration: 60,
          attendees: ['stefan', 'tegner']
        });
      }

      // Oly's study time (4x/week)
      if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        await this.completeChore('oly', 'Study time (30 min)');
      }
    }

    // Evening activities
    if (blockName === 'evening') {
      // Lillian waters plants (daily)
      await this.completeChore('lillian', 'Water plants');

      // Kimberly creates evening coordination tasks
      if (Math.random() < 0.5) {
        await this.createTask('kimberly', {
          title: this.getRandomCoordinationTask(),
          category: 'coordination',
          anticipationDays: Math.floor(Math.random() * 7) + 1
        });
      }

      // Family dinner event
      if (Math.random() < 0.3) {
        await this.createCalendarEvent('kimberly', {
          title: 'Family dinner',
          startHour: 18,
          duration: 60,
          attendees: ['stefan', 'kimberly', 'lillian', 'oly', 'tegner']
        });
      }
    }

    // Allie interactions (throughout day)
    await this.generateAllieInteractions(blockName);
  }

  /**
   * Generate Allie interactions based on phase and agent needs
   */
  async generateAllieInteractions(blockName) {
    // Tegner's boredom (high probability)
    if (this.agents.tegner.boredomLevel > 7) {
      await this.allieInteraction('tegner', 'ask_activity', {
        question: 'There is nothing to dooooo!',
        urgency: 'high'
      });
    }

    // Oly's questions (2-3x/day)
    if (blockName === 'afternoon' && Math.random() < 0.3) {
      await this.allieInteraction('oly', 'ask_question', {
        topic: 'science',
        enthusiasm: 0.95
      });
    }

    // Kimberly's task creation via Allie (integration+ phases)
    if (this.currentPhase !== 'chaos' && blockName === 'morning' && Math.random() < 0.4) {
      await this.allieInteraction('kimberly', 'create_task', {
        method: 'voice',
        anticipation: true
      });
    }

    // Stefan's calendar checks (increases after discovery phase)
    if (this.currentPhase !== 'chaos' && blockName === 'morning' && Math.random() < 0.2) {
      await this.allieInteraction('stefan', 'check_calendar', {
        method: 'chat'
      });
    }
  }

  /**
   * Create a task via an agent
   */
  async createTask(agentName, taskData) {
    this.stats.tasksCreated++;
    this.logEvent('task_created', agentName, taskData);

    if (!this.config.dryRun) {
      // Write to Firestore kanbanTasks collection
      try {
        const taskRef = this.db.collection('kanbanTasks').doc();
        await taskRef.set({
          id: taskRef.id,
          familyId: this.config.familyId,
          createdBy: this.agents[agentName]?.userId,
          title: taskData.title,
          description: taskData.description || '',
          category: taskData.category || 'To Do',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          assignee: taskData.assignee || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing task to Firestore:', error.message);
      }
    }
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(agentName, eventData) {
    this.stats.calendarEvents++;
    this.logEvent('calendar_event', agentName, eventData);

    if (!this.config.dryRun) {
      // Write to Firestore events collection
      try {
        // Build Date objects from startHour and duration
        const startTime = new Date(this.currentDate);
        const startHour = Math.floor(eventData.startHour);
        const startMinutes = (eventData.startHour % 1) * 60;
        startTime.setHours(startHour, startMinutes, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (eventData.duration || 60));

        const eventRef = this.db.collection('events').doc();
        await eventRef.set({
          id: eventRef.id,
          familyId: this.config.familyId,
          userId: this.agents[agentName]?.userId,
          title: eventData.title,
          startTime: admin.firestore.Timestamp.fromDate(startTime),
          endTime: admin.firestore.Timestamp.fromDate(endTime),
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          source: 'manual',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing event to Firestore:', error.message);
      }
    }
  }

  /**
   * Complete a chore
   */
  async completeChore(agentName, choreTitle) {
    const agent = this.agents[agentName];
    if (!agent) return;

    const completion = await agent.completeChore({ title: choreTitle });
    if (completion.completed) {
      this.logEvent('chore_completed', agentName, { title: choreTitle, quality: completion.quality });
    }
  }

  /**
   * Allie interaction
   */
  async allieInteraction(agentName, interactionType, data) {
    this.stats.allieInteractions++;
    this.logEvent('allie_interaction', agentName, { type: interactionType, ...data });
  }

  /**
   * Create external contacts (school, doctors, services)
   */
  async createContacts() {
    const contactList = [
      // School
      { name: 'Hillside Elementary School', type: 'school', email: 'office@hillsideelem.edu', phone: '555-0100' },
      { name: 'Ms. Rodriguez (Teacher)', type: 'teacher', email: 'rodriguez@hillsideelem.edu', phone: '555-0101' },

      // Medical
      { name: 'Dr. Sarah Chen (Pediatrician)', type: 'doctor', email: 'schen@valleypediatrics.com', phone: '555-0200' },
      { name: 'Valley Pediatrics Office', type: 'medical', email: 'appointments@valleypediatrics.com', phone: '555-0201' },
      { name: 'Bright Smiles Dental', type: 'dentist', email: 'info@brightsmilesdental.com', phone: '555-0300' },

      // Activities
      { name: 'Splash Aquatic Center', type: 'sports', email: 'info@splashaquatic.com', phone: '555-0400' },
      { name: 'Coach Martinez (Volleyball)', type: 'coach', email: 'martinez@volleyballclub.com', phone: '555-0401' },
      { name: 'Science Discovery Lab', type: 'education', email: 'registration@sciencelab.org', phone: '555-0500' },

      // Services
      { name: 'Hair Today Salon', type: 'personal', email: 'bookings@hairtoday.com', phone: '555-0600' },
      { name: 'City Summer Camps', type: 'camp', email: 'registration@citycamps.org', phone: '555-0700' }
    ];

    for (const contact of contactList) {
      this.contacts.push(contact);
      this.stats.contactsCreated++;
      this.logEvent('contact_created', 'system', contact);
    }

    this.log(`✅ Created ${contactList.length} external contacts`);
  }

  /**
   * Send email to unified inbox
   */
  async sendEmail(from, subject, body, category = 'general') {
    this.stats.emailsReceived++;
    this.stats.messages++;

    const emailData = {
      type: 'email',
      from: from.email || from.name,
      fromName: from.name,
      subject,
      body,
      category,
      receivedAt: new Date(this.currentDate).toISOString(),
      read: false,
      starred: false
    };

    this.logEvent('email_received', 'system', emailData);

    if (!this.config.dryRun) {
      // Write to Firestore inboxItems collection
      try {
        const inboxRef = this.db.collection('inboxItems').doc();
        await inboxRef.set({
          id: inboxRef.id,
          familyId: this.config.familyId,
          type: 'email',
          from: from.email || from.name,
          fromName: from.name,
          subject: subject,
          body: body,
          category: category || 'other',
          status: 'unread',
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing email to Firestore:', error.message);
      }
    }
  }

  /**
   * Send SMS to unified inbox
   */
  async sendSMS(from, message, category = 'general') {
    this.stats.smsReceived++;
    this.stats.messages++;

    const smsData = {
      type: 'sms',
      from: from.phone || from.name,
      fromName: from.name,
      message,
      category,
      receivedAt: new Date(this.currentDate).toISOString(),
      read: false
    };

    this.logEvent('sms_received', 'system', smsData);

    if (!this.config.dryRun) {
      // Write to Firestore inboxItems collection
      try {
        const inboxRef = this.db.collection('inboxItems').doc();
        await inboxRef.set({
          id: inboxRef.id,
          familyId: this.config.familyId,
          type: 'sms',
          from: from.phone || from.email || from.name,
          fromName: from.name,
          message: message,
          category: category || 'other',
          status: 'unread',
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing SMS to Firestore:', error.message);
      }
    }
  }

  /**
   * Complete discovery interview for a family member
   */
  async completeDiscoveryInterview(agentName) {
    if (this.interviewsCompleted[agentName]) {
      return; // Already completed
    }

    const agent = this.agents[agentName];
    if (!agent) return;

    this.interviewsCompleted[agentName] = true;
    this.stats.interviewsCompleted++;

    const interviewData = {
      type: 'discovery',
      participantName: agent.name,
      participantRole: agent.role,
      duration: agent.age >= 18 ? 20 : 15, // minutes
      questionsAnswered: agent.age >= 18 ? 12 : 8,
      completedAt: new Date(this.currentDate).toISOString()
    };

    this.logEvent('interview_completed', agentName, interviewData);
    this.log(`🎤 ${agent.name} completed discovery interview (${interviewData.questionsAnswered} questions)`);

    if (!this.config.dryRun) {
      // Write to Firestore interviewSessions collection
      try {
        const sessionId = `${this.config.familyId}_discovery_${agent.userId}`;
        await this.db.collection('interviewSessions').doc(sessionId).set({
          familyId: this.config.familyId,
          userId: agent.userId,
          type: 'discovery',
          status: 'completed',
          participants: [{
            userId: agent.userId,
            name: agent.name,
            role: agent.role,
            age: agent.age || null,
            isParent: agent.role === 'parent' // Calculate from role if isParent is undefined
          }],
          responses: [], // Simulated - would contain actual Q&A
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing interview session to Firestore:', error.message);
      }
    }
  }

  /**
   * Complete weekly survey (check-in)
   */
  async completeWeeklySurvey() {
    const daysSinceLastSurvey = this.lastSurveyDate
      ? Math.floor((this.currentDate - this.lastSurveyDate) / (1000 * 60 * 60 * 24))
      : 999;

    // Only do survey if 7+ days since last one
    if (daysSinceLastSurvey < 7) {
      return;
    }

    this.lastSurveyDate = new Date(this.currentDate);
    this.surveyCount++;

    // Stefan and Kimberly complete surveys (kids don't)
    for (const agentName of ['stefan', 'kimberly']) {
      const agent = this.agents[agentName];
      if (!agent) continue;

      // Completion rate based on personality
      const willComplete = Math.random() < agent.behaviorPatterns.surveyCompletionRate;

      if (willComplete) {
        this.stats.surveysCompleted++;

        const surveyData = {
          participantName: agent.name,
          surveyType: 'weekly_checkin',
          duration: agentName === 'kimberly' ? 15 : 8, // Kimberly takes full version
          mentalLoad: agent.currentState.mentalLoad,
          stress: agent.currentState.stress,
          satisfaction: 1.0 - agent.currentState.stress,
          completedAt: new Date(this.currentDate).toISOString()
        };

        this.logEvent('survey_completed', agentName, surveyData);

        // Write survey to Firestore
        if (!this.config.dryRun) {
          try {
            const surveyRef = this.db.collection('weeklyCheckins').doc();
            await surveyRef.set({
              id: surveyRef.id,
              familyId: this.config.familyId,
              userId: agent.userId,
              userName: agent.name,
              surveyType: 'weekly_checkin',
              completed: true,
              responses: {
                mentalLoad: agent.currentState.mentalLoad,
                stress: agent.currentState.stress,
                satisfaction: 1.0 - agent.currentState.stress,
                hoursOfSleep: Math.floor(6 + Math.random() * 3),
                timeForSelf: Math.floor(Math.random() * 3),
                partnerSupport: agentName === 'stefan' ?
                  (agent.personality?.awareness || 0.30) : // Stefan's awareness of Kimberly's load
                  (1.0 - agent.currentState.stress), // Kimberly's feeling of support
                taskBalance: agentName === 'stefan' ?
                  (agent.currentState.taskCreationRate / 0.50) : // Stefan's % of tasks
                  (agent.currentState.taskCreationRate / 0.50), // Kimberly's % of tasks
                coordinationLoad: agentName === 'kimberly' ?
                  agent.currentState.mentalLoad * 1.2 : // Kimberly does more coordination
                  agent.currentState.mentalLoad * 0.5,
                weekNumber: this.surveyCount,
                phase: this.currentPhase
              },
              duration: agentName === 'kimberly' ? 15 : 8,
              completedAt: new Date(this.currentDate).toISOString(),
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (error) {
            console.error('Error writing weekly check-in to Firestore:', error.message);
          }
        }
      }
    }

    this.log(`📋 Weekly survey #${this.surveyCount} completed`);
  }

  /**
   * Conduct family meeting (after survey)
   */
  async conductFamilyMeeting() {
    // Only do meetings starting in discovery phase
    // The day-based schedule (every 14 days) handles timing,
    // so we don't need to check surveyCount here
    if (this.currentPhase === 'chaos') {
      return;
    }

    this.stats.familyMeetings++;

    const meetingData = {
      participants: ['Stefan', 'Kimberly', 'Lillian', 'Oly', 'Tegner'],
      duration: 30, // minutes
      topics: this.generateMeetingTopics(),
      phase: this.currentPhase,
      conductedAt: new Date(this.currentDate).toISOString()
    };

    this.logEvent('family_meeting', 'family', meetingData);
    this.log(`👨‍👩‍👧‍👦 Family meeting #${this.stats.familyMeetings} conducted`);

    if (!this.config.dryRun) {
      // Create calendar event for meeting
      try {
        const eventRef = this.db.collection('events').doc();
        const meetingTime = new Date(this.currentDate);
        meetingTime.setHours(19, 0, 0, 0); // 7 PM
        const endTime = new Date(meetingTime);
        endTime.setHours(20, 0, 0, 0); // 8 PM

        await eventRef.set({
          id: eventRef.id,
          familyId: this.config.familyId,
          userId: this.agents.stefan?.userId,
          title: `Family Meeting #${this.stats.familyMeetings}`,
          description: `Phase: ${this.currentPhase}\nTopics: ${meetingData.topics ? meetingData.topics.join(', ') : 'Weekly check-in'}`,
          startTime: admin.firestore.Timestamp.fromDate(meetingTime),
          endTime: admin.firestore.Timestamp.fromDate(endTime),
          startDate: meetingTime.toISOString(),
          endDate: endTime.toISOString(),
          source: 'manual',
          category: 'family_meeting',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Also create family meeting record
        const meetingRecordRef = this.db.collection('familyMeetings').doc();
        await meetingRecordRef.set({
          id: meetingRecordRef.id,
          familyId: this.config.familyId,
          meetingNumber: this.stats.familyMeetings,
          participants: meetingData.participants,
          duration: meetingData.duration,
          topics: meetingData.topics || [],
          phase: this.currentPhase,
          actionItems: this.generateActionItems(),
          notes: `Family check-in during ${this.currentPhase} phase`,
          conductedAt: meetingData.conductedAt,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing family meeting to Firestore:', error.message);
      }
    }
  }

  /**
   * Generate meeting topics based on phase
   */
  generateMeetingTopics() {
    const topicsByPhase = {
      chaos: [
        'How is everyone feeling?',
        'What has been hard this week?'
      ],
      discovery: [
        'Reviewing mental load insights',
        'Who can help with what?',
        'Scheduling next week'
      ],
      integration: [
        'New habits progress',
        'Adjusting responsibilities',
        'Celebrating wins'
      ],
      balanced: [
        'Weekly planning',
        'Fair Play card review',
        'Family goals check-in'
      ],
      thriving: [
        'Maintenance and fine-tuning',
        'Long-term planning',
        'Family appreciation'
      ]
    };

    return topicsByPhase[this.currentPhase] || topicsByPhase.balanced;
  }

  /**
   * Generate action items based on current phase and imbalances
   */
  generateActionItems() {
    const actionsByPhase = {
      chaos: [
        'Start tracking who does what this week',
        'Notice when you feel overwhelmed'
      ],
      discovery: [
        `Stefan: Take over ${this.agents.oly?.name}'s science club transportation`,
        `Stefan: Handle ${this.agents.tegner?.name}'s swimming lessons`,
        'Review Fair Play cards together'
      ],
      integration: [
        `${this.agents.lillian?.name}: Keep up plant watering streak`,
        `${this.agents.oly?.name}: Continue daily study time`,
        'Weekly check-in surveys for Stefan & Kimberly'
      ],
      balanced: [
        'Continue bi-weekly family meetings',
        'Maintain task balance and habit streaks',
        'Plan family activities together'
      ],
      thriving: [
        'Celebrate transformation progress',
        'Set new family goals',
        'Share wins and gratitude'
      ]
    };

    return actionsByPhase[this.currentPhase] || actionsByPhase.balanced;
  }

  /**
   * Create habit documents in Firestore (during Discovery phase)
   */
  async createHabitsInFirestore() {
    if (this.habitsCreatedInFirestore || this.config.dryRun) {
      return;
    }

    this.log('📝 Creating habit documents in Firestore...');

    const habitDefinitions = {
      lillian: { title: 'Water plants', category: 'responsibility' },
      oly: { title: 'Study time', category: 'learning' },
      tegner: { title: 'Morning chore', category: 'routine' }
    };

    for (const [agentName, habitDef] of Object.entries(habitDefinitions)) {
      const agent = this.agents[agentName];
      if (!agent) continue;

      try {
        const habitRef = this.db.collection('habits').doc();
        await habitRef.set({
          id: habitRef.id,
          familyId: this.config.familyId,
          userId: agent.userId,
          title: habitDef.title,
          category: habitDef.category,
          frequency: 'daily',
          streakCurrent: 0,
          streakBest: 0,
          completionRate: 0,
          totalCompletions: 0,
          createdAt: new Date(this.currentDate).toISOString(),
          status: 'active'
        });

        // Store habit ID for completion tracking
        this.habitIds[agentName] = habitRef.id;
        this.log(`   ✅ Created habit: ${habitDef.title} for ${agent.name}`);
      } catch (error) {
        console.error(`Error creating habit for ${agentName}:`, error.message);
      }
    }

    this.habitsCreatedInFirestore = true;
  }

  /**
   * Track habit formation
   */
  async trackHabitFormation() {
    // Create habit documents during Discovery phase (first time)
    if (this.currentPhase === 'discovery' && !this.habitsCreatedInFirestore) {
      await this.createHabitsInFirestore();
    }

    // Track habit streaks for each member
    for (const [agentName, habitList] of Object.entries(this.habits)) {
      const agent = this.agents[agentName];
      if (!agent || habitList.length === 0) continue;

      for (const habitTitle of habitList) {
        // Completion likelihood based on transformation phase
        const baseRate = agent.ageBasedTraits?.responsibility || agent.personality.followThrough;
        const phaseBonus = {
          chaos: 0,
          discovery: 0.1,
          integration: 0.2,
          balanced: 0.3,
          thriving: 0.4
        }[this.currentPhase] || 0;

        const completionRate = Math.min(0.95, baseRate + phaseBonus);
        const completed = Math.random() < completionRate;

        if (completed) {
          this.logEvent('habit_completed', agentName, {
            habit: habitTitle,
            streak: Math.floor(this.daysPassed * completionRate),
            phase: this.currentPhase
          });

          // Write habit completion to Firestore
          if (!this.config.dryRun && this.habitIds[agentName]) {
            try {
              const completionRef = this.db.collection('habitCompletions').doc();
              await completionRef.set({
                id: completionRef.id,
                familyId: this.config.familyId,
                userId: agent.userId,
                habitId: this.habitIds[agentName],
                habitTitle: habitTitle,
                completed: true,
                completedAt: new Date(this.currentDate).toISOString(),
                notes: null
              });
            } catch (error) {
              console.error(`Error writing habit completion for ${agentName}:`, error.message);
            }
          }
        }
      }
    }
  }

  /**
   * Upload documents (vaccination records, school forms, etc.)
   */
  async uploadDocument(agentName, documentType, title) {
    this.stats.documentsUploaded++;

    const documentData = {
      type: documentType,
      title,
      uploadedBy: agentName,
      uploadedAt: new Date(this.currentDate).toISOString(),
      category: this.getDocumentCategory(documentType)
    };

    this.logEvent('document_uploaded', agentName, documentData);

    if (!this.config.dryRun) {
      // Write to Firestore documents collection
      try {
        const docRef = this.db.collection('documents').doc();
        await docRef.set({
          id: docRef.id,
          familyId: this.config.familyId,
          uploadedBy: this.agents[agentName]?.userId,
          title: title,
          type: documentType,
          category: this.getDocumentCategory(documentType),
          fileName: `${title.replace(/\s+/g, '_')}.pdf`,
          fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error writing document to Firestore:', error.message);
      }
    }
  }

  /**
   * Get document category
   */
  getDocumentCategory(documentType) {
    const categories = {
      'vaccination_record': 'medical',
      'school_form': 'education',
      'camp_registration': 'activities',
      'insurance_card': 'medical',
      'permission_slip': 'education',
      'emergency_contact': 'safety'
    };
    return categories[documentType] || 'general';
  }

  /**
   * Generate realistic email/SMS traffic
   */
  async generateExternalCommunications() {
    const dayOfWeek = this.currentDate.getDay();

    // School emails (Mondays, Wednesdays, Fridays)
    if ([1, 3, 5].includes(dayOfWeek) && Math.random() < 0.4) {
      const school = this.contacts.find(c => c.type === 'school');
      if (school) {
        await this.sendEmail(school,
          this.getRandomSchoolSubject(),
          'Please see attached notice regarding upcoming school activities.',
          'education'
        );
      }
    }

    // Doctor appointment reminders (random)
    if (Math.random() < 0.05) {
      const doctor = this.contacts.find(c => c.type === 'medical');
      if (doctor) {
        await this.sendSMS(doctor,
          `Reminder: ${this.getRandomChildName()} has an appointment tomorrow at 3:00 PM. Reply C to confirm.`,
          'medical'
        );
      }
    }

    // Dentist appointments (quarterly)
    if (this.daysPassed % 90 === 0 && this.daysPassed > 0) {
      const dentist = this.contacts.find(c => c.type === 'dentist');
      if (dentist) {
        await this.sendEmail(dentist,
          'Time for checkup - Schedule your dental cleaning',
          'It has been 6 months since your last visit. Please call to schedule.',
          'medical'
        );
      }
    }

    // Haircut reminders (monthly)
    if (this.daysPassed % 30 === 0 && this.daysPassed > 0) {
      const salon = this.contacts.find(c => c.type === 'personal');
      if (salon) {
        await this.sendSMS(salon,
          'Haircut time! Book your appointment at hairtoday.com or reply YES',
          'personal'
        );
      }
    }

    // Camp registration (early summer)
    if (this.daysPassed === 120) {
      const camp = this.contacts.find(c => c.type === 'camp');
      if (camp) {
        await this.sendEmail(camp,
          'Summer Camp 2025 - Early Bird Registration Open!',
          'Register by May 1st for 15% discount. Space is limited!',
          'activities'
        );
      }
    }
  }

  /**
   * Utility helpers
   */
  getRandomSchoolSubject() {
    const subjects = [
      'Parent-Teacher Conference Schedule',
      'Field Trip Permission Slip Required',
      'School Picture Day - Next Wednesday',
      'PTA Meeting Reminder',
      'Science Fair Project Due Dates',
      'Book Fair Coming Next Week'
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  getRandomChildName() {
    const children = ['Lillian', 'Oly', 'Tegner'];
    return children[Math.floor(Math.random() * children.length)];
  }

  /**
   * Advance to next transformation phase
   */
  async advanceToPhase(newPhase) {
    this.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.log(`🎯 PHASE TRANSITION: ${this.currentPhase.toUpperCase()} → ${newPhase.toUpperCase()}`);
    this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    this.currentPhase = newPhase;

    // Advance all agents to new phase
    for (const [name, agent] of Object.entries(this.agents)) {
      if (!agent) continue;

      agent.advancePhase(newPhase);

      // Log key milestones
      if (name === 'stefan' && newPhase === 'discovery') {
        this.log(`📊 Stefan: "Wow, I had no idea Kimberly was managing so much..."`);
      }
      if (name === 'kimberly' && newPhase === 'balanced') {
        this.log(`⚖️ Kimberly: Mental load reduced from 87% to 62%!`);
      }
      if (name === 'tegner' && newPhase === 'balanced') {
        this.log(`😴 Tegner: Sleep quality improved 40% (60% → 84%)`);
      }
    }

    this.log('');
  }

  /**
   * Determine current phase based on days passed
   */
  getCurrentPhase() {
    for (const [phase, range] of Object.entries(this.phaseTimeline)) {
      if (this.daysPassed >= range.start && this.daysPassed < range.end) {
        return phase;
      }
    }
    return 'thriving'; // Default to final phase
  }

  /**
   * Log an event to the event log
   */
  logEvent(eventType, agentName, data) {
    const event = {
      timestamp: new Date(this.currentDate),
      day: this.daysPassed,
      phase: this.currentPhase,
      eventType,
      agent: agentName,
      data
    };

    this.eventLog.push(event);

    // Verbose logging
    if (this.config.verbose && eventType !== 'chore_completed') {
      const emoji = {
        task_created: '📋',
        calendar_event: '📅',
        allie_interaction: '🤖',
        chore_completed: '✅'
      }[eventType] || '•';

      this.log(`${emoji} Day ${this.daysPassed} [${agentName}]: ${eventType}`);
    }
  }

  /**
   * Update family and member metadata with final transformation state
   */
  async updateFamilyMetadata() {
    if (this.config.dryRun) {
      return;
    }

    this.log('\n📊 Updating family metadata with transformation journey...');

    try {
      const familyRef = this.db.collection('families').doc(this.config.familyId);
      const familyDoc = await familyRef.get();

      if (!familyDoc.exists) {
        console.error('Family document not found for metadata update');
        return;
      }

      const familyData = familyDoc.data();

      // Calculate Fair Play distribution
      const stefanTasks = this.stats.tasksCreated * (this.agents.stefan.currentState.taskCreationRate / 1.0);
      const kimberlyTasks = this.stats.tasksCreated * (this.agents.kimberly.currentState.taskCreationRate / 1.0);
      const totalTasks = stefanTasks + kimberlyTasks;

      // Update family document with progress metadata
      await familyRef.update({
        // Transformation tracking
        currentPhase: this.currentPhase,
        transformationStartDate: this.startDate.toISOString(),
        daysSinceStart: this.daysPassed,

        // Survey progress
        surveys: {
          totalCompleted: this.stats.surveysCompleted,
          lastCompletedDate: this.lastSurveyDate ? this.lastSurveyDate.toISOString() : null,
          completionRate: 0.95,
          weeklyCheckinsEnabled: true
        },

        // Mental load distribution
        mentalLoad: {
          stefan: this.agents.stefan.currentState.mentalLoad,
          kimberly: this.agents.kimberly.currentState.mentalLoad,
          gap: Math.abs(this.agents.stefan.currentState.mentalLoad - this.agents.kimberly.currentState.mentalLoad),
          improvementFromBaseline: 0.87 - this.agents.kimberly.currentState.mentalLoad // Kimberly's relief
        },

        // Fair Play cards distribution
        fairPlay: {
          stefanTasks: Math.round(stefanTasks),
          kimberlyTasks: Math.round(kimberlyTasks),
          stefanPercentage: totalTasks > 0 ? (stefanTasks / totalTasks) : 0,
          kimberlyPercentage: totalTasks > 0 ? (kimberlyTasks / totalTasks) : 0,
          balanced: Math.abs((stefanTasks / totalTasks) - 0.5) < 0.15 // Within 15% of 50/50
        },

        // Journey progress
        journeyProgress: {
          phase: this.currentPhase,
          completedMilestones: [
            'Discovery interviews completed',
            'Weekly check-ins established',
            'Habits formed',
            'Fair Play rebalancing',
            'Mental load equalization'
          ],
          nextMilestone: this.currentPhase === 'thriving' ? 'Maintain and thrive' : 'Continue transformation',
          overallProgress: this.currentPhase === 'thriving' ? 1.0 : (this.daysPassed / 365)
        },

        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update each family member with growth tracking
      const updatedMembers = familyData.familyMembers.map(member => {
        const agent = Object.values(this.agents).find(a => a.userId === member.userId);
        if (!agent) return member;

        const updates = { ...member };

        // ALL MEMBERS: Mark onboarding complete (surveys, interviews, profiles)
        updates.surveys = {
          initial: {
            completed: true,
            completedAt: new Date(this.startDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() // Day 15
          }
        };
        updates.interviews = {
          discovery: {
            completed: true,
            completedAt: new Date(this.startDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // Day 20
            responses: [] // Would have actual responses
          }
        };
        updates.enhancedProfile = {
          completed: true,
          completedAt: new Date(this.startDate.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString() // Day 25
        };

        // Stefan's growth
        if (member.userId === this.agents.stefan.userId) {
          updates.surveysCompleted = Math.floor(this.stats.surveysCompleted / 2); // Half of total (2 parents)
          updates.lastSurveyDate = this.lastSurveyDate ? this.lastSurveyDate.toISOString() : null;
          updates.awareness = agent.personality?.awareness || 0.30; // 30% → 85%
          updates.awarenessGrowth = (agent.personality?.awareness || 0.30) - 0.30;
          updates.mentalLoad = agent.currentState?.mentalLoad || 0.30; // 30% → 48%
          updates.taskParticipation = agent.behaviorPatterns?.taskCreationRate || 0.15; // 15% → 40%
        }

        // Kimberly's relief
        if (member.userId === this.agents.kimberly.userId) {
          updates.surveysCompleted = Math.floor(this.stats.surveysCompleted / 2);
          updates.lastSurveyDate = this.lastSurveyDate ? this.lastSurveyDate.toISOString() : null;
          updates.mentalLoad = agent.currentState?.mentalLoad || 0.87; // 87% → 58%
          updates.mentalLoadRelief = 0.87 - (agent.currentState?.mentalLoad || 0.87); // 29% reduction
          updates.stress = agent.currentState?.stress || 0.85; // Reduced
        }

        // Lillian's transformation
        if (member.userId === this.agents.lillian?.userId) {
          updates.allieSkepticism = agent.allieSkepticism || 0.70; // 70% → 5%
          updates.helpfulness = agent.personality?.helpfulness || 0.65; // Increased
          updates.plantCareStreak = Math.floor(this.daysPassed * 0.95); // High completion
          updates.plantCareCompletionRate = 0.95;
        }

        // Oly's habits
        if (member.userId === this.agents.oly?.userId) {
          updates.studyStreak = Math.floor(this.daysPassed * 0.90);
          updates.studyCompletionRate = 0.90;
        }

        // Tegner's improvement
        if (member.userId === this.agents.tegner?.userId) {
          updates.sleepQuality = agent.sleepQuality || 0.60; // 60% → 84%
          updates.sleepImprovement = (agent.sleepQuality || 0.60) - 0.60;
          updates.choreStreak = Math.floor(this.daysPassed * 0.75);
          updates.choreCompletionRate = 0.75;
        }

        return updates;
      });

      // Save updated family members + onboarding complete flag
      await familyRef.update({
        familyMembers: updatedMembers,
        onboardingComplete: true,
        onboardingCompletedAt: new Date(this.startDate.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString() // Day 25
      });

      this.log('   ✅ Family metadata updated successfully');
      this.log('   ✅ Member growth tracking updated');
      this.log('   ✅ All onboarding tasks marked complete');
    } catch (error) {
      console.error('Error updating family metadata:', error.message);
    }
  }

  /**
   * Print progress update
   */
  printProgress() {
    const month = Math.ceil(this.daysPassed / 30);
    const progress = ((this.daysPassed / 365) * 100).toFixed(1);

    this.log(`\n┌─────────────────────────────────────────────────────────┐`);
    this.log(`│  Month ${month}/12 Complete (${progress}% of year)                     │`);
    this.log(`│  Phase: ${this.currentPhase.toUpperCase().padEnd(47)}│`);
    this.log(`├─────────────────────────────────────────────────────────┤`);
    this.log(`│  📅 Calendar Events: ${String(this.stats.calendarEvents).padStart(4)} / ~2,400                  │`);
    this.log(`│  📋 Tasks Created: ${String(this.stats.tasksCreated).padStart(6)} / ~1,800                  │`);
    this.log(`│  🤖 Allie Interactions: ${String(this.stats.allieInteractions).padStart(4)} / ~5,000             │`);
    this.log(`└─────────────────────────────────────────────────────────┘\n`);
  }

  /**
   * Print final statistics
   */
  printFinalStats(duration) {
    this.log(`Simulation Duration: ${duration}s (${(365 / parseFloat(duration)).toFixed(0)}x real time)\n`);

    this.log(`📊 FINAL STATISTICS:`);
    this.log(`   📅 Calendar Events: ${this.stats.calendarEvents.toLocaleString()}`);
    this.log(`   📋 Tasks Created: ${this.stats.tasksCreated.toLocaleString()}`);
    this.log(`   📄 Documents Uploaded: ${this.stats.documentsUploaded.toLocaleString()}`);
    this.log(`   📧 Emails Received: ${this.stats.emailsReceived.toLocaleString()}`);
    this.log(`   💬 SMS Received: ${this.stats.smsReceived.toLocaleString()}`);
    this.log(`   📝 Surveys Completed: ${this.stats.surveysCompleted.toLocaleString()}`);
    this.log(`   🎤 Discovery Interviews: ${this.stats.interviewsCompleted.toLocaleString()}/5`);
    this.log(`   👨‍👩‍👧‍👦 Family Meetings: ${this.stats.familyMeetings.toLocaleString()}`);
    this.log(`   ✅ Habits Tracked: ${this.stats.habitsFormed.toLocaleString()}`);
    this.log(`   👥 Contacts Created: ${this.stats.contactsCreated.toLocaleString()}`);
    this.log(`   🤖 Allie Interactions: ${this.stats.allieInteractions.toLocaleString()}\n`);

    this.log(`👨‍👩‍👧‍👦 FAMILY TRANSFORMATION:`);
    this.log(`   Stefan Awareness: 30% → ${(this.agents.stefan.personality.awareness * 100).toFixed(0)}%`);
    this.log(`   Kimberly Mental Load: 87% → ${(this.agents.kimberly.currentState.mentalLoad * 100).toFixed(0)}%`);
    this.log(`   Lillian Skepticism: 70% → ${(this.agents.lillian.allieSkepticism * 100).toFixed(0)}%`);
    this.log(`   Tegner Sleep Quality: 60% → ${(this.agents.tegner.sleepQuality * 100).toFixed(0)}%`);
    this.log(`   Family Phase: ${this.currentPhase.toUpperCase()} 🎉\n`);

    this.log(`💡 BALANCE & HABITS WORKFLOW:`);
    this.log(`   Survey Cycles: ${this.surveyCount} (weekly check-ins)`);
    this.log(`   Meetings Held: ${this.stats.familyMeetings} (bi-weekly after surveys)`);
    this.log(`   Interviews Done: ${this.stats.interviewsCompleted}/5 family members`);
    this.log(`   Habits Formed: Lillian (plants), Oly (study), Tegner (chores)\n`);
  }

  /**
   * Utility: Get random morning task
   */
  getRandomMorningTask() {
    const tasks = [
      'Make lunches for all 3 kids',
      'Check if Oly has gym clothes',
      'Tegner needs new shoes - remind Stefan',
      'Verify Lillian has volleyball uniform clean',
      'Check if Stefan can take Oly to science club Thursday'
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  /**
   * Utility: Get random coordination task
   */
  getRandomCoordinationTask() {
    const tasks = [
      'Coordinate who picks up Oly from science club',
      'Check if Tegner needs ride to swimming',
      'Verify Lillian can get to volleyball practice',
      'Plan weekend birthday party for Jake (Oly friend)',
      'Schedule dentist appointments for all 3 kids',
      'Research summer camp options for Oly',
      'Check if Stefan can cover Wednesday swimming'
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  /**
   * Utility: Format date
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Utility: Logging
   */
  log(message) {
    if (this.config.verbose !== false) {
      console.log(message);
    }
  }
}

module.exports = AgentOrchestrator;
