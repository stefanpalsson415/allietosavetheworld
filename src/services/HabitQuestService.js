// src/services/HabitQuestService.js
import { 
  doc, collection, getDoc, setDoc, updateDoc, 
  query, where, getDocs, serverTimestamp, 
  arrayUnion, increment 
} from 'firebase/firestore';
import { db } from './firebase';
import CalendarService from './CalendarService';
import AllieAIService from './AllieAIService';
import ClaudeService from './ClaudeService';
import HabitCyclesService from './HabitCyclesService';

class HabitQuestService {
  constructor() {
    this.questTemplates = {
      'morning-routine': {
        name: 'Dawn of Balance',
        theme: 'fantasy',
        chapters: [
          {
            day: 1,
            title: 'The Awakening',
            narrative: 'Your family begins their journey to morning mastery...'
          },
          {
            day: 3,
            title: 'First Light',
            narrative: 'The morning routine starts to feel natural...'
          },
          {
            day: 7,
            title: 'Rising Sun',
            narrative: 'A full week of consistent mornings achieved!'
          },
          {
            day: 14,
            title: 'Sunrise Warriors',
            narrative: 'Two weeks strong - the family rhythm is established!'
          },
          {
            day: 21,
            title: 'Masters of the Dawn',
            narrative: 'The morning routine is now a family superpower!'
          }
        ]
      },
      'evening-cleanup': {
        name: 'Twilight Transformation',
        theme: 'adventure',
        chapters: [
          {
            day: 1,
            title: 'Setting Sail',
            narrative: 'The family embarks on their evening cleanup adventure...'
          },
          {
            day: 3,
            title: 'Smooth Sailing',
            narrative: 'The cleanup routine begins to flow naturally...'
          },
          {
            day: 7,
            title: 'Captain\'s Pride',
            narrative: 'One week of tidy evenings - the ship runs smoothly!'
          },
          {
            day: 14,
            title: 'Master Navigators',
            narrative: 'Two weeks in - everyone knows their role perfectly!'
          },
          {
            day: 21,
            title: 'Legendary Crew',
            narrative: 'The evening cleanup is now second nature!'
          }
        ]
      },
      'planning': {
        name: 'The Planning Prophecy',
        theme: 'mystery',
        chapters: [
          {
            day: 1,
            title: 'The Map Appears',
            narrative: 'A magical map to family organization is discovered...'
          },
          {
            day: 3,
            title: 'Decoding Clues',
            narrative: 'The planning patterns start to reveal themselves...'
          },
          {
            day: 7,
            title: 'Hidden Treasures',
            narrative: 'A week of planning uncovers time treasures!'
          },
          {
            day: 14,
            title: 'Master Detectives',
            narrative: 'Two weeks - the family solves scheduling mysteries!'
          },
          {
            day: 21,
            title: 'Prophecy Fulfilled',
            narrative: 'Planning mastery achieved - the future is clear!'
          }
        ]
      }
    };
  }

  // Create a new quest for a habit
  async createHabitQuest(habitId, familyId) {
    try {
      // Get habit details
      const habit = await HabitCyclesService.getHabitById(habitId, familyId);
      if (!habit) throw new Error('Habit not found');

      // Determine quest template based on habit type
      const questType = this.determineQuestType(habit);
      const template = this.questTemplates[questType] || this.questTemplates['morning-routine'];

      // Generate personalized story with Claude
      const personalizedChapters = await this.generatePersonalizedStory(habit, template, familyId);
      
      // Generate character assets
      const characterAssets = await this.generateCharacterAssets(familyId);

      // Create quest document
      const questData = {
        questId: `quest_${habitId}_${Date.now()}`,
        habitId,
        familyId,
        questName: template.name,
        theme: template.theme,
        storyChapters: personalizedChapters.map((chapter, index) => ({
          chapterId: `chapter_${index + 1}`,
          ...chapter,
          unlocked: false,
          unlockedAt: null,
          visualAssets: {
            background: `/assets/quest-backgrounds/${template.theme}-${index + 1}.jpg`,
            characters: characterAssets,
            animations: [`/assets/animations/${template.theme}-celebration.json`]
          }
        })),
        powerUps: [],
        familyProgress: {
          currentChapter: 0,
          totalXP: 0,
          collectiveStreak: 0,
          achievements: []
        },
        participants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const questRef = doc(collection(db, 'families', familyId, 'habitQuests'), questData.questId);
      await setDoc(questRef, questData);

      // Create calendar events for milestones (wrapped to prevent errors)
      this.createQuestCalendarEvents(questData, habit, familyId).catch(err => 
        console.warn('Failed to create quest calendar events:', err)
      );

      // Notify Allie for announcement
      await this.notifyAllieQuestStart(questData, habit, familyId);

      return questData;
    } catch (error) {
      console.error('Error creating habit quest:', error);
      throw error;
    }
  }

  // Generate personalized story chapters using Claude
  async generatePersonalizedStory(habit, template, familyId) {
    try {
      const familyContext = await this.getFamilyContext(familyId);
      
      const prompt = `
        Create personalized quest chapter narratives for a family habit.
        
        Habit: ${habit.title}
        Description: ${habit.description}
        Family Members: ${familyContext.members.map(m => `${m.name} (${m.role})`).join(', ')}
        Theme: ${template.theme}
        
        Base chapters:
        ${JSON.stringify(template.chapters, null, 2)}
        
        Personalize each chapter narrative to:
        1. Include family member names
        2. Reference the specific habit activities
        3. Make it exciting for kids
        4. Keep it short (2-3 sentences)
        5. Build anticipation for the next chapter
        
        Return as JSON array with same structure as base chapters.
      `;

      const response = await ClaudeService.sendMessage(prompt, 'quest_generation');
      const chapters = this.parseClaudeResponse(response);
      
      return chapters.length > 0 ? chapters : template.chapters;
    } catch (error) {
      console.error('Error generating personalized story:', error);
      return template.chapters; // Fallback to template
    }
  }

  // Track habit completion and update quest progress
  async trackQuestProgress(habitId, userId, familyId, reflection = '') {
    try {
      // Find active quest for this habit
      const questsRef = collection(db, 'families', familyId, 'habitQuests');
      const q = query(questsRef, where('habitId', '==', habitId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const questDoc = snapshot.docs[0];
      const quest = questDoc.data();
      
      // Calculate XP earned
      const baseXP = 10;
      const bonusXP = reflection ? 5 : 0;
      const helperBonus = quest.powerUps.some(p => p.type === 'helper_boost' && p.active) ? 10 : 0;
      const totalXP = baseXP + bonusXP + helperBonus;
      
      // Update participant XP
      const participantIndex = quest.participants.findIndex(p => p.userId === userId);
      if (participantIndex === -1) {
        quest.participants.push({
          userId,
          role: 'parent', // Determine from family context
          xp: totalXP,
          contributions: 1
        });
      } else {
        quest.participants[participantIndex].xp += totalXP;
        quest.participants[participantIndex].contributions += 1;
      }
      
      // Update family progress
      quest.familyProgress.totalXP += totalXP;
      
      // Check for chapter unlocks
      const completions = quest.participants.reduce((sum, p) => sum + p.contributions, 0);
      const unlockableChapters = quest.storyChapters.filter(
        chapter => !chapter.unlocked && completions >= chapter.unlockDay
      );
      
      for (const chapter of unlockableChapters) {
        chapter.unlocked = true;
        chapter.unlockedAt = new Date();
        quest.familyProgress.currentChapter = quest.storyChapters.indexOf(chapter) + 1;
        
        // Create celebration event
        await this.createChapterUnlockEvent(quest, chapter, familyId);
        
        // Notify family
        await this.notifyChapterUnlock(quest, chapter, familyId);
      }
      
      // Check for achievements
      const newAchievements = await this.checkAchievements(quest, completions);
      quest.familyProgress.achievements.push(...newAchievements);
      
      // Update quest in Firestore
      quest.updatedAt = serverTimestamp();
      await updateDoc(questDoc.ref, quest);
      
      return {
        xpEarned: totalXP,
        newChapters: unlockableChapters,
        newAchievements,
        currentProgress: quest.familyProgress
      };
    } catch (error) {
      console.error('Error tracking quest progress:', error);
      throw error;
    }
  }

  // Grant power-up from child to parent
  async grantPowerUp(questId, type, grantedBy, familyId) {
    try {
      const questRef = doc(db, 'families', familyId, 'habitQuests', questId);
      const questDoc = await getDoc(questRef);
      
      if (!questDoc.exists()) throw new Error('Quest not found');
      
      const powerUp = {
        type,
        grantedBy,
        grantedAt: new Date(),
        active: true,
        usedAt: null
      };
      
      await updateDoc(questRef, {
        powerUps: arrayUnion(powerUp),
        updatedAt: serverTimestamp()
      });
      
      // Create calendar reminder
      await this.createPowerUpNotification(questDoc.data(), powerUp, familyId);
      
      return powerUp;
    } catch (error) {
      console.error('Error granting power-up:', error);
      throw error;
    }
  }

  // Start live family practice session
  async startLivePracticeSession(habitId, familyId, participants) {
    try {
      // Validate inputs
      if (!habitId || !familyId || !participants || participants.length === 0) {
        throw new Error('Missing required parameters for live practice session');
      }
      
      // Validate participants have required fields
      const validParticipants = participants.filter(p => p.userId && p.name);
      if (validParticipants.length === 0) {
        throw new Error('No valid participants found');
      }
      
      const sessionId = `session_${Date.now()}`;
      const now = new Date();
      const sessionData = {
        sessionId,
        habitId,
        familyId,
        participants: validParticipants.map(p => ({
          userId: p.userId,
          name: p.name || 'Anonymous',
          joinedAt: now, // Use Date object instead of serverTimestamp()
          status: 'active'
        })),
        startedAt: serverTimestamp(),
        endedAt: null,
        achievements: []
      };
      
      // Create session document
      const sessionRef = doc(collection(db, 'liveSessions'), sessionId);
      await setDoc(sessionRef, sessionData);
      
      // Create calendar event (wrapped to prevent errors)
      try {
        await CalendarService.addEvent({
          title: '🎮 Family Habit Practice - LIVE',
          eventType: 'family-practice-session',
          start: { dateTime: new Date() },
          duration: 10,
          attendees: validParticipants.map(p => p.userId),
          metadata: {
            sessionId,
            habitId,
            isLive: true
          }
        }, validParticipants[0].userId, familyId);
      } catch (error) {
        console.warn('Failed to create live session calendar event:', error);
        // Continue without calendar event
      }
      
      return sessionData;
    } catch (error) {
      console.error('Error starting live practice session:', error);
      throw error;
    }
  }

  // Helper methods
  determineQuestType(habit) {
    const title = habit.title.toLowerCase();
    if (title.includes('morning') || title.includes('breakfast')) return 'morning-routine';
    if (title.includes('evening') || title.includes('cleanup') || title.includes('tidy')) return 'evening-cleanup';
    if (title.includes('planning') || title.includes('calendar')) return 'planning';
    return 'morning-routine'; // default
  }

  async generateCharacterAssets(familyId) {
    // In a real implementation, this would generate or fetch custom avatars
    // For now, return placeholder paths
    return [
      '/assets/characters/parent-1.svg',
      '/assets/characters/parent-2.svg',
      '/assets/characters/child-1.svg',
      '/assets/characters/child-2.svg'
    ];
  }

  async getFamilyContext(familyId) {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    if (!familyDoc.exists()) throw new Error('Family not found');
    return familyDoc.data();
  }

  parseClaudeResponse(response) {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return [];
    }
  }

  async createQuestCalendarEvents(quest, habit, familyId) {
    const events = [];
    
    // Daily practice reminder
    events.push({
      title: `🎯 ${quest.questName} - Daily Practice`,
      eventType: 'habit-quest-practice',
      recurrence: { frequency: 'daily' },
      duration: habit.estimatedMinutes || 5,
      metadata: {
        questId: quest.questId,
        habitId: habit.id
      }
    });
    
    // Chapter unlock milestones
    quest.storyChapters.forEach(chapter => {
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + chapter.unlockDay);
      
      events.push({
        title: `🎉 ${quest.questName} - Chapter ${chapter.chapterId} Unlocks!`,
        eventType: 'habit-quest-milestone',
        start: { dateTime: unlockDate },
        duration: 30,
        metadata: {
          questId: quest.questId,
          chapterId: chapter.chapterId
        }
      });
    });
    
    // Add all events to calendar
    for (const event of events) {
      await CalendarService.addEvent(event, habit.assignedTo, familyId);
    }
  }

  async notifyAllieQuestStart(quest, habit, familyId) {
    const message = `🎮 Exciting news! The ${quest.questName} quest has begun for the "${habit.title}" habit. Chapter 1: "${quest.storyChapters[0].title}" is ready to explore!`;
    
    await AllieAIService.sendProactiveMessage(familyId, {
      type: 'quest_start',
      content: message,
      metadata: {
        questId: quest.questId,
        habitId: habit.id
      }
    });
  }

  async createChapterUnlockEvent(quest, chapter, familyId) {
    await CalendarService.addEvent({
      title: `🏆 ${quest.questName} - Chapter Unlocked!`,
      summary: chapter.narrative,
      eventType: 'habit-quest-milestone',
      start: { dateTime: new Date() },
      duration: 5,
      metadata: {
        questId: quest.questId,
        chapterId: chapter.chapterId,
        celebration: true
      }
    }, quest.participants[0]?.userId, familyId);
  }

  async notifyChapterUnlock(quest, chapter, familyId) {
    const message = `🎊 Amazing! Your family just unlocked Chapter ${chapter.chapterId}: "${chapter.title}"! ${chapter.narrative}`;
    
    await AllieAIService.sendProactiveMessage(familyId, {
      type: 'chapter_unlock',
      content: message,
      priority: 'high',
      metadata: {
        questId: quest.questId,
        chapterId: chapter.chapterId
      }
    });
  }

  async checkAchievements(quest, completions) {
    const achievements = [];
    
    if (completions === 3 && !quest.familyProgress.achievements.includes('first_milestone')) {
      achievements.push('first_milestone');
    }
    
    if (completions === 7 && !quest.familyProgress.achievements.includes('week_warrior')) {
      achievements.push('week_warrior');
    }
    
    if (quest.familyProgress.collectiveStreak >= 5 && !quest.familyProgress.achievements.includes('streak_master')) {
      achievements.push('streak_master');
    }
    
    if (quest.participants.length >= 3 && !quest.familyProgress.achievements.includes('full_party')) {
      achievements.push('full_party');
    }
    
    return achievements;
  }

  async createPowerUpNotification(quest, powerUp, familyId) {
    const grantorName = await this.getUserName(powerUp.grantedBy);
    const powerUpNames = {
      'streak_shield': '🛡️ Streak Shield',
      'double_xp': '⚡ Double XP',
      'helper_boost': '🤝 Helper Boost'
    };
    
    await CalendarService.addEvent({
      title: `${powerUpNames[powerUp.type]} activated by ${grantorName}!`,
      eventType: 'habit-quest-powerup',
      start: { dateTime: new Date() },
      duration: 1,
      metadata: {
        questId: quest.questId,
        powerUpType: powerUp.type
      }
    }, quest.participants[0]?.userId, familyId);
  }

  async getUserName(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data().displayName || 'Family Member' : 'Family Member';
    } catch (error) {
      return 'Family Member';
    }
  }
  
  // Get all active quests for a family
  async getActiveQuests(familyId) {
    try {
      const questsRef = collection(db, 'families', familyId, 'habitQuests');
      const snapshot = await getDocs(questsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active quests:', error);
      return [];
    }
  }
}

// Export singleton instance
const habitQuestService = new HabitQuestService();
export default habitQuestService;