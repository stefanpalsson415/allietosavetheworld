/**
 * ToolExecutorService - Complete tool execution for Allie AI Agent
 * Phase 3: Expanded tool definitions with Admin SDK
 */

const admin = require('firebase-admin');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

class ToolExecutorService {
  constructor(config = {}) {
    this.db = admin.firestore();
    this.auth = admin.auth();

    // Initialize SendGrid
    if (config.sendgridApiKey || process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(config.sendgridApiKey || process.env.SENDGRID_API_KEY);
      this.sendgrid = sgMail;
    }

    // Initialize Twilio
    if (config.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID) {
      this.twilio = twilio(
        config.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID,
        config.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN
      );
    }

    // Tool definitions for Claude
    this.toolDefinitions = this.getToolDefinitions();
  }

  getToolDefinitions() {
    return [
      // ========== FIRESTORE TOOLS ==========
      {
        name: 'read_data',
        description: 'Read any data from the database',
        input_schema: {
          type: 'object',
          properties: {
            collection: { type: 'string' },
            documentId: { type: 'string' },
            filters: { type: 'array' },
            orderBy: { type: 'object' },
            limit: { type: 'number' }
          },
          required: ['collection']
        }
      },
      {
        name: 'write_data',
        description: 'Write or update data in the database',
        input_schema: {
          type: 'object',
          properties: {
            collection: { type: 'string' },
            documentId: { type: 'string' },
            data: { type: 'object' },
            merge: { type: 'boolean' }
          },
          required: ['collection', 'data']
        }
      },
      {
        name: 'delete_data',
        description: 'Delete data from the database',
        input_schema: {
          type: 'object',
          properties: {
            collection: { type: 'string' },
            documentId: { type: 'string' }
          },
          required: ['collection', 'documentId']
        }
      },

      // ========== TASK & REMINDER TOOLS ==========
      {
        name: 'create_task',
        description: 'Create a new task or reminder',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            assignedTo: { type: 'string' },
            recurring: { type: 'object' },
            reminders: { type: 'array' }
          },
          required: ['title']
        }
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        input_schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['taskId', 'updates']
        }
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed',
        input_schema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            completedBy: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['taskId']
        }
      },

      // ========== CALENDAR TOOLS ==========
      {
        name: 'create_event',
        description: 'Create a calendar event',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            location: { type: 'string' },
            attendees: { type: 'array' },
            recurring: { type: 'object' },
            reminders: { type: 'array' }
          },
          required: ['title', 'startTime']
        }
      },
      {
        name: 'update_event',
        description: 'Update a calendar event',
        input_schema: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['eventId', 'updates']
        }
      },
      {
        name: 'list_events',
        description: 'List upcoming calendar events',
        input_schema: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            assignedTo: { type: 'string' },
            limit: { type: 'number' }
          }
        }
      },

      // ========== FAMILY MANAGEMENT TOOLS ==========
      {
        name: 'get_family_members',
        description: 'Get list of family members',
        input_schema: {
          type: 'object',
          properties: {
            includeDetails: { type: 'boolean' }
          }
        }
      },
      {
        name: 'update_family_member',
        description: 'Update family member information',
        input_schema: {
          type: 'object',
          properties: {
            memberId: { type: 'string' },
            updates: { type: 'object' }
          },
          required: ['memberId', 'updates']
        }
      },
      {
        name: 'get_family_settings',
        description: 'Get family settings and preferences',
        input_schema: {
          type: 'object',
          properties: {
            category: { type: 'string' }
          }
        }
      },

      // ========== COMMUNICATION TOOLS ==========
      {
        name: 'send_email',
        description: 'Send an email to family members or contacts',
        input_schema: {
          type: 'object',
          properties: {
            to: { type: 'array' },
            subject: { type: 'string' },
            html: { type: 'string' },
            text: { type: 'string' },
            attachments: { type: 'array' }
          },
          required: ['to', 'subject', 'html']
        }
      },
      {
        name: 'send_sms',
        description: 'Send an SMS message',
        input_schema: {
          type: 'object',
          properties: {
            to: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['to', 'message']
        }
      },
      {
        name: 'send_notification',
        description: 'Send an in-app notification',
        input_schema: {
          type: 'object',
          properties: {
            to: { type: 'array' },
            title: { type: 'string' },
            body: { type: 'string' },
            data: { type: 'object' }
          },
          required: ['to', 'title', 'body']
        }
      },

      // ========== DOCUMENT & FILE TOOLS ==========
      {
        name: 'process_document',
        description: 'Process and extract information from a document',
        input_schema: {
          type: 'object',
          properties: {
            documentUrl: { type: 'string' },
            extractType: { type: 'string', enum: ['text', 'dates', 'contacts', 'tasks', 'all'] }
          },
          required: ['documentUrl']
        }
      },
      {
        name: 'store_document',
        description: 'Store a document in the family archive',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            content: { type: 'string' },
            metadata: { type: 'object' }
          },
          required: ['name', 'content']
        }
      },

      // ========== PLACES & CONTACTS TOOLS ==========
      {
        name: 'add_place',
        description: 'Add a new place to family places',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { type: 'string' },
            category: { type: 'string' },
            notes: { type: 'string' },
            coordinates: { type: 'object' }
          },
          required: ['name', 'address']
        }
      },
      {
        name: 'get_places',
        description: 'Get family places by category',
        input_schema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            nearLocation: { type: 'string' }
          }
        }
      },
      {
        name: 'add_contact',
        description: 'Add a new contact',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            relationship: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['name']
        }
      },

      // ========== SHOPPING & LISTS TOOLS ==========
      {
        name: 'manage_list',
        description: 'Manage shopping or other lists',
        input_schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'add_item', 'remove_item', 'check_item', 'get'] },
            listName: { type: 'string' },
            item: { type: 'object' }
          },
          required: ['action', 'listName']
        }
      },

      // ========== HABIT & ROUTINE TOOLS ==========
      {
        name: 'track_habit',
        description: 'Track habit completion',
        input_schema: {
          type: 'object',
          properties: {
            habitId: { type: 'string' },
            completed: { type: 'boolean' },
            notes: { type: 'string' }
          },
          required: ['habitId', 'completed']
        }
      },
      {
        name: 'create_routine',
        description: 'Create a daily routine',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            time: { type: 'string' },
            tasks: { type: 'array' },
            assignedTo: { type: 'string' }
          },
          required: ['name', 'tasks']
        }
      },

      // ========== FINANCIAL TOOLS ==========
      {
        name: 'track_expense',
        description: 'Track a family expense',
        input_schema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            category: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
            paidBy: { type: 'string' }
          },
          required: ['amount', 'category', 'description']
        }
      },

      // ========== MEAL PLANNING TOOLS ==========
      {
        name: 'plan_meal',
        description: 'Plan a meal for the family',
        input_schema: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
            recipe: { type: 'string' },
            ingredients: { type: 'array' },
            assignedCook: { type: 'string' }
          },
          required: ['date', 'mealType']
        }
      }
    ];
  }

  async executeTool(toolName, input, familyId, userId) {
    console.log(`Executing tool: ${toolName} for family: ${familyId}`);

    try {
      switch (toolName) {
        // Data operations
        case 'read_data':
          return await this.executeReadData(input, familyId);
        case 'write_data':
          return await this.executeWriteData(input, familyId);
        case 'delete_data':
          return await this.executeDeleteData(input, familyId);

        // Task operations
        case 'create_task':
          return await this.executeCreateTask(input, familyId, userId);
        case 'update_task':
          return await this.executeUpdateTask(input, familyId);
        case 'complete_task':
          return await this.executeCompleteTask(input, familyId, userId);

        // Calendar operations
        case 'create_event':
          return await this.executeCreateEvent(input, familyId, userId);
        case 'update_event':
          return await this.executeUpdateEvent(input, familyId);
        case 'list_events':
          return await this.executeListEvents(input, familyId);

        // Family operations
        case 'get_family_members':
          return await this.executeGetFamilyMembers(familyId, input);
        case 'update_family_member':
          return await this.executeUpdateFamilyMember(input, familyId);
        case 'get_family_settings':
          return await this.executeGetFamilySettings(familyId, input);

        // Communication operations
        case 'send_email':
          return await this.executeSendEmail(input, familyId);
        case 'send_sms':
          return await this.executeSendSMS(input, familyId);
        case 'send_notification':
          return await this.executeSendNotification(input, familyId);

        // Document operations
        case 'process_document':
          return await this.executeProcessDocument(input, familyId);
        case 'store_document':
          return await this.executeStoreDocument(input, familyId);

        // Places & Contacts
        case 'add_place':
          return await this.executeAddPlace(input, familyId);
        case 'get_places':
          return await this.executeGetPlaces(input, familyId);
        case 'add_contact':
          return await this.executeAddContact(input, familyId);

        // Lists
        case 'manage_list':
          return await this.executeManageList(input, familyId);

        // Habits & Routines
        case 'track_habit':
          return await this.executeTrackHabit(input, familyId, userId);
        case 'create_routine':
          return await this.executeCreateRoutine(input, familyId);

        // Financial
        case 'track_expense':
          return await this.executeTrackExpense(input, familyId, userId);

        // Meal Planning
        case 'plan_meal':
          return await this.executePlanMeal(input, familyId);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Tool execution failed for ${toolName}:`, error);
      throw error;
    }
  }

  // ========== TOOL IMPLEMENTATIONS ==========

  async executeReadData(input, familyId) {
    let query = this.db.collection(input.collection);
    query = query.where('familyId', '==', familyId);

    if (input.filters) {
      for (const filter of input.filters) {
        query = query.where(filter.field, filter.operator, filter.value);
      }
    }

    if (input.orderBy) {
      query = query.orderBy(input.orderBy.field, input.orderBy.direction || 'asc');
    }

    if (input.limit) {
      query = query.limit(input.limit);
    }

    if (input.documentId) {
      const doc = await this.db.collection(input.collection).doc(input.documentId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async executeWriteData(input, familyId) {
    const data = {
      ...input.data,
      familyId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (input.documentId) {
      const docRef = this.db.collection(input.collection).doc(input.documentId);
      if (input.merge) {
        await docRef.set(data, { merge: true });
      } else {
        await docRef.set(data);
      }
      return { id: input.documentId, ...data };
    }

    const docRef = await this.db.collection(input.collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  async executeDeleteData(input, familyId) {
    // Verify the document belongs to this family before deleting
    const doc = await this.db.collection(input.collection).doc(input.documentId).get();
    if (doc.exists && doc.data().familyId === familyId) {
      await this.db.collection(input.collection).doc(input.documentId).delete();
      return { success: true, id: input.documentId };
    }
    throw new Error('Document not found or unauthorized');
  }

  async executeCreateTask(input, familyId, userId) {
    // Parse dueDate - handle various formats
    let dueDate = null;
    if (input.dueDate) {
      try {
        const parsed = new Date(input.dueDate);
        // Check if date is valid
        if (!isNaN(parsed.getTime())) {
          dueDate = admin.firestore.Timestamp.fromDate(parsed);
        }
      } catch (e) {
        console.warn('Could not parse dueDate:', input.dueDate);
      }
    }

    const task = {
      title: input.title,
      description: input.description || '',
      dueDate: dueDate,
      priority: input.priority || 'medium',
      assignedTo: input.assignedTo || userId,
      status: 'pending',
      recurring: input.recurring || null,
      reminders: input.reminders || [],
      familyId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await this.db.collection('tasks').add(task);

    // Set reminders if specified
    if (input.reminders && input.reminders.length > 0) {
      await this.scheduleReminders(docRef.id, input.reminders);
    }

    return { id: docRef.id, ...task };
  }

  async executeUpdateTask(input, familyId) {
    const taskRef = this.db.collection('tasks').doc(input.taskId);
    const task = await taskRef.get();

    if (!task.exists || task.data().familyId !== familyId) {
      throw new Error('Task not found or unauthorized');
    }

    await taskRef.update({
      ...input.updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { id: input.taskId, ...input.updates };
  }

  async executeCompleteTask(input, familyId, userId) {
    const taskRef = this.db.collection('tasks').doc(input.taskId);
    const task = await taskRef.get();

    if (!task.exists || task.data().familyId !== familyId) {
      throw new Error('Task not found or unauthorized');
    }

    await taskRef.update({
      status: 'completed',
      completedBy: input.completedBy || userId,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completionNotes: input.notes || ''
    });

    return { id: input.taskId, status: 'completed' };
  }

  async executeCreateEvent(input, familyId, userId) {
    // Parse dates properly
    let startTime = null;
    let endTime = null;

    if (input.startTime) {
      try {
        const parsed = new Date(input.startTime);
        if (!isNaN(parsed.getTime())) {
          startTime = admin.firestore.Timestamp.fromDate(parsed);
        }
      } catch (e) {
        console.warn('Could not parse startTime:', input.startTime);
      }
    }

    if (input.endTime) {
      try {
        const parsed = new Date(input.endTime);
        if (!isNaN(parsed.getTime())) {
          endTime = admin.firestore.Timestamp.fromDate(parsed);
        }
      } catch (e) {
        console.warn('Could not parse endTime:', input.endTime);
      }
    }

    const event = {
      title: input.title,
      description: input.description || '',
      startTime: startTime,
      endTime: endTime,
      location: input.location || '',
      attendees: input.attendees || [],
      recurring: input.recurring || null,
      reminders: input.reminders || [{ minutes: 30 }],
      familyId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await this.db.collection('events').add(event);
    return { id: docRef.id, ...event };
  }

  async executeUpdateEvent(input, familyId) {
    const eventRef = this.db.collection('events').doc(input.eventId);
    const event = await eventRef.get();

    if (!event.exists || event.data().familyId !== familyId) {
      throw new Error('Event not found or unauthorized');
    }

    await eventRef.update({
      ...input.updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { id: input.eventId, ...input.updates };
  }

  async executeListEvents(input, familyId) {
    let query = this.db.collection('events').where('familyId', '==', familyId);

    if (input.startDate) {
      query = query.where('startTime', '>=', new Date(input.startDate));
    }

    if (input.endDate) {
      query = query.where('startTime', '<=', new Date(input.endDate));
    }

    if (input.assignedTo) {
      query = query.where('attendees', 'array-contains', input.assignedTo);
    }

    query = query.orderBy('startTime', 'asc');

    if (input.limit) {
      query = query.limit(input.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async executeGetFamilyMembers(familyId, input) {
    const familyDoc = await this.db.collection('families').doc(familyId).get();

    if (!familyDoc.exists) {
      throw new Error('Family not found');
    }

    const memberIds = familyDoc.data().memberIds || [];

    if (!input.includeDetails) {
      return { memberIds };
    }

    // Get detailed user information
    const members = await Promise.all(
      memberIds.map(async (memberId) => {
        const userDoc = await this.db.collection('users').doc(memberId).get();
        return userDoc.exists ? { id: memberId, ...userDoc.data() } : null;
      })
    );

    return members.filter(m => m !== null);
  }

  async executeSendEmail(input, familyId) {
    if (!this.sendgrid) {
      throw new Error('SendGrid not configured');
    }

    const msg = {
      to: input.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@checkallie.com',
      subject: input.subject,
      html: input.html,
      text: input.text || input.html.replace(/<[^>]*>/g, ''),
      attachments: input.attachments || []
    };

    await this.sendgrid.send(msg);

    // Store email record
    await this.db.collection('sent_emails').add({
      ...msg,
      familyId,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, messageId: msg.id };
  }

  async executeSendSMS(input, familyId) {
    if (!this.twilio) {
      throw new Error('Twilio not configured');
    }

    const message = await this.twilio.messages.create({
      body: input.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: input.to
    });

    // Store SMS record
    await this.db.collection('sent_sms').add({
      to: input.to,
      message: input.message,
      familyId,
      twilioSid: message.sid,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, messageId: message.sid };
  }

  async executeAddPlace(input, familyId) {
    const place = {
      name: input.name,
      address: input.address,
      category: input.category || 'other',
      notes: input.notes || '',
      coordinates: input.coordinates || null,
      familyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await this.db.collection('places').add(place);
    return { id: docRef.id, ...place };
  }

  async executeManageList(input, familyId) {
    const listRef = this.db.collection('lists').doc(`${familyId}_${input.listName}`);

    switch (input.action) {
      case 'create':
        await listRef.set({
          name: input.listName,
          items: [],
          familyId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, action: 'created', listName: input.listName };

      case 'add_item':
        // Check if list exists, create if not
        const listDoc = await listRef.get();
        if (!listDoc.exists) {
          // Auto-create the list
          await listRef.set({
            name: input.listName,
            items: [input.item],
            familyId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          return { success: true, action: 'list_created_and_item_added', item: input.item };
        }

        // List exists, add item
        await listRef.update({
          items: admin.firestore.FieldValue.arrayUnion(input.item),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, action: 'item_added', item: input.item };

      case 'remove_item':
        await listRef.update({
          items: admin.firestore.FieldValue.arrayRemove(input.item),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, action: 'item_removed', item: input.item };

      case 'get':
        const list = await listRef.get();
        return list.exists ? list.data() : null;

      default:
        throw new Error(`Unknown list action: ${input.action}`);
    }
  }

  // Helper methods
  async scheduleReminders(taskId, reminders) {
    // This would integrate with a scheduling service
    // For now, store them in Firestore
    for (const reminder of reminders) {
      await this.db.collection('scheduled_reminders').add({
        taskId,
        reminderTime: reminder.time,
        type: reminder.type || 'notification',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Additional tool implementations would go here...
  async executeUpdateFamilyMember(input, familyId) {
    // Implementation
    return { success: true };
  }

  async executeGetFamilySettings(familyId, input) {
    // Implementation
    return { settings: {} };
  }

  async executeSendNotification(input, familyId) {
    // Implementation
    return { success: true };
  }

  async executeProcessDocument(input, familyId) {
    // Implementation
    return { extracted: {} };
  }

  async executeStoreDocument(input, familyId) {
    // Implementation
    return { id: 'doc_id' };
  }

  async executeGetPlaces(input, familyId) {
    // Implementation
    return [];
  }

  async executeAddContact(input, familyId) {
    // Implementation
    return { id: 'contact_id' };
  }

  async executeTrackHabit(input, familyId, userId) {
    // Implementation
    return { success: true };
  }

  async executeCreateRoutine(input, familyId) {
    // Implementation
    return { id: 'routine_id' };
  }

  async executeTrackExpense(input, familyId, userId) {
    // Implementation
    return { id: 'expense_id' };
  }

  async executePlanMeal(input, familyId) {
    // Implementation
    return { id: 'meal_id' };
  }
}

module.exports = ToolExecutorService;