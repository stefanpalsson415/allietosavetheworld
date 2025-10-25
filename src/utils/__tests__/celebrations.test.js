/**
 * celebrations.test.js
 *
 * Tests for celebration utilities
 */

import {
  triggerCelebration,
  celebrateScoreImprovement,
  celebratePlanSelection,
  celebratePaymentSuccess,
  celebrateAchievement,
  showAchievement,
  getTriggeredAchievements,
  ACHIEVEMENTS
} from '../celebrations';
import confetti from 'canvas-confetti';

jest.mock('canvas-confetti');

describe('Celebrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any created badges
    document.body.innerHTML = '';
  });

  describe('triggerCelebration', () => {
    it('should trigger low level celebration', () => {
      triggerCelebration('low');

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 50,
          angle: 90,
          spread: 45
        })
      );
    });

    it('should trigger medium level celebration with animation', () => {
      jest.useFakeTimers();

      triggerCelebration('medium');

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should trigger high level celebration', () => {
      jest.useFakeTimers();

      triggerCelebration('high');

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should trigger max level celebration', () => {
      jest.useFakeTimers();

      triggerCelebration('max');

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should default to medium if no level specified', () => {
      triggerCelebration();

      expect(confetti).toHaveBeenCalled();
    });
  });

  describe('celebrateScoreImprovement', () => {
    it('should trigger max celebration for score >= 95', () => {
      jest.useFakeTimers();

      celebrateScoreImprovement(95);

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should trigger high celebration for score >= 85', () => {
      jest.useFakeTimers();

      celebrateScoreImprovement(85);

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should trigger medium celebration for score >= 70', () => {
      jest.useFakeTimers();

      celebrateScoreImprovement(70);

      expect(confetti).toHaveBeenCalled();

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should trigger low celebration for score >= 50', () => {
      celebrateScoreImprovement(50);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 50
        })
      );
    });

    it('should not celebrate for score < 50', () => {
      celebrateScoreImprovement(45);

      expect(confetti).not.toHaveBeenCalled();
    });
  });

  describe('celebratePlanSelection', () => {
    it('should celebrate usage-based plan with purple/blue theme', () => {
      celebratePlanSelection('usage-based');

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: expect.arrayContaining(['#6366f1', '#8b5cf6'])
        })
      );
    });

    it('should celebrate monthly plan with blue theme', () => {
      celebratePlanSelection('monthly');

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: expect.arrayContaining(['#3b82f6'])
        })
      );
    });

    it('should celebrate annual plan with green theme', () => {
      celebratePlanSelection('annual');

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 120,
          colors: expect.arrayContaining(['#10b981'])
        })
      );
    });
  });

  describe('celebratePaymentSuccess', () => {
    it('should trigger confetti for successful payment', () => {
      celebratePaymentSuccess();

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 150,
          spread: 100,
          colors: expect.arrayContaining(['#10b981'])
        })
      );
    });
  });

  describe('showAchievement', () => {
    it('should return achievement data', () => {
      const achievement = showAchievement('FIRST_SCORE');

      expect(achievement).toMatchObject({
        title: 'First Family Balance Score!',
        message: expect.any(String),
        icon: '🎯',
        timestamp: expect.any(Date)
      });
    });

    it('should interpolate custom data into message', () => {
      const achievement = showAchievement('LOW_CHARGE', { amount: '$5' });

      expect(achievement.message).toContain('$5');
    });

    it('should return null for unknown achievement', () => {
      const achievement = showAchievement('UNKNOWN');

      expect(achievement).toBeNull();
    });
  });

  describe('getTriggeredAchievements', () => {
    it('should return FIRST_SCORE for new families', () => {
      const achievements = getTriggeredAchievements(60, 0, 0);

      expect(achievements).toContain('FIRST_SCORE');
    });

    it('should return score threshold achievements', () => {
      const achievements = getTriggeredAchievements(95, 80, 15);

      expect(achievements).toContain('SCORE_95');
    });

    it('should return improvement milestones', () => {
      const achievements = getTriggeredAchievements(80, 50, 30);

      expect(achievements).toContain('IMPROVEMENT_30');
    });

    it('should return NO_CHARGE for negative improvement', () => {
      const achievements = getTriggeredAchievements(40, 60, -20);

      expect(achievements).toContain('NO_CHARGE');
    });

    it('should return MAX_VALUE for improvement >= 50', () => {
      const achievements = getTriggeredAchievements(100, 40, 60);

      expect(achievements).toContain('MAX_VALUE');
    });

    it('should return LOW_CHARGE for improvement <= 5', () => {
      const achievements = getTriggeredAchievements(65, 60, 5);

      expect(achievements).toContain('LOW_CHARGE');
    });

    it('should not return duplicate achievements', () => {
      const achievements = getTriggeredAchievements(75, 65, 10);

      const unique = new Set(achievements);
      expect(achievements.length).toBe(unique.size);
    });
  });

  describe('celebrateAchievement', () => {
    it('should trigger confetti and show badge', () => {
      jest.useFakeTimers();

      celebrateAchievement('SCORE_80');

      expect(confetti).toHaveBeenCalled();

      // Check badge was created
      const badge = document.querySelector('.achievement-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Highly Balanced!');

      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('should auto-remove badge after 5 seconds', () => {
      jest.useFakeTimers();

      celebrateAchievement('IMPROVEMENT_10');

      expect(document.querySelector('.achievement-badge')).toBeTruthy();

      jest.advanceTimersByTime(5000);

      // Badge should have fade-out class
      const badge = document.querySelector('.achievement-badge');
      expect(badge?.classList.contains('animate-slide-out-right')).toBe(true);

      jest.useRealTimers();
    });

    it('should allow manual badge close', () => {
      celebrateAchievement('BASELINE_SET');

      const badge = document.querySelector('.achievement-badge');
      const closeBtn = badge.querySelector('button');

      expect(closeBtn).toBeTruthy();

      closeBtn.click();

      expect(badge.classList.contains('animate-slide-out-right')).toBe(true);
    });
  });

  describe('ACHIEVEMENTS constant', () => {
    it('should have all required achievements', () => {
      expect(ACHIEVEMENTS).toHaveProperty('FIRST_SCORE');
      expect(ACHIEVEMENTS).toHaveProperty('BASELINE_SET');
      expect(ACHIEVEMENTS).toHaveProperty('SCORE_70');
      expect(ACHIEVEMENTS).toHaveProperty('SCORE_80');
      expect(ACHIEVEMENTS).toHaveProperty('SCORE_90');
      expect(ACHIEVEMENTS).toHaveProperty('SCORE_95');
      expect(ACHIEVEMENTS).toHaveProperty('IMPROVEMENT_10');
      expect(ACHIEVEMENTS).toHaveProperty('IMPROVEMENT_20');
      expect(ACHIEVEMENTS).toHaveProperty('IMPROVEMENT_30');
      expect(ACHIEVEMENTS).toHaveProperty('LOW_CHARGE');
      expect(ACHIEVEMENTS).toHaveProperty('NO_CHARGE');
      expect(ACHIEVEMENTS).toHaveProperty('MAX_VALUE');
    });

    it('should have valid structure for each achievement', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('title');
        expect(achievement).toHaveProperty('message');
        expect(achievement).toHaveProperty('icon');
        expect(typeof achievement.title).toBe('string');
        expect(typeof achievement.message).toBe('string');
        expect(typeof achievement.icon).toBe('string');
      });
    });
  });
});
