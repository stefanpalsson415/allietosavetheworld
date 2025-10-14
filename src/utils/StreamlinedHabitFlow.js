// Atomic Habits Framework - 4 Laws for Building Good Habits (or Breaking Bad Ones)
// Based on James Clear's Atomic Habits methodology

export const StreamlinedHabitFlow = {
  // Step 1: Make it Obvious (Cue)
  'obvious': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Great choice! Let's build your habit "${habitContext.title}" using the proven framework from Atomic Habits. 🎯

**Framework for Building Good Habits (or Breaking Bad Ones):**

**1. Make it Obvious (Cue)**
Design your environment so the habit is impossible to miss. Put your gym clothes out the night before. Place your vitamins next to your coffee maker. The idea is to create clear visual cues that trigger the behavior automatically.

**2. Make it Attractive (Craving)**
Bundle the habit with something you enjoy or join a culture where the behavior is normal. Listen to your favorite podcast only while exercising. Find a study group if you want to read more. You need to actually want to do the habit.

**3. Make it Easy (Response)**
Reduce friction and start incredibly small. Don't commit to reading a book - commit to reading one page. Don't plan a 1-hour workout - start with 2 minutes. The easier it is to start, the more likely you'll actually do it.

**4. Make it Satisfying (Reward)**
Give yourself an immediate reward when you complete the habit. Check off the habit in a tracker. Give yourself a small celebration. Put a dollar in a jar for something you want. The key is making the completion feel good right away, not just eventually.

_To break bad habits, simply reverse these: Make it Invisible (remove cues), Make it Unattractive (reframe your mindset), Make it Difficult (add friction), and Make it Unsatisfying (add immediate consequences)._

---

**Let's start with Law #1: Make it Obvious**

What visual cue will remind you to do "${habitContext.title}"?`,
        suggestions: [
          {
            id: 'visual-item',
            text: '📍 Put items where I\'ll see them',
            value: 'Place habit-related items in my line of sight'
          },
          {
            id: 'sticky-note',
            text: '📝 Sticky note on mirror',
            value: 'Put a sticky note reminder on the bathroom mirror'
          },
          {
            id: 'designated-spot',
            text: '📦 Create designated spot',
            value: 'Set up a dedicated spot for this habit'
          }
        ],
        suggestionPrompt: 'Choose or describe your visual cue:'
      };
    },
    processAnswer(answer) {
      return {
        obvious: {
          cue: answer,
          when_where: '' // Will be filled in later if needed
        }
      };
    }
  },

  // Step 2: Make it Attractive (Craving)
  'attractive': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Perfect! "${answers.obvious?.cue}" will be your visual trigger. 👁️

**Law #2: Make it Attractive**

How will you make "${habitContext.title}" something you actually WANT to do?

Think about:
• Pairing it with something you enjoy
• Joining others who do this habit
• Reframing your mindset about it

What will make this habit enjoyable or appealing?`,
        suggestions: [
          {
            id: 'pair-enjoy',
            text: '🎵 Pair with something I enjoy',
            value: 'Listen to my favorite music or podcast while doing it'
          },
          {
            id: 'social',
            text: '👥 Make it social',
            value: 'Do it with family or friends'
          },
          {
            id: 'reframe',
            text: '🧠 Reframe my mindset',
            value: 'Think of it as "me time" or self-care'
          }
        ],
        suggestionPrompt: 'Choose or describe what makes it attractive:'
      };
    },
    processAnswer(answer) {
      return {
        attractive: answer
      };
    }
  },

  // Step 3: Make it Easy (Response)
  'easy': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Love it! "${answers.attractive}" will make this enjoyable. 🌟

**Law #3: Make it Easy**

Start incredibly small. The easier it is to start, the more likely you'll actually do it.

What's the absolute smallest version of "${habitContext.title}" you can do?

Examples:
• Don't plan to read a book → Read 1 page
• Don't commit to 1-hour workout → Do 2 minutes
• Don't vow to "organize everything" → Organize 1 drawer

What's your 2-minute version?`,
        suggestions: [
          {
            id: 'tiny-version',
            text: '⚡ Tiniest possible version',
            value: 'Just 2 minutes of the habit'
          },
          {
            id: 'one-step',
            text: '👣 Just the first step',
            value: 'Do only the very first step'
          },
          {
            id: 'prep-only',
            text: '🎯 Preparation only',
            value: 'Just prepare the materials/space'
          }
        ],
        suggestionPrompt: 'Choose or describe your tiny version:'
      };
    },
    processAnswer(answer) {
      return {
        easy: {
          twoMinute: answer,
          duration: 2 // Default to 2 minutes
        }
      };
    }
  },

  // Step 4: Make it Satisfying (Reward)
  'satisfying': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Perfect! Starting with "${answers.easy?.twoMinute}" makes it impossible to skip. 🚀

**Law #4: Make it Satisfying**

Give yourself an immediate reward when you complete the habit. The key is making it feel good RIGHT NOW, not eventually.

How will you celebrate completing "${habitContext.title}"?

Examples:
• Check it off in a tracker (feels great!)
• Give yourself a small treat
• Put a dollar in a "reward jar"
• Do a victory dance
• Tell someone what you did

What immediate reward will you give yourself?`,
        suggestions: [
          {
            id: 'check-off',
            text: '✅ Check it off a tracker',
            value: 'Check it off in my habit tracker'
          },
          {
            id: 'visual-progress',
            text: '📊 Mark visual progress',
            value: 'Add a sticker or mark on my progress chart'
          },
          {
            id: 'celebrate',
            text: '🎉 Small celebration',
            value: 'Do a mini celebration or fist pump'
          },
          {
            id: 'reward-jar',
            text: '💰 Dollar in reward jar',
            value: 'Put a dollar in my reward jar'
          }
        ],
        suggestionPrompt: 'Choose or describe your immediate reward:',
        isFinalStep: false // Not final - still need schedule
      };
    },
    processAnswer(answer) {
      const rewards = [];
      const lower = answer.toLowerCase();

      if (lower.includes('check') || lower.includes('tracker')) rewards.push('check_off');
      if (lower.includes('visual') || lower.includes('chart') || lower.includes('sticker')) rewards.push('progress_visual');
      if (lower.includes('celebrat') || lower.includes('fist') || lower.includes('dance')) rewards.push('celebrate');
      if (lower.includes('jar') || lower.includes('dollar') || lower.includes('money')) rewards.push('reward_jar');

      if (rewards.length === 0) rewards.push('check_off'); // Default

      return {
        satisfying: rewards,
        satisfying_custom: answer
      };
    }
  },

  // Step 5: Schedule (when to do it)
  'schedule': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Excellent! Your immediate reward will keep you motivated. 🎉

**Now let's schedule it:**

When will you do this habit? Be specific!

Examples:
• "After morning coffee"
• "Before bed"
• "Right after work at 6 PM"

What time works best for you?`,
        suggestions: [
          {
            id: 'morning',
            text: '☀️ Morning (7-9 AM)',
            value: 'Every morning at 8:00 AM'
          },
          {
            id: 'evening',
            text: '🌙 Evening (7-9 PM)',
            value: 'Every evening at 8:00 PM'
          },
          {
            id: 'after-anchor',
            text: '⚓ After existing habit',
            value: 'Right after my morning coffee'
          }
        ],
        suggestionPrompt: 'Choose or type your schedule:'
      };
    },
    processAnswer(answer) {
      const lower = answer.toLowerCase();
      let frequency = 'daily';
      let time = '9:00 AM';
      let days = [0,1,2,3,4,5,6]; // All days by default

      // Parse frequency
      if (lower.includes('daily') || lower.includes('every day')) {
        frequency = 'daily';
      } else if (lower.includes('weekday')) {
        frequency = 'weekdays';
        days = [1,2,3,4,5];
      } else if (lower.includes('weekend')) {
        frequency = 'weekends';
        days = [0,6];
      }

      // Parse time
      const timeMatch = answer.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/i);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] || '00';
        const ampm = timeMatch[3]?.toUpperCase() || (hour < 12 ? 'AM' : 'PM');
        time = `${hour}:${minute} ${ampm}`;
      }

      return {
        schedule: {
          frequency,
          time,
          days,
          when_where: answer // Store the full answer for context
        }
      };
    }
  },

  // Step 6: Identity (final step)
  'identity': {
    async generateMessage(habitContext, answers = {}) {
      return {
        text: `Perfect! ${answers.schedule?.when_where || 'That timing'} will work great! ⏰

**Final Step: Your Identity** 💪

Complete this sentence: "I am someone who..."

This connects the habit to who you're becoming! Research shows that identity-based habits are more likely to stick.

Examples:
• "I am someone who takes care of my family's finances"
• "I am someone who prioritizes my health"
• "I am someone who shows up for my family"

What's your identity statement?`,
        suggestions: [
          {
            id: 'identity-1',
            text: `Someone who ${habitContext.title?.toLowerCase()}`,
            value: `I am someone who ${habitContext.title?.toLowerCase()}`
          },
          {
            id: 'identity-2',
            text: 'Committed to personal growth',
            value: 'I am someone who is committed to personal growth'
          },
          {
            id: 'identity-3',
            text: 'Building better habits',
            value: 'I am someone who builds better habits for my family'
          }
        ],
        suggestionPrompt: 'Choose or write your identity statement:',
        isFinalStep: true
      };
    },
    processAnswer(answer) {
      return {
        identity: answer,
        kidsHelp: true, // Default to allowing kids help
        visualization: 'mountain', // Default visualization
        enableSmsReminders: false // Default no SMS (can be enabled later)
      };
    }
  }
};

// Helper to get next step
export const getNextStep = (currentStep) => {
  const steps = [
    'obvious',
    'attractive',
    'easy',
    'satisfying',
    'schedule',
    'identity'
  ];

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === steps.length - 1) {
    return null; // No next step
  }
  return steps[currentIndex + 1];
};

// Helper to check if setup is complete
export const isSetupComplete = (currentStep) => {
  return currentStep === 'identity';
};