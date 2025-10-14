// HabitSetupFlow.jsx - Conversational habit setup using Four Laws
import React, { useState } from 'react';
import HabitService2 from '../../services/HabitService2';

const HabitSetupFlow = () => {
  const habitSetupQuestions = {
    // Step 1: Make it Obvious - Design your environment so you can't miss it
    obvious: {
      id: 'obvious',
      text: "Let's make your habit OBVIOUS! 🔍\n\nDesign your environment so you can't miss this habit. Put cues where you'll see them.\n\nWhen and where will you practice this habit? (e.g., 'After morning coffee in the kitchen', 'Before kids' bedtime in living room')",
      type: 'freeform',
      placeholder: "Describe when and where...",
      followUp: {
        text: "What visual cues will remind you? Pick the ones that will work best:",
        type: 'multiselect',
        options: [
          { value: 'phone_alarm', label: '⏰ Phone alarm' },
          { value: 'calendar_reminder', label: '📅 Calendar notification' },
          { value: 'sticky_note', label: '📝 Sticky note in visible spot' },
          { value: 'prep_night_before', label: '🌙 Prep items night before' },
          { value: 'visual_cue', label: '👁️ Place items in plain sight' }
        ]
      }
    },

    // Step 2: Make it Attractive - Pair with something you enjoy
    attractive: {
      id: 'attractive',
      text: "Now let's make it ATTRACTIVE! 💝\n\nPair this habit with something you enjoy. You need to actually WANT to do it.\n\nWhat could make this habit feel like a treat?",
      type: 'freeform',
      placeholder: "What would make this enjoyable?",
      suggestions: [
        "🎵 Play my favorite music",
        "☕ Enjoy with coffee/tea",
        "🎙️ Listen to a podcast",
        "🏆 Turn into family game",
        "🌟 Create a cozy vibe"
      ]
    },

    // Step 3: Make it Easy - Start incredibly small
    easy: {
      id: 'easy',
      text: "Let's make it EASY! 🚀\n\nStart incredibly small. The easier it is to start, the more likely you'll do it.\n\nWhat's the absolute smallest version of this habit? If you only had 2 minutes, what would count as 'done'?",
      type: 'freeform',
      placeholder: "My 2-minute version is...",
      followUp: {
        text: "Perfect! How long do you want the full version to take?",
        type: 'select',
        options: [
          { value: 5, label: '5 minutes' },
          { value: 10, label: '10 minutes' },
          { value: 15, label: '15 minutes' },
          { value: 20, label: '20 minutes' },
          { value: 30, label: '30 minutes' }
        ]
      }
    },

    // Step 4: Make it Satisfying - Immediate reward
    satisfying: {
      id: 'satisfying',
      text: "Finally, let's make it SATISFYING! 🎉\n\nGive yourself an immediate reward right after completing it. The key is making it feel good NOW, not eventually.\n\nHow will you celebrate?",
      type: 'multiselect',
      options: [
        { value: 'check_off', label: '✅ Check it off' },
        { value: 'family_highfive', label: '🙌 Family high-five' },
        { value: 'progress_visual', label: '📊 See progress climb' },
        { value: 'share_win', label: '💬 Share the win' },
        { value: 'small_treat', label: '🍫 Small treat' },
        { value: 'victory_dance', label: '💃 Victory dance' },
        { value: 'custom', label: '✨ Something else...' }
      ]
    },

    // Step 5: Schedule
    schedule: {
      id: 'schedule',
      text: "When do you want to practice this habit? 📅 I'll add it to your family calendar.",
      type: 'schedule',
      subQuestions: {
        frequency: {
          text: "How often?",
          type: 'select',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekdays', label: 'Weekdays only' },
            { value: 'weekends', label: 'Weekends only' },
            { value: 'weekly', label: 'Once a week' },
            { value: 'custom', label: 'Custom days' }
          ]
        },
        time: {
          text: "What time of day?",
          type: 'time',
          placeholder: "e.g., 7:30 AM"
        },
        days: {
          text: "Which days?",
          type: 'multiselect',
          showIf: 'custom',
          options: [
            { value: 1, label: 'Mon' },
            { value: 2, label: 'Tue' },
            { value: 3, label: 'Wed' },
            { value: 4, label: 'Thu' },
            { value: 5, label: 'Fri' },
            { value: 6, label: 'Sat' },
            { value: 0, label: 'Sun' }
          ]
        }
      }
    },

    // Step 6: Identity
    identity: {
      id: 'identity',
      text: "This is powerful - let's connect this habit to your identity. Complete this sentence: 'I am someone who...'",
      type: 'freeform',
      placeholder: "I am someone who...",
      examples: [
        "...creates calm through evening planning",
        "...models healthy choices for my family",
        "...stays organized and prepared",
        "...prioritizes family connection",
        "...takes care of our home"
      ]
    },

    // Step 7: Kids Help
    kidsHelp: {
      id: 'kidsHelp',
      text: "Would you like your kids to be able to help with this habit? They'll earn 4 Palsson Bucks when they help! 🤝",
      type: 'select',
      options: [
        { value: true, label: 'Yes! Kids can help' },
        { value: false, label: 'No, this is just for me' }
      ]
    },

    // Step 8: Visualization - REMOVED: Now always uses mountain design by default
  };

  // Process the habit setup flow
  const processHabitSetup = async (habitData, answers, familyId, userId, userInfo = null) => {
    try {
      // Validate required data
      if (!habitData?.title) {
        throw new Error('Habit title is required');
      }
      
      // Parse the answers into the habit structure with defaults
      const scheduleFrequency = answers.schedule?.frequency || 'daily';
      let daysOfWeek = [1, 2, 3, 4, 5]; // Default weekdays
      
      if (scheduleFrequency === 'daily') {
        daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
      } else if (scheduleFrequency === 'weekends') {
        daysOfWeek = [0, 6];
      } else if (scheduleFrequency === 'weekly') {
        daysOfWeek = [new Date().getDay()]; // Current day
      } else if (scheduleFrequency === 'custom' && answers.schedule?.days) {
        daysOfWeek = answers.schedule.days;
      }

      const newHabit = {
        title: habitData.title,
        description: habitData.description,
        category: habitData.category,
        
        fourLaws: {
          obvious: [
            answers.obvious?.when_where || 'After morning routine',
            ...(answers.obvious?.cues || ['calendar_reminder']).map(cue => {
              const cueMap = {
                'phone_alarm': 'Phone alarm reminder',
                'calendar_reminder': 'Calendar notification',
                'sticky_note': 'Sticky note in visible location',
                'prep_night_before': 'Items prepared night before',
                'visual_cue': 'Visual cue in environment'
              };
              return cueMap[cue] || cue;
            })
          ],
          attractive: typeof answers.attractive === 'string' 
            ? answers.attractive.split(',').map(a => a.trim())
            : [answers.attractive || 'Making it enjoyable'],
          easy: [
            `2-min version: ${answers.easy?.twoMinute || 'Quick version'}`,
            `Full version: ${answers.easy?.duration || 10} minutes`
          ],
          satisfying: (Array.isArray(answers.satisfying) ? answers.satisfying : ['check_off']).map(reward => {
            const rewardMap = {
              'check_off': 'Check off completion',
              'family_highfive': 'Family high-five celebration',
              'progress_visual': 'Update progress visualization',
              'share_win': 'Share win with family',
              'small_treat': 'Enjoy small treat',
              'victory_dance': 'Victory dance',
              'custom': answers.satisfying_custom || 'Personal celebration'
            };
            return rewardMap[reward] || reward;
          })
        },
        
        identityStatement: answers.identity || `I am someone who ${habitData.title}`,
        twoMinuteVersion: answers.easy?.twoMinute || 'Quick 2-minute version',
        fullVersion: `${answers.easy?.duration || 10} minute practice`,
        
        schedule: {
          frequency: scheduleFrequency === 'weekdays' ? 'daily' : scheduleFrequency,
          daysOfWeek: daysOfWeek,
          timeOfDay: answers.schedule?.time || '9:00 AM',
          duration: parseInt(answers.easy?.duration || 10),
          reminder: answers.obvious?.cues?.includes('calendar_reminder') !== false,
          reminderMinutesBefore: 15
        },
        
        kidsCanHelp: answers.kidsHelp !== undefined ? answers.kidsHelp : true,
        visualizationType: 'mountain' // Always use mountain design
      };

      // Log the habit data before creation
      console.log('Creating habit with structure:', newHabit);
      
      // Create the habit
      const createdHabit = await HabitService2.createHabit(newHabit, familyId, userId, userInfo);
      
      return {
        success: true,
        habit: createdHabit,
        message: `🎉 Your habit "${habitData.title}" is all set up! I've added it to your calendar and created a beautiful mountain to track your 60-day journey. Your first session is scheduled for ${answers.schedule.time}. Remember: ${answers.identity}! 💪`
      };
    } catch (error) {
      console.error('Error creating habit:', error);
      console.error('Error details:', error.message);
      console.error('Habit data that failed:', { habitData, answers });
      return {
        success: false,
        message: `I had trouble setting up your habit: ${error.message}. Let me try again.`
      };
    }
  };

  return {
    questions: habitSetupQuestions,
    processHabitSetup
  };
};

export default HabitSetupFlow;