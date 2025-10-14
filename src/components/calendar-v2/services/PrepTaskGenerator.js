// Smart prep task generation for calendar events
import { subDays, subHours, subMinutes } from 'date-fns';

export class PrepTaskGenerator {
  constructor() {
    // Task templates by event category
    this.taskTemplates = {
      medical: [
        { 
          title: 'Gather insurance cards and ID',
          timing: { days: 1 },
          priority: 'high',
          category: 'prepare'
        },
        { 
          title: 'Write down questions for the doctor',
          timing: { days: 1 },
          priority: 'medium',
          category: 'prepare'
        },
        { 
          title: 'Complete pre-visit paperwork',
          timing: { days: 2 },
          priority: 'high',
          category: 'prepare',
          condition: (event) => event.description?.includes('new patient') || event.title?.includes('new patient')
        },
        { 
          title: 'Arrange childcare for siblings',
          timing: { days: 1 },
          priority: 'medium',
          category: 'arrange',
          condition: (event) => event.attendees?.length === 1
        }
      ],
      school: [
        { 
          title: 'Sign permission slip',
          timing: { days: 2 },
          priority: 'high',
          category: 'prepare',
          condition: (event) => event.title?.toLowerCase().includes('field trip')
        },
        { 
          title: 'Prepare payment',
          timing: { days: 1 },
          priority: 'medium',
          category: 'buy',
          condition: (event) => event.description?.includes('$') || event.description?.includes('fee')
        },
        { 
          title: 'Pack special items',
          timing: { hours: 12 },
          priority: 'medium',
          category: 'pack'
        },
        { 
          title: 'Review homework/project',
          timing: { days: 1 },
          priority: 'high',
          category: 'prepare',
          condition: (event) => event.title?.toLowerCase().includes('due') || event.title?.toLowerCase().includes('presentation')
        }
      ],
      sports: [
        { 
          title: 'Pack sports equipment',
          timing: { hours: 12 },
          priority: 'high',
          category: 'pack'
        },
        { 
          title: 'Fill water bottles',
          timing: { hours: 1 },
          priority: 'medium',
          category: 'prepare'
        },
        { 
          title: 'Check uniform is clean',
          timing: { days: 1 },
          priority: 'high',
          category: 'prepare'
        },
        { 
          title: 'Prepare snacks',
          timing: { hours: 2 },
          priority: 'low',
          category: 'prepare',
          condition: (event) => event.title?.toLowerCase().includes('game') || event.title?.toLowerCase().includes('tournament')
        }
      ],
      birthday: [
        { 
          title: 'Buy birthday gift',
          timing: { days: 3 },
          priority: 'high',
          category: 'buy'
        },
        { 
          title: 'Wrap gift',
          timing: { days: 1 },
          priority: 'medium',
          category: 'prepare'
        },
        { 
          title: 'Confirm RSVP',
          timing: { days: 2 },
          priority: 'high',
          category: 'confirm'
        },
        { 
          title: 'Plan outfit',
          timing: { days: 1 },
          priority: 'low',
          category: 'prepare'
        }
      ],
      social: [
        { 
          title: 'Confirm attendance',
          timing: { days: 2 },
          priority: 'medium',
          category: 'confirm'
        },
        { 
          title: 'Arrange transportation',
          timing: { days: 1 },
          priority: 'high',
          category: 'arrange'
        },
        { 
          title: 'Prepare contribution',
          timing: { days: 1 },
          priority: 'medium',
          category: 'prepare',
          condition: (event) => event.description?.toLowerCase().includes('potluck') || event.description?.toLowerCase().includes('bring')
        }
      ]
    };

    // Generic tasks for any event
    this.genericTasks = [
      { 
        title: 'Add to family calendar',
        timing: { minutes: 0 },
        priority: 'high',
        category: 'organize'
      },
      { 
        title: 'Set reminder',
        timing: { days: 1 },
        priority: 'medium',
        category: 'organize'
      }
    ];
  }

  // Generate prep tasks for an event
  generateTasks(event) {
    const tasks = [];
    
    // Get category-specific tasks
    const categoryTasks = this.taskTemplates[event.category] || [];
    
    // Filter tasks based on conditions
    const applicableTasks = categoryTasks.filter(task => {
      if (task.condition) {
        return task.condition(event);
      }
      return true;
    });

    // Generate tasks with due dates
    applicableTasks.forEach(taskTemplate => {
      const task = this.createTask(taskTemplate, event);
      if (task) {
        tasks.push(task);
      }
    });

    // Add generic tasks if needed
    if (event.isImportant || tasks.length < 2) {
      this.genericTasks.forEach(taskTemplate => {
        const task = this.createTask(taskTemplate, event);
        if (task) {
          tasks.push(task);
        }
      });
    }

    // Add custom tasks based on event analysis
    const customTasks = this.generateCustomTasks(event);
    tasks.push(...customTasks);

    // Sort by due date (earliest first)
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return tasks;
  }

  // Create a task from template
  createTask(template, event) {
    const eventDate = new Date(event.startTime);
    let dueDate = new Date(eventDate);

    // Calculate due date based on timing
    if (template.timing.days) {
      dueDate = subDays(eventDate, template.timing.days);
    } else if (template.timing.hours) {
      dueDate = subHours(eventDate, template.timing.hours);
    } else if (template.timing.minutes) {
      dueDate = subMinutes(eventDate, template.timing.minutes);
    }

    // Don't create tasks with due dates in the past
    if (dueDate < new Date()) {
      return null;
    }

    return {
      id: `prep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      dueDate,
      priority: template.priority,
      category: template.category,
      eventId: event.id,
      eventTitle: event.title,
      completed: false,
      createdAt: new Date()
    };
  }

  // Generate custom tasks based on event details
  generateCustomTasks(event) {
    const tasks = [];

    // Location-based tasks
    if (event.location) {
      // If it's a new location
      if (this.isNewLocation(event.location)) {
        tasks.push({
          id: `prep_${Date.now()}_directions`,
          title: 'Check directions and parking',
          dueDate: subDays(new Date(event.startTime), 1),
          priority: 'medium',
          category: 'prepare',
          eventId: event.id,
          eventTitle: event.title,
          completed: false,
          createdAt: new Date()
        });
      }

      // If it's far away
      if (this.isFarLocation(event.location)) {
        tasks.push({
          id: `prep_${Date.now()}_travel`,
          title: 'Plan travel time and route',
          dueDate: subDays(new Date(event.startTime), 1),
          priority: 'high',
          category: 'arrange',
          eventId: event.id,
          eventTitle: event.title,
          completed: false,
          createdAt: new Date()
        });
      }
    }

    // Weather-dependent events
    if (this.isOutdoorEvent(event)) {
      tasks.push({
        id: `prep_${Date.now()}_weather`,
        title: 'Check weather forecast',
        dueDate: subDays(new Date(event.startTime), 1),
        priority: 'medium',
        category: 'prepare',
        eventId: event.id,
        eventTitle: event.title,
        completed: false,
        createdAt: new Date()
      });
    }

    // Multi-child events
    if (event.attendees && event.attendees.length > 2) {
      tasks.push({
        id: `prep_${Date.now()}_coordinate`,
        title: 'Coordinate with other parents',
        dueDate: subDays(new Date(event.startTime), 2),
        priority: 'medium',
        category: 'arrange',
        eventId: event.id,
        eventTitle: event.title,
        completed: false,
        createdAt: new Date()
      });
    }

    // Document-related tasks
    if (event.documents && event.documents.length > 0) {
      tasks.push({
        id: `prep_${Date.now()}_docs`,
        title: 'Review and sign required documents',
        dueDate: subDays(new Date(event.startTime), 2),
        priority: 'high',
        category: 'prepare',
        eventId: event.id,
        eventTitle: event.title,
        completed: false,
        createdAt: new Date()
      });
    }

    return tasks;
  }

  // Helper methods
  isNewLocation(location) {
    // In a real app, this would check against previously visited locations
    return false; // Placeholder
  }

  isFarLocation(location) {
    // In a real app, this would calculate distance
    const farKeywords = ['airport', 'downtown', 'city', 'far'];
    const locationStr = typeof location === 'string' ? location : location.name || '';
    return farKeywords.some(keyword => locationStr.toLowerCase().includes(keyword));
  }

  isOutdoorEvent(event) {
    const outdoorKeywords = ['park', 'beach', 'field', 'outdoor', 'outside', 'picnic', 'camping'];
    const checkStr = `${event.title} ${event.description || ''} ${event.location || ''}`.toLowerCase();
    return outdoorKeywords.some(keyword => checkStr.includes(keyword));
  }

  // Get task suggestions for Allie to present
  getTaskSuggestions(event) {
    const allTasks = this.generateTasks(event);
    
    // Group by category
    const grouped = allTasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {});

    // Format for Allie
    return {
      essential: allTasks.filter(t => t.priority === 'high'),
      recommended: allTasks.filter(t => t.priority === 'medium'),
      optional: allTasks.filter(t => t.priority === 'low'),
      grouped,
      total: allTasks.length
    };
  }
}