// src/services/HomeworkTracker.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp, orderBy, limit
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import ChildTrackingService from './ChildTrackingService';
import CalendarService from './CalendarService';

/**
 * HomeworkTracker service
 * Manages homework assignments and projects with deadlines, progress tracking,
 * and reminder scheduling
 */
class HomeworkTracker {
  constructor() {
    this.homeworkCollection = collection(db, "homework");
    this.projectsCollection = collection(db, "projects");
    this.remindersCollection = collection(db, "reminders");
  }
  
  /**
   * Create a new homework assignment
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} homeworkData - Homework data
   * @returns {Promise<Object>} Created homework info
   */
  async createHomework(familyId, userId, homeworkData) {
    try {
      // Generate homework ID
      const homeworkId = uuidv4();
      
      // Default due date if not provided
      const dueDate = homeworkData.dueDate 
        ? new Date(homeworkData.dueDate) 
        : new Date();
      
      // Prepare homework document
      const homework = {
        id: homeworkId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic info
        title: homeworkData.title || 'Homework Assignment',
        description: homeworkData.description || '',
        subject: homeworkData.subject || '',
        assignmentType: homeworkData.assignmentType || 'homework', // homework, project, essay, reading, etc.
        dueDate: Timestamp.fromDate(dueDate),
        
        // Student info
        studentId: homeworkData.studentId || null,
        studentName: homeworkData.studentName || '',
        grade: homeworkData.grade || '',
        className: homeworkData.className || '',
        teacherName: homeworkData.teacherName || '',
        
        // Status tracking
        status: 'not_started', // not_started, in_progress, completed, submitted, graded
        progress: 0, // 0-100
        priority: homeworkData.priority || 'medium', // low, medium, high, urgent
        estimatedTimeMinutes: homeworkData.estimatedTimeMinutes || 30,
        timeSpentMinutes: 0,
        
        // Requirements
        requiresResearch: homeworkData.requiresResearch || false,
        requiresMaterials: homeworkData.requiresMaterials || false,
        requiredMaterials: homeworkData.requiredMaterials || [],
        
        // Grading and feedback
        grade: null,
        feedback: '',
        
        // Related records
        calendarEventId: null,
        
        // Tags and notifications
        tags: homeworkData.tags || [],
        reminderSettings: homeworkData.reminderSettings || {
          enabled: true,
          daysBefore: [1, 3],
          progressReminders: true
        }
      };
      
      // Save the homework document
      await setDoc(doc(this.homeworkCollection, homeworkId), homework);
      
      // Create calendar event if requested
      if (homeworkData.addToCalendar !== false) {
        const calendarEvent = {
          title: `Due: ${homework.title}`,
          start: {
            dateTime: dueDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(dueDate.getTime() + 30*60*1000).toISOString(), // 30 minute duration
            timeZone: 'UTC'
          },
          location: homework.className,
          description: `Subject: ${homework.subject}\nAssignment: ${homework.description}\nTeacher: ${homework.teacherName}`,
          familyId,
          createdBy: userId,
          category: 'school-homework',
          metadata: {
            homeworkId,
            studentId: homework.studentId,
            studentName: homework.studentName
          }
        };
        
        const calendarResult = await CalendarService.createEvent(calendarEvent);
        
        if (calendarResult.success) {
          // Update homework with calendar ID
          await updateDoc(doc(this.homeworkCollection, homeworkId), {
            calendarEventId: calendarResult.eventId
          });
          
          homework.calendarEventId = calendarResult.eventId;
        }
      }
      
      // Add to student's academic records
      if (homework.studentId) {
        await ChildTrackingService.addAcademicRecord(
          familyId,
          homework.studentId,
          {
            recordType: 'homework',
            homeworkId,
            title: homework.title,
            subject: homework.subject,
            dueDate: dueDate.toISOString(),
            status: homework.status
          }
        );
      }
      
      // Create materials list if required
      if (homeworkData.requiresMaterials && 
          homeworkData.requiredMaterials && 
          homeworkData.requiredMaterials.length > 0) {
        await this.updateRequiredMaterials(homeworkId, homeworkData.requiredMaterials);
      }
      
      // Return the created homework
      return {
        success: true,
        homeworkId,
        homework
      };
    } catch (error) {
      console.error("Error creating homework:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Create a project with multiple milestones
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project info
   */
  async createProject(familyId, userId, projectData) {
    try {
      // Generate project ID
      const projectId = uuidv4();
      
      // Default due date if not provided
      const dueDate = projectData.dueDate 
        ? new Date(projectData.dueDate) 
        : new Date();
      
      // Prepare project document
      const project = {
        id: projectId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Basic info
        title: projectData.title || 'School Project',
        description: projectData.description || '',
        subject: projectData.subject || '',
        dueDate: Timestamp.fromDate(dueDate),
        
        // Student info
        studentId: projectData.studentId || null,
        studentName: projectData.studentName || '',
        grade: projectData.grade || '',
        className: projectData.className || '',
        teacherName: projectData.teacherName || '',
        
        // Status tracking
        status: 'not_started', // not_started, in_progress, completed, submitted, graded
        progress: 0, // 0-100
        priority: projectData.priority || 'high', // low, medium, high, urgent
        estimatedTimeHours: projectData.estimatedTimeHours || 3,
        timeSpentHours: 0,
        
        // Milestones
        milestones: projectData.milestones || [],
        
        // Requirements
        requiresResearch: projectData.requiresResearch || false,
        requiresMaterials: projectData.requiresMaterials || false,
        requiredMaterials: projectData.requiredMaterials || [],
        
        // Presentation details
        presentationRequired: projectData.presentationRequired || false,
        presentationDate: projectData.presentationDate 
          ? Timestamp.fromDate(new Date(projectData.presentationDate)) 
          : null,
        
        // Grading and feedback
        grade: null,
        feedback: '',
        
        // Related records
        calendarEventId: null,
        
        // Tags and notifications
        tags: projectData.tags || [],
        reminderSettings: projectData.reminderSettings || {
          enabled: true,
          daysBefore: [1, 3, 7],
          milestoneReminders: true,
          progressReminders: true
        }
      };
      
      // Process milestones
      if (projectData.milestones && projectData.milestones.length > 0) {
        project.milestones = projectData.milestones.map(milestone => ({
          id: milestone.id || uuidv4(),
          title: milestone.title || '',
          description: milestone.description || '',
          dueDate: milestone.dueDate 
            ? Timestamp.fromDate(new Date(milestone.dueDate)) 
            : null,
          status: 'not_started', // not_started, in_progress, completed
          progress: 0, // 0-100
          weight: milestone.weight || 1, // relative weight for overall progress
        }));
      } else {
        // Create default milestones
        project.milestones = [
          {
            id: uuidv4(),
            title: 'Research',
            description: 'Gather information and research for the project',
            dueDate: Timestamp.fromDate(new Date(dueDate.getTime() - 14*24*60*60*1000)), // 2 weeks before
            status: 'not_started',
            progress: 0,
            weight: 1
          },
          {
            id: uuidv4(),
            title: 'Draft',
            description: 'Create first draft of the project',
            dueDate: Timestamp.fromDate(new Date(dueDate.getTime() - 7*24*60*60*1000)), // 1 week before
            status: 'not_started',
            progress: 0,
            weight: 1
          },
          {
            id: uuidv4(),
            title: 'Final Version',
            description: 'Complete the final version of the project',
            dueDate: Timestamp.fromDate(dueDate),
            status: 'not_started',
            progress: 0,
            weight: 1
          }
        ];
      }
      
      // Save the project document
      await setDoc(doc(this.projectsCollection, projectId), project);
      
      // Create calendar events for the project and milestones
      if (projectData.addToCalendar !== false) {
        // Main project due date
        const mainCalendarEvent = {
          title: `Due: ${project.title}`,
          start: {
            dateTime: dueDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(dueDate.getTime() + 30*60*1000).toISOString(), // 30 minute duration
            timeZone: 'UTC'
          },
          location: project.className,
          description: `Subject: ${project.subject}\nProject: ${project.description}\nTeacher: ${project.teacherName}`,
          familyId,
          createdBy: userId,
          category: 'school-project',
          metadata: {
            projectId,
            studentId: project.studentId,
            studentName: project.studentName
          }
        };
        
        const mainCalendarResult = await CalendarService.createEvent(mainCalendarEvent);
        
        if (mainCalendarResult.success) {
          // Update project with calendar ID
          await updateDoc(doc(this.projectsCollection, projectId), {
            calendarEventId: mainCalendarResult.eventId
          });
          
          project.calendarEventId = mainCalendarResult.eventId;
          
          // Add calendar events for milestones
          const milestoneEvents = [];
          
          for (const milestone of project.milestones) {
            if (milestone.dueDate) {
              const msDate = milestone.dueDate.toDate();
              
              const milestoneEvent = {
                title: `${project.title}: ${milestone.title}`,
                start: {
                  dateTime: msDate.toISOString(),
                  timeZone: 'UTC'
                },
                end: {
                  dateTime: new Date(msDate.getTime() + 30*60*1000).toISOString(),
                  timeZone: 'UTC'
                },
                location: project.className,
                description: `Project Milestone: ${milestone.description}\nSubject: ${project.subject}\nTeacher: ${project.teacherName}`,
                familyId,
                createdBy: userId,
                category: 'school-project-milestone',
                metadata: {
                  projectId,
                  milestoneId: milestone.id,
                  studentId: project.studentId,
                  studentName: project.studentName
                }
              };
              
              const result = await CalendarService.createEvent(milestoneEvent);
              
              if (result.success) {
                milestoneEvents.push({
                  milestoneId: milestone.id,
                  eventId: result.eventId
                });
              }
            }
          }
          
          // Update milestone calendar event IDs
          if (milestoneEvents.length > 0) {
            const updatedMilestones = [...project.milestones];
            
            for (const msEvent of milestoneEvents) {
              const index = updatedMilestones.findIndex(ms => ms.id === msEvent.milestoneId);
              if (index !== -1) {
                updatedMilestones[index] = {
                  ...updatedMilestones[index],
                  calendarEventId: msEvent.eventId
                };
              }
            }
            
            await updateDoc(doc(this.projectsCollection, projectId), {
              milestones: updatedMilestones
            });
          }
        }
      }
      
      // Add to student's academic records
      if (project.studentId) {
        await ChildTrackingService.addAcademicRecord(
          familyId,
          project.studentId,
          {
            recordType: 'project',
            projectId,
            title: project.title,
            subject: project.subject,
            dueDate: dueDate.toISOString(),
            status: project.status
          }
        );
      }
      
      // Return the created project
      return {
        success: true,
        projectId,
        project
      };
    } catch (error) {
      console.error("Error creating project:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update required materials for homework
   * @param {string} homeworkId - The homework ID
   * @param {Array} materials - List of materials
   * @returns {Promise<Object>} Result
   */
  async updateRequiredMaterials(homeworkId, materials) {
    try {
      // Process the materials list
      const requiredMaterials = materials.map(material => ({
        id: material.id || uuidv4(),
        name: material.name || '',
        quantity: material.quantity || 1,
        acquired: material.acquired || false,
        notes: material.notes || ''
      }));
      
      // Update the homework
      await updateDoc(doc(this.homeworkCollection, homeworkId), {
        requiredMaterials,
        requiresMaterials: true,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error updating required materials:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update homework progress
   * @param {string} homeworkId - The homework ID
   * @param {number} progress - Progress percentage (0-100)
   * @param {number} timeSpentMinutes - Additional time spent in minutes
   * @returns {Promise<Object>} Result
   */
  async updateHomeworkProgress(homeworkId, progress, timeSpentMinutes = 0) {
    try {
      // Get current homework
      const homeworkDoc = await getDoc(doc(this.homeworkCollection, homeworkId));
      
      if (!homeworkDoc.exists()) {
        throw new Error(`Homework with ID ${homeworkId} not found`);
      }
      
      const homework = homeworkDoc.data();
      
      // Calculate new status based on progress
      let status = homework.status;
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in_progress';
      }
      
      // Update total time spent
      const totalTimeSpent = (homework.timeSpentMinutes || 0) + (timeSpentMinutes || 0);
      
      // Update the homework
      await updateDoc(doc(this.homeworkCollection, homeworkId), {
        progress,
        status,
        timeSpentMinutes: totalTimeSpent,
        updatedAt: serverTimestamp()
      });
      
      // Update academic record
      if (homework.studentId && homework.familyId) {
        await ChildTrackingService.updateAcademicRecordStatus(
          homework.familyId,
          homework.studentId,
          'homework',
          homeworkId,
          status
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating homework progress:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update project milestone progress
   * @param {string} projectId - The project ID
   * @param {string} milestoneId - The milestone ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<Object>} Result
   */
  async updateMilestoneProgress(projectId, milestoneId, progress) {
    try {
      // Get current project
      const projectDoc = await getDoc(doc(this.projectsCollection, projectId));
      
      if (!projectDoc.exists()) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      const project = projectDoc.data();
      
      // Find and update the milestone
      const milestones = [...project.milestones];
      const milestoneIndex = milestones.findIndex(ms => ms.id === milestoneId);
      
      if (milestoneIndex === -1) {
        throw new Error(`Milestone with ID ${milestoneId} not found`);
      }
      
      // Calculate new status based on progress
      let status = milestones[milestoneIndex].status;
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }
      
      // Update the milestone
      milestones[milestoneIndex] = {
        ...milestones[milestoneIndex],
        progress,
        status
      };
      
      // Calculate overall project progress
      let totalWeight = 0;
      let weightedProgress = 0;
      
      milestones.forEach(ms => {
        const weight = ms.weight || 1;
        totalWeight += weight;
        weightedProgress += (ms.progress || 0) * weight;
      });
      
      const overallProgress = totalWeight > 0 
        ? Math.round(weightedProgress / totalWeight) 
        : 0;
      
      // Determine overall project status
      let projectStatus = project.status;
      
      if (overallProgress === 100) {
        projectStatus = 'completed';
      } else if (overallProgress > 0) {
        projectStatus = 'in_progress';
      } else {
        projectStatus = 'not_started';
      }
      
      // Update the project
      await updateDoc(doc(this.projectsCollection, projectId), {
        milestones,
        progress: overallProgress,
        status: projectStatus,
        updatedAt: serverTimestamp()
      });
      
      // Update academic record if status changed
      if (project.studentId && project.familyId && projectStatus !== project.status) {
        await ChildTrackingService.updateAcademicRecordStatus(
          project.familyId,
          project.studentId,
          'project',
          projectId,
          projectStatus
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating milestone progress:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Mark homework as submitted
   * @param {string} homeworkId - The homework ID
   * @param {Date} submittedDate - Date of submission
   * @returns {Promise<Object>} Result
   */
  async markHomeworkSubmitted(homeworkId, submittedDate = new Date()) {
    try {
      // Update the homework
      await updateDoc(doc(this.homeworkCollection, homeworkId), {
        status: 'submitted',
        progress: 100,
        submittedDate: Timestamp.fromDate(submittedDate),
        updatedAt: serverTimestamp()
      });
      
      // Get homework details for academic record update
      const homeworkDoc = await getDoc(doc(this.homeworkCollection, homeworkId));
      
      if (homeworkDoc.exists()) {
        const homework = homeworkDoc.data();
        
        // Update academic record
        if (homework.studentId && homework.familyId) {
          await ChildTrackingService.updateAcademicRecordStatus(
            homework.familyId,
            homework.studentId,
            'homework',
            homeworkId,
            'submitted'
          );
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error marking homework as submitted:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Mark project as submitted
   * @param {string} projectId - The project ID
   * @param {Date} submittedDate - Date of submission
   * @returns {Promise<Object>} Result
   */
  async markProjectSubmitted(projectId, submittedDate = new Date()) {
    try {
      // Update the project
      await updateDoc(doc(this.projectsCollection, projectId), {
        status: 'submitted',
        progress: 100,
        submittedDate: Timestamp.fromDate(submittedDate),
        updatedAt: serverTimestamp()
      });
      
      // Get project details for academic record update
      const projectDoc = await getDoc(doc(this.projectsCollection, projectId));
      
      if (projectDoc.exists()) {
        const project = projectDoc.data();
        
        // Update academic record
        if (project.studentId && project.familyId) {
          await ChildTrackingService.updateAcademicRecordStatus(
            project.familyId,
            project.studentId,
            'project',
            projectId,
            'submitted'
          );
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error marking project as submitted:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Record grade and feedback for homework
   * @param {string} homeworkId - The homework ID
   * @param {Object} gradeData - Grade data
   * @returns {Promise<Object>} Result
   */
  async recordHomeworkGrade(homeworkId, gradeData) {
    try {
      // Update the homework
      await updateDoc(doc(this.homeworkCollection, homeworkId), {
        status: 'graded',
        grade: gradeData.grade || null,
        feedback: gradeData.feedback || '',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error recording homework grade:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Record grade and feedback for project
   * @param {string} projectId - The project ID
   * @param {Object} gradeData - Grade data
   * @returns {Promise<Object>} Result
   */
  async recordProjectGrade(projectId, gradeData) {
    try {
      // Update the project
      await updateDoc(doc(this.projectsCollection, projectId), {
        status: 'graded',
        grade: gradeData.grade || null,
        feedback: gradeData.feedback || '',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error recording project grade:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get a homework assignment by ID
   * @param {string} homeworkId - The homework ID
   * @returns {Promise<Object>} Homework data
   */
  async getHomework(homeworkId) {
    try {
      const homeworkDoc = await getDoc(doc(this.homeworkCollection, homeworkId));
      
      if (!homeworkDoc.exists()) {
        throw new Error(`Homework with ID ${homeworkId} not found`);
      }
      
      return homeworkDoc.data();
    } catch (error) {
      console.error("Error getting homework:", error);
      return null;
    }
  }
  
  /**
   * Get a project by ID
   * @param {string} projectId - The project ID
   * @returns {Promise<Object>} Project data
   */
  async getProject(projectId) {
    try {
      const projectDoc = await getDoc(doc(this.projectsCollection, projectId));
      
      if (!projectDoc.exists()) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      return projectDoc.data();
    } catch (error) {
      console.error("Error getting project:", error);
      return null;
    }
  }
  
  /**
   * Get homework assignments for a student
   * @param {string} studentId - The student ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Homework assignments
   */
  async getHomeworkForStudent(studentId, filters = {}) {
    try {
      let homeworkQuery = query(
        this.homeworkCollection,
        where("studentId", "==", studentId)
      );
      
      // Apply additional filters
      if (filters.status) {
        homeworkQuery = query(homeworkQuery, where("status", "==", filters.status));
      }
      
      if (filters.subject) {
        homeworkQuery = query(homeworkQuery, where("subject", "==", filters.subject));
      }
      
      // Add a filter for priority if specified
      if (filters.priority) {
        homeworkQuery = query(homeworkQuery, where("priority", "==", filters.priority));
      }
      
      // Add date range filter if specified
      if (filters.startDate && filters.endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        
        homeworkQuery = query(
          homeworkQuery, 
          where("dueDate", ">=", startTimestamp),
          where("dueDate", "<=", endTimestamp)
        );
      }
      
      // Add sorting
      homeworkQuery = query(
        homeworkQuery, 
        orderBy("dueDate", filters.sortOrder === 'asc' ? 'asc' : 'desc')
      );
      
      const homeworkDocs = await getDocs(homeworkQuery);
      const assignments = [];
      
      homeworkDocs.forEach(doc => {
        assignments.push(doc.data());
      });
      
      return assignments;
    } catch (error) {
      console.error("Error getting homework for student:", error);
      return [];
    }
  }
  
  /**
   * Get projects for a student
   * @param {string} studentId - The student ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Projects
   */
  async getProjectsForStudent(studentId, filters = {}) {
    try {
      let projectsQuery = query(
        this.projectsCollection,
        where("studentId", "==", studentId)
      );
      
      // Apply additional filters
      if (filters.status) {
        projectsQuery = query(projectsQuery, where("status", "==", filters.status));
      }
      
      if (filters.subject) {
        projectsQuery = query(projectsQuery, where("subject", "==", filters.subject));
      }
      
      // Add a filter for priority if specified
      if (filters.priority) {
        projectsQuery = query(projectsQuery, where("priority", "==", filters.priority));
      }
      
      // Add date range filter if specified
      if (filters.startDate && filters.endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        
        projectsQuery = query(
          projectsQuery, 
          where("dueDate", ">=", startTimestamp),
          where("dueDate", "<=", endTimestamp)
        );
      }
      
      // Add sorting
      projectsQuery = query(
        projectsQuery, 
        orderBy("dueDate", filters.sortOrder === 'asc' ? 'asc' : 'desc')
      );
      
      const projectDocs = await getDocs(projectsQuery);
      const projects = [];
      
      projectDocs.forEach(doc => {
        projects.push(doc.data());
      });
      
      return projects;
    } catch (error) {
      console.error("Error getting projects for student:", error);
      return [];
    }
  }
  
  /**
   * Get upcoming homework and projects for a student
   * @param {string} studentId - The student ID
   * @param {number} daysAhead - Days to look ahead (default: 14)
   * @returns {Promise<Object>} Upcoming assignments
   */
  async getUpcomingAssignments(studentId, daysAhead = 14) {
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + daysAhead);
      
      const startTimestamp = Timestamp.fromDate(now);
      const endTimestamp = Timestamp.fromDate(future);
      
      // Get upcoming homework
      const homeworkQuery = query(
        this.homeworkCollection,
        where("studentId", "==", studentId),
        where("dueDate", ">=", startTimestamp),
        where("dueDate", "<=", endTimestamp),
        where("status", "in", ["not_started", "in_progress"]),
        orderBy("dueDate", "asc")
      );
      
      const homeworkDocs = await getDocs(homeworkQuery);
      const homeworkAssignments = [];
      
      homeworkDocs.forEach(doc => {
        homeworkAssignments.push(doc.data());
      });
      
      // Get upcoming projects
      const projectsQuery = query(
        this.projectsCollection,
        where("studentId", "==", studentId),
        where("dueDate", ">=", startTimestamp),
        where("dueDate", "<=", endTimestamp),
        where("status", "in", ["not_started", "in_progress"]),
        orderBy("dueDate", "asc")
      );
      
      const projectDocs = await getDocs(projectsQuery);
      const projects = [];
      
      projectDocs.forEach(doc => {
        projects.push(doc.data());
      });
      
      // Get upcoming project milestones
      const upcomingMilestones = [];
      
      for (const project of projects) {
        if (project.milestones && project.milestones.length > 0) {
          for (const milestone of project.milestones) {
            if (milestone.status !== 'completed' && milestone.dueDate) {
              const msDate = milestone.dueDate.toDate();
              if (msDate >= now && msDate <= future) {
                upcomingMilestones.push({
                  ...milestone,
                  projectId: project.id,
                  projectTitle: project.title,
                  subject: project.subject,
                  studentName: project.studentName
                });
              }
            }
          }
        }
      }
      
      return {
        homework: homeworkAssignments,
        projects,
        milestones: upcomingMilestones
      };
    } catch (error) {
      console.error("Error getting upcoming assignments:", error);
      return { homework: [], projects: [], milestones: [] };
    }
  }
  
  /**
   * Get overdue assignments for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Object>} Overdue assignments
   */
  async getOverdueAssignments(studentId) {
    try {
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);
      
      // Get overdue homework
      const homeworkQuery = query(
        this.homeworkCollection,
        where("studentId", "==", studentId),
        where("dueDate", "<", timestamp),
        where("status", "in", ["not_started", "in_progress"]),
        orderBy("dueDate", "asc")
      );
      
      const homeworkDocs = await getDocs(homeworkQuery);
      const homeworkAssignments = [];
      
      homeworkDocs.forEach(doc => {
        homeworkAssignments.push(doc.data());
      });
      
      // Get overdue projects
      const projectsQuery = query(
        this.projectsCollection,
        where("studentId", "==", studentId),
        where("dueDate", "<", timestamp),
        where("status", "in", ["not_started", "in_progress"]),
        orderBy("dueDate", "asc")
      );
      
      const projectDocs = await getDocs(projectsQuery);
      const projects = [];
      
      projectDocs.forEach(doc => {
        projects.push(doc.data());
      });
      
      // Get overdue project milestones
      const overdueMilestones = [];
      
      // Get all in-progress projects that might have overdue milestones
      const allProjectsQuery = query(
        this.projectsCollection,
        where("studentId", "==", studentId),
        where("status", "==", "in_progress")
      );
      
      const allProjectDocs = await getDocs(allProjectsQuery);
      
      allProjectDocs.forEach(doc => {
        const project = doc.data();
        
        if (project.milestones && project.milestones.length > 0) {
          for (const milestone of project.milestones) {
            if (milestone.status !== 'completed' && milestone.dueDate) {
              const msDate = milestone.dueDate.toDate();
              if (msDate < now) {
                overdueMilestones.push({
                  ...milestone,
                  projectId: project.id,
                  projectTitle: project.title,
                  subject: project.subject,
                  studentName: project.studentName
                });
              }
            }
          }
        }
      });
      
      return {
        homework: homeworkAssignments,
        projects,
        milestones: overdueMilestones
      };
    } catch (error) {
      console.error("Error getting overdue assignments:", error);
      return { homework: [], projects: [], milestones: [] };
    }
  }
  
  /**
   * Generate homework reminders
   * @param {number} daysInAdvance - Days before due date (1, 3, etc.)
   * @returns {Promise<Array>} Homework reminders
   */
  async generateHomeworkReminders(daysInAdvance) {
    try {
      // Calculate target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysInAdvance);
      
      // Start and end of target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query homework due on target date
      const homeworkQuery = query(
        this.homeworkCollection,
        where("dueDate", ">=", Timestamp.fromDate(startOfDay)),
        where("dueDate", "<=", Timestamp.fromDate(endOfDay)),
        where("status", "in", ["not_started", "in_progress"])
      );
      
      const homeworkDocs = await getDocs(homeworkQuery);
      const reminders = [];
      
      // Process each homework assignment
      homeworkDocs.forEach(doc => {
        const homework = doc.data();
        
        // Skip if reminders are disabled
        if (homework.reminderSettings && !homework.reminderSettings.enabled) {
          return;
        }
        
        // Skip if this day isn't in the reminder days
        if (homework.reminderSettings && 
            homework.reminderSettings.daysBefore && 
            !homework.reminderSettings.daysBefore.includes(daysInAdvance)) {
          return;
        }
        
        const dueDate = homework.dueDate.toDate();
        const dueDateStr = dueDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
        
        // Create reminder
        reminders.push({
          type: 'homework',
          homeworkId: homework.id,
          title: homework.title,
          subject: homework.subject,
          dueDate: homework.dueDate,
          studentId: homework.studentId,
          studentName: homework.studentName,
          progress: homework.progress,
          priority: homework.priority,
          message: `Reminder: ${homework.title} for ${homework.subject} is due on ${dueDateStr} (${daysInAdvance} days from now).${homework.progress > 0 ? ` Current progress: ${homework.progress}%` : ''}`,
          urgency: this.calculateUrgency(homework)
        });
      });
      
      return reminders;
    } catch (error) {
      console.error("Error generating homework reminders:", error);
      return [];
    }
  }
  
  /**
   * Generate project milestone reminders
   * @param {number} daysInAdvance - Days before due date (1, 3, etc.)
   * @returns {Promise<Array>} Milestone reminders
   */
  async generateMilestoneReminders(daysInAdvance) {
    try {
      // Calculate target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysInAdvance);
      
      // Start and end of target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // We need to query all in-progress projects and check milestones
      const projectsQuery = query(
        this.projectsCollection,
        where("status", "==", "in_progress")
      );
      
      const projectDocs = await getDocs(projectsQuery);
      const reminders = [];
      
      // Process each project's milestones
      projectDocs.forEach(doc => {
        const project = doc.data();
        
        // Skip if reminders are disabled
        if (project.reminderSettings && !project.reminderSettings.enabled) {
          return;
        }
        
        // Skip if milestone reminders are disabled
        if (project.reminderSettings && 
            project.reminderSettings.milestoneReminders === false) {
          return;
        }
        
        // Skip if this day isn't in the reminder days
        if (project.reminderSettings && 
            project.reminderSettings.daysBefore && 
            !project.reminderSettings.daysBefore.includes(daysInAdvance)) {
          return;
        }
        
        // Check each milestone
        if (project.milestones && project.milestones.length > 0) {
          for (const milestone of project.milestones) {
            if (milestone.status !== 'completed' && milestone.dueDate) {
              const msDate = milestone.dueDate.toDate();
              
              // Check if milestone is due on the target date
              if (msDate >= startOfDay && msDate <= endOfDay) {
                const dueDateStr = msDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                });
                
                // Create reminder
                reminders.push({
                  type: 'project_milestone',
                  projectId: project.id,
                  milestoneId: milestone.id,
                  projectTitle: project.title,
                  milestoneTitle: milestone.title,
                  subject: project.subject,
                  dueDate: milestone.dueDate,
                  studentId: project.studentId,
                  studentName: project.studentName,
                  progress: milestone.progress,
                  message: `Reminder: Milestone "${milestone.title}" for ${project.title} is due on ${dueDateStr} (${daysInAdvance} days from now).${milestone.progress > 0 ? ` Current progress: ${milestone.progress}%` : ''}`,
                  urgency: this.calculateProjectUrgency(project, milestone)
                });
              }
            }
          }
        }
      });
      
      return reminders;
    } catch (error) {
      console.error("Error generating milestone reminders:", error);
      return [];
    }
  }
  
  /**
   * Calculate urgency level for homework (0-10 scale)
   * @param {Object} homework - Homework data
   * @returns {number} Urgency level
   */
  calculateUrgency(homework) {
    // Base score from priority
    let urgency = homework.priority === 'urgent' ? 8 :
                 homework.priority === 'high' ? 6 :
                 homework.priority === 'medium' ? 4 :
                 2;
    
    // Adjust based on progress
    if (homework.progress === 0) {
      urgency += 2; // Not started
    } else if (homework.progress < 50) {
      urgency += 1; // Early stages
    }
    
    // Adjust based on days until due
    const now = new Date();
    const dueDate = homework.dueDate.toDate();
    const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      urgency = 10; // Overdue
    } else if (daysUntilDue === 0) {
      urgency = Math.max(urgency, 9); // Due today
    } else if (daysUntilDue === 1) {
      urgency = Math.max(urgency, 8); // Due tomorrow
    } else if (daysUntilDue <= 2) {
      urgency = Math.max(urgency, 7); // Due in 2 days
    }
    
    // Cap at 10
    return Math.min(urgency, 10);
  }
  
  /**
   * Calculate urgency level for project milestone (0-10 scale)
   * @param {Object} project - Project data
   * @param {Object} milestone - Milestone data
   * @returns {number} Urgency level
   */
  calculateProjectUrgency(project, milestone) {
    // Base score from project priority
    let urgency = project.priority === 'urgent' ? 7 :
                 project.priority === 'high' ? 5 :
                 project.priority === 'medium' ? 3 :
                 2;
    
    // Adjust based on progress
    if (milestone.progress === 0) {
      urgency += 2; // Not started
    } else if (milestone.progress < 50) {
      urgency += 1; // Early stages
    }
    
    // Adjust based on days until due
    const now = new Date();
    const dueDate = milestone.dueDate.toDate();
    const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      urgency = 10; // Overdue
    } else if (daysUntilDue === 0) {
      urgency = Math.max(urgency, 9); // Due today
    } else if (daysUntilDue === 1) {
      urgency = Math.max(urgency, 8); // Due tomorrow
    } else if (daysUntilDue <= 2) {
      urgency = Math.max(urgency, 7); // Due in 2 days
    }
    
    // Is this the final milestone?
    if (milestone.title.toLowerCase().includes('final')) {
      urgency += 1;
    }
    
    // Cap at 10
    return Math.min(urgency, 10);
  }
}

export default new HomeworkTracker();