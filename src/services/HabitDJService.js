// src/services/HabitDJService.js
import { 
  doc, collection, getDoc, setDoc, updateDoc, 
  query, where, getDocs, serverTimestamp, 
  arrayUnion, orderBy, limit, addDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import CalendarService from './CalendarService';
import AllieAIService from './AllieAIService';
import ClaudeService from './ClaudeService';
import EventStore from './EventStore';

class HabitDJService {
  constructor() {
    this.sessionTemplates = {
      'morning': {
        energy: 'energetic',
        duration: 120, // seconds
        prompts: [
          'Let\'s start fresh!',
          'Rise and shine!',
          'Morning momentum!'
        ],
        musicGenres: ['upbeat pop', 'motivational', 'morning jazz']
      },
      'afternoon': {
        energy: 'moderate',
        duration: 180,
        prompts: [
          'Afternoon boost!',
          'Keep it going!',
          'Midday magic!'
        ],
        musicGenres: ['indie', 'acoustic', 'chill beats']
      },
      'evening': {
        energy: 'calm',
        duration: 300,
        prompts: [
          'Wind down time',
          'Evening peace',
          'Gentle progress'
        ],
        musicGenres: ['ambient', 'classical', 'lo-fi']
      }
    };
    
    this.contextTriggers = [
      'before_school_pickup',
      'after_breakfast',
      'during_lunch_break',
      'before_dinner_prep',
      'after_kids_bedtime',
      'weekend_morning',
      'sunday_planning'
    ];
  }

  // Initialize DJ settings for a user
  async initializeDJSettings(userId, familyId) {
    try {
      const settingsRef = doc(db, 'users', userId, 'habitDJSettings', 'config');
      const existing = await getDoc(settingsRef);
      
      if (existing.exists()) return existing.data();
      
      const settings = {
        userId,
        optimalTimes: [],
        musicPreferences: {
          spotifyConnected: false,
          preferredGenres: ['motivational', 'upbeat pop', 'chill beats'],
          energyLevels: {
            morning: 'energetic',
            afternoon: 'moderate',
            evening: 'calm'
          },
          customPlaylists: []
        },
        practiceHistory: [],
        adaptiveSettings: {
          currentDifficulty: 3, // 1-10 scale
          preferredSessionLength: 180, // 3 minutes default
          nudgeFrequency: 'moderate',
          lastOptimization: serverTimestamp()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(settingsRef, settings);
      return settings;
    } catch (error) {
      console.error('Error initializing DJ settings:', error);
      throw error;
    }
  }

  // Learn optimal practice times from calendar and history
  async learnOptimalTimes(userId, habitId, familyId) {
    try {
      // Get user's calendar events for the past month
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Pass source to bypass event guard
      const events = await EventStore.getEventsForUser(userId, monthAgo, now, familyId);
      
      // Filter recent events
      const recentEvents = events.filter(e => {
        const eventDate = e.start?.dateTime || e.dateTime;
        return eventDate && new Date(eventDate) > monthAgo;
      });
      
      // Analyze free time slots
      const freeSlots = this.findFreeTimeSlots(recentEvents);
      
      // Get practice history
      const historyRef = collection(db, 'users', userId, 'habitDJSettings', 'config', 'practiceHistory');
      const historyQuery = query(historyRef, where('habitId', '==', habitId), orderBy('timestamp', 'desc'), limit(100));
      const historySnap = await getDocs(historyQuery);
      
      const successfulPractices = [];
      historySnap.forEach(doc => {
        const practice = doc.data();
        if (practice.completed && practice.sessionQuality >= 4) {
          successfulPractices.push(practice);
        }
      });
      
      // Use ML-like analysis to find patterns
      const optimalTimes = this.analyzeOptimalTimes(freeSlots, successfulPractices);
      
      // Update user settings
      const settingsRef = doc(db, 'users', userId, 'habitDJSettings', 'config');
      await updateDoc(settingsRef, {
        [`optimalTimes.${habitId}`]: optimalTimes,
        'adaptiveSettings.lastOptimization': serverTimestamp()
      });
      
      return optimalTimes;
    } catch (error) {
      console.error('Error learning optimal times:', error);
      throw error;
    }
  }

  // Start a micro-practice session
  async startMicroSession(habitId, userId, familyId, options = {}) {
    try {
      const settings = await this.getUserDJSettings(userId);
      const timeOfDay = this.getTimeOfDay();
      const template = this.sessionTemplates[timeOfDay];
      
      // Determine session parameters
      const duration = options.duration || settings.adaptiveSettings.preferredSessionLength;
      const energy = options.energy || template.energy;
      const musicGenre = options.musicGenre || this.selectMusicGenre(settings, timeOfDay);
      
      // Create session object
      const session = {
        sessionId: `dj_${Date.now()}_${habitId}`,
        habitId,
        userId,
        familyId,
        startTime: new Date(),
        plannedDuration: duration,
        actualDuration: 0,
        energy,
        musicGenre,
        prompt: this.selectPrompt(template, habitId),
        completed: false,
        kudosReceived: [],
        sessionQuality: 0,
        metadata: {
          deviceType: options.deviceType || 'web',
          contextTrigger: options.contextTrigger || 'manual',
          weatherMood: await this.getWeatherMood()
        }
      };
      
      // Save session start
      const sessionRef = doc(collection(db, 'djSessions'), session.sessionId);
      await setDoc(sessionRef, {
        ...session,
        createdAt: serverTimestamp()
      });
      
      // Create calendar event for tracking (wrapped to prevent errors)
      this.createSessionCalendarEvent(session, habitId, userId, familyId).catch(err => 
        console.warn('Calendar event creation failed, continuing without it:', err)
      );
      
      // Get Allie to provide voice guidance
      const voiceGuidance = await this.generateVoiceGuidance(habitId, session, familyId);
      
      // Notify family members for kudos opportunity
      await this.notifyFamilyForKudos(session, familyId, userId);
      
      return {
        session,
        voiceGuidance,
        musicUrl: await this.getMusicUrl(musicGenre, duration),
        visualizations: this.getVisualizations(energy)
      };
    } catch (error) {
      console.error('Error starting micro session:', error);
      throw error;
    }
  }

  // Complete a practice session
  async completeSession(sessionId, actualDuration, quality, reflection = '') {
    try {
      const sessionRef = doc(db, 'djSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) throw new Error('Session not found');
      
      const session = sessionDoc.data();
      
      // Calculate completion score
      const completionRate = actualDuration / session.plannedDuration;
      const bonusPoints = session.kudosReceived.length * 5;
      const qualityBonus = quality * 10;
      const totalScore = Math.round(completionRate * 50 + bonusPoints + qualityBonus);
      
      // Update session
      await updateDoc(sessionRef, {
        actualDuration,
        completed: true,
        completedAt: serverTimestamp(),
        sessionQuality: quality,
        reflection,
        score: totalScore
      });
      
      // Update practice history
      await this.updatePracticeHistory(session.userId, {
        habitId: session.habitId,
        timestamp: new Date(),
        duration: actualDuration,
        completed: true,
        kudosReceived: session.kudosReceived,
        sessionQuality: quality,
        score: totalScore
      });
      
      // Update adaptive settings based on performance
      await this.updateAdaptiveSettings(session.userId, session, quality, completionRate);
      
      // Create celebration moment
      if (quality >= 4 || session.kudosReceived.length > 0) {
        await this.createCelebrationMoment(session, totalScore);
      }
      
      return {
        score: totalScore,
        achievements: await this.checkSessionAchievements(session, totalScore),
        nextOptimalTime: await this.suggestNextPracticeTime(session.userId, session.habitId)
      };
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  // Send kudos during a session
  async sendKudos(sessionId, fromUserId, emoji = '👏') {
    try {
      const sessionRef = doc(db, 'djSessions', sessionId);
      
      await updateDoc(sessionRef, {
        kudosReceived: arrayUnion({
          fromUserId,
          emoji,
          timestamp: new Date()
        })
      });
      
      // Real-time notification to session owner
      const session = (await getDoc(sessionRef)).data();
      await this.sendRealtimeKudos(session.userId, fromUserId, emoji);
      
      return { success: true };
    } catch (error) {
      console.error('Error sending kudos:', error);
      throw error;
    }
  }

  // Get family leaderboard
  async getFamilyLeaderboard(familyId, timeframe = 'week') {
    try {
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (!familyDoc.exists()) throw new Error('Family not found');
      
      const familyMembers = familyDoc.data().members || [];
      const leaderboard = [];
      
      // Calculate timeframe boundaries
      const now = new Date();
      const startDate = new Date(now);
      if (timeframe === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Get scores for each family member
      for (const member of familyMembers) {
        const sessionsRef = collection(db, 'djSessions');
        const q = query(
          sessionsRef,
          where('userId', '==', member.id),
          where('familyId', '==', familyId),
          where('startTime', '>=', startDate),
          where('completed', '==', true)
        );
        
        const snapshot = await getDocs(q);
        let totalScore = 0;
        let sessionCount = 0;
        let totalKudos = 0;
        
        snapshot.forEach(doc => {
          const session = doc.data();
          totalScore += session.score || 0;
          sessionCount++;
          totalKudos += session.kudosReceived?.length || 0;
        });
        
        leaderboard.push({
          userId: member.id,
          name: member.name,
          role: member.role,
          totalScore,
          sessionCount,
          totalKudos,
          averageScore: sessionCount > 0 ? Math.round(totalScore / sessionCount) : 0
        });
      }
      
      // Sort by total score
      leaderboard.sort((a, b) => b.totalScore - a.totalScore);
      
      // Add rankings
      for (let index = 0; index < leaderboard.length; index++) {
        const entry = leaderboard[index];
        entry.rank = index + 1;
        entry.trend = await this.calculateTrend(entry.userId, timeframe);
      }
      
      return leaderboard;
    } catch (error) {
      console.error('Error getting family leaderboard:', error);
      throw error;
    }
  }

  // Helper methods
  findFreeTimeSlots(events) {
    const slots = [];
    const dayStart = 6; // 6 AM
    const dayEnd = 22; // 10 PM
    
    // Group events by day
    const eventsByDay = {};
    events.forEach(event => {
      const date = new Date(event.start?.dateTime || event.dateTime);
      const dayKey = date.toDateString();
      if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
      eventsByDay[dayKey].push(event);
    });
    
    // Find free slots for each day
    Object.entries(eventsByDay).forEach(([dayKey, dayEvents]) => {
      // Sort events by start time
      dayEvents.sort((a, b) => {
        const aTime = new Date(a.start?.dateTime || a.dateTime);
        const bTime = new Date(b.start?.dateTime || b.dateTime);
        return aTime - bTime;
      });
      
      // Find gaps between events
      for (let i = 0; i < dayEvents.length - 1; i++) {
        const currentEnd = new Date(dayEvents[i].end?.dateTime || dayEvents[i].dateTime);
        const nextStart = new Date(dayEvents[i + 1].start?.dateTime || dayEvents[i + 1].dateTime);
        
        const gapMinutes = (nextStart - currentEnd) / (1000 * 60);
        if (gapMinutes >= 10) { // At least 10 minutes free
          slots.push({
            start: currentEnd,
            end: nextStart,
            duration: gapMinutes,
            dayOfWeek: currentEnd.getDay(),
            hourOfDay: currentEnd.getHours()
          });
        }
      }
    });
    
    return slots;
  }

  analyzeOptimalTimes(freeSlots, successfulPractices) {
    const timeScores = {};
    
    // Score each hour of day based on free slots
    freeSlots.forEach(slot => {
      const hour = slot.hourOfDay;
      if (!timeScores[hour]) timeScores[hour] = { score: 0, count: 0 };
      timeScores[hour].score += slot.duration;
      timeScores[hour].count++;
    });
    
    // Boost scores based on successful practices
    successfulPractices.forEach(practice => {
      const hour = new Date(practice.timestamp).getHours();
      if (!timeScores[hour]) timeScores[hour] = { score: 0, count: 0 };
      timeScores[hour].score += practice.sessionQuality * 10;
      timeScores[hour].count++;
    });
    
    // Convert to sorted array of optimal times
    const optimalTimes = Object.entries(timeScores)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        score: data.score / Math.max(data.count, 1),
        label: `${hour}:00`,
        contextTrigger: this.getContextTrigger(parseInt(hour))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 times
    
    return optimalTimes;
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  selectMusicGenre(settings, timeOfDay) {
    const energyLevel = settings.musicPreferences.energyLevels[timeOfDay];
    const template = this.sessionTemplates[timeOfDay];
    const genres = settings.musicPreferences.customPlaylists.length > 0
      ? settings.musicPreferences.preferredGenres
      : template.musicGenres;
    
    return genres[Math.floor(Math.random() * genres.length)];
  }

  selectPrompt(template, habitId) {
    // Could be enhanced with habit-specific prompts
    const prompts = template.prompts;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  async getWeatherMood() {
    // Placeholder - would integrate with weather API
    const moods = ['sunny', 'cloudy', 'rainy', 'calm'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  async generateVoiceGuidance(habitId, session, familyId) {
    const prompt = `
      Create a brief, encouraging voice guidance script for a ${session.plannedDuration}-second habit practice session.
      
      Habit ID: ${habitId}
      Energy Level: ${session.energy}
      Time of Day: ${this.getTimeOfDay()}
      Session Prompt: ${session.prompt}
      
      Guidelines:
      1. Start with the session prompt
      2. Include 2-3 gentle reminders or encouragements
      3. End with a positive affirmation
      4. Keep it under 100 words
      5. Match the energy level (${session.energy})
      
      Format as a simple script with timing markers.
    `;
    
    try {
      const response = await ClaudeService.sendMessage(prompt, 'dj_voice_guidance');
      return this.parseVoiceGuidance(response);
    } catch (error) {
      // Fallback guidance
      return [
        { time: 0, text: session.prompt },
        { time: session.plannedDuration / 2, text: "You're doing great! Keep it up!" },
        { time: session.plannedDuration - 10, text: "Almost there! Finish strong!" }
      ];
    }
  }

  parseVoiceGuidance(response) {
    // Parse Claude's response into timed segments
    const lines = response.split('\n').filter(line => line.trim());
    const guidance = [];
    
    lines.forEach(line => {
      const match = line.match(/\[(\d+)s?\]\s*(.+)/);
      if (match) {
        guidance.push({
          time: parseInt(match[1]),
          text: match[2]
        });
      }
    });
    
    return guidance.length > 0 ? guidance : [
      { time: 0, text: "Let's begin!" },
      { time: 60, text: "Keep going!" },
      { time: 120, text: "Great job!" }
    ];
  }

  async getMusicUrl(genre, duration) {
    // Placeholder - would integrate with Spotify API or music service
    // For now, return a genre-based placeholder
    const musicUrls = {
      'upbeat pop': '/audio/upbeat-pop-sample.mp3',
      'motivational': '/audio/motivational-sample.mp3',
      'morning jazz': '/audio/morning-jazz-sample.mp3',
      'indie': '/audio/indie-sample.mp3',
      'acoustic': '/audio/acoustic-sample.mp3',
      'chill beats': '/audio/chill-beats-sample.mp3',
      'ambient': '/audio/ambient-sample.mp3',
      'classical': '/audio/classical-sample.mp3',
      'lo-fi': '/audio/lofi-sample.mp3'
    };
    
    return musicUrls[genre] || musicUrls['chill beats'];
  }

  getVisualizations(energy) {
    const visualizations = {
      'energetic': {
        backgroundColor: '#FEF3C7',
        waveColor: '#F59E0B',
        particleCount: 50,
        animationSpeed: 'fast'
      },
      'moderate': {
        backgroundColor: '#DBEAFE',
        waveColor: '#3B82F6',
        particleCount: 30,
        animationSpeed: 'medium'
      },
      'calm': {
        backgroundColor: '#EDE9FE',
        waveColor: '#8B5CF6',
        particleCount: 20,
        animationSpeed: 'slow'
      }
    };
    
    return visualizations[energy] || visualizations['moderate'];
  }

  async notifyFamilyForKudos(session, familyId, userId) {
    // TODO: Implement family notification system
    // For now, we'll skip notifications to avoid errors
    try {
      const message = `🎵 ${session.prompt} Someone in your family just started a habit practice! Send them some kudos to boost their energy!`;
      
      // In the future, this should send notifications to family members
      // await NotificationService.notifyFamily(familyId, message, { excludeUser: userId });
      
      console.log('Family notification:', message);
    } catch (error) {
      console.warn('Error sending family notification:', error);
    }
  }

  async createSessionCalendarEvent(session, habitId, userId, familyId) {
    try {
      await CalendarService.addEvent({
        title: `🎵 Habit DJ Session - ${session.prompt}`,
        eventType: 'habit-dj-session',
        start: { dateTime: session.startTime },
        duration: Math.ceil(session.plannedDuration / 60), // Convert to minutes
        metadata: {
          sessionId: session.sessionId,
          habitId,
          djSession: true
        }
      }, userId, familyId);
    } catch (error) {
      console.warn('Failed to create calendar event for DJ session:', error);
      // Continue without calendar event - don't block the session
    }
  }

  async getUserDJSettings(userId) {
    const settingsRef = doc(db, 'users', userId, 'habitDJSettings', 'config');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      // Initialize if doesn't exist
      return await this.initializeDJSettings(userId);
    }
    
    return settingsDoc.data();
  }

  async updatePracticeHistory(userId, practiceData) {
    const historyRef = collection(db, 'users', userId, 'habitDJSettings', 'config', 'practiceHistory');
    await addDoc(historyRef, {
      ...practiceData,
      createdAt: serverTimestamp()
    });
  }

  async updateAdaptiveSettings(userId, session, quality, completionRate) {
    const settingsRef = doc(db, 'users', userId, 'habitDJSettings', 'config');
    const settings = await this.getUserDJSettings(userId);
    
    // Adjust difficulty based on performance
    let newDifficulty = settings.adaptiveSettings.currentDifficulty;
    if (quality >= 4 && completionRate >= 0.9) {
      newDifficulty = Math.min(10, newDifficulty + 0.5);
    } else if (quality <= 2 || completionRate < 0.5) {
      newDifficulty = Math.max(1, newDifficulty - 0.5);
    }
    
    // Adjust session length preference
    let newLength = settings.adaptiveSettings.preferredSessionLength;
    if (completionRate > 1.1) { // Went over time
      newLength = Math.min(600, newLength + 30); // Max 10 minutes
    } else if (completionRate < 0.8) {
      newLength = Math.max(30, newLength - 30); // Min 30 seconds
    }
    
    await updateDoc(settingsRef, {
      'adaptiveSettings.currentDifficulty': newDifficulty,
      'adaptiveSettings.preferredSessionLength': newLength,
      'adaptiveSettings.lastOptimization': serverTimestamp()
    });
  }

  async createCelebrationMoment(session, score) {
    const celebrationTypes = [
      { min: 80, type: 'excellent', emoji: '🎆' },
      { min: 60, type: 'great', emoji: '🎉' },
      { min: 40, type: 'good', emoji: '✨' }
    ];
    
    const celebration = celebrationTypes.find(c => score >= c.min) || celebrationTypes[2];
    
    try {
      await CalendarService.addEvent({
        title: `${celebration.emoji} Habit DJ Achievement!`,
        summary: `Scored ${score} points in a ${session.energy} session!`,
        eventType: 'habit-celebration',
        start: { dateTime: new Date() },
        duration: 1,
        metadata: {
          sessionId: session.sessionId,
          score,
          celebrationType: celebration.type
        }
      }, session.userId, session.familyId);
    } catch (error) {
      console.warn('Failed to create celebration event:', error);
      // Continue without calendar event
    }
  }

  async checkSessionAchievements(session, score) {
    const achievements = [];
    
    if (score >= 90) achievements.push('perfect_session');
    if (session.kudosReceived.length >= 3) achievements.push('crowd_favorite');
    if (session.actualDuration === session.plannedDuration) achievements.push('time_master');
    if (session.energy === 'energetic' && session.sessionQuality >= 4) achievements.push('energy_burst');
    
    return achievements;
  }

  async suggestNextPracticeTime(userId, habitId) {
    const optimalTimes = await this.learnOptimalTimes(userId, habitId);
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next optimal time
    let nextTime = optimalTimes.find(t => t.hour > currentHour);
    if (!nextTime && optimalTimes.length > 0) {
      // If no time today, use first time tomorrow
      nextTime = optimalTimes[0];
      now.setDate(now.getDate() + 1);
    }
    
    if (nextTime) {
      now.setHours(nextTime.hour, 0, 0, 0);
      return {
        time: now,
        contextTrigger: nextTime.contextTrigger,
        confidence: nextTime.score / 100
      };
    }
    
    return null;
  }

  getContextTrigger(hour) {
    if (hour >= 6 && hour < 9) return 'after_breakfast';
    if (hour >= 11 && hour < 13) return 'during_lunch_break';
    if (hour >= 14 && hour < 16) return 'before_school_pickup';
    if (hour >= 17 && hour < 19) return 'before_dinner_prep';
    if (hour >= 20 && hour < 22) return 'after_kids_bedtime';
    return 'flexible_time';
  }

  async sendRealtimeKudos(toUserId, fromUserId, emoji) {
    // This would integrate with a WebSocket service for real-time updates
    // For now, we'll use Allie to send a notification
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserName = fromUserDoc.exists() ? fromUserDoc.data().displayName : 'A family member';
    
    await AllieAIService.sendDirectMessage(toUserId, {
      type: 'kudos_received',
      content: `${emoji} ${fromUserName} just sent you kudos for your habit practice!`,
      priority: 'high'
    });
  }

  async calculateTrend(userId, timeframe) {
    // Calculate if user's performance is trending up or down
    // This is a simplified version - would be more sophisticated in production
    return Math.random() > 0.5 ? 'up' : 'down';
  }
  
  // Get today's sessions for a user
  async getTodaysSessions(userId, familyId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sessionsRef = collection(db, 'djSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        where('familyId', '==', familyId),
        where('startTime', '>=', today)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting today\'s sessions:', error);
      return [];
    }
  }
}

// Export singleton instance
const habitDJService = new HabitDJService();
export default habitDJService;