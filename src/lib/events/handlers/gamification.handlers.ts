/**
 * @module events/handlers/gamification
 * @description Gamification event handlers for the ZarinGold platform.
 *
 * Handles the gamification system including:
 * - Daily check-ins and streak tracking
 * - XP earning and spending
 * - Level progression
 * - Achievement unlocking
 * - Quest management
 * - Leaderboard updates
 * - Price predictions
 */

import type { EventEnvelope, EventHandlerRegistration } from '../types';
import { GAMIFICATION_EVENTS } from '../types';

// ─── Handler: Daily Check-in ─────────────────────────────────────────────────

/**
 * Process a daily check-in.
 * Awards base XP, checks streak bonuses, and updates leaderboard.
 */
export async function handleCheckinPerformed(event: EventEnvelope): Promise<void> {
  const { userId, streakDay, bonusMultiplier } = event.data as {
    userId: string;
    streakDay: number;
    bonusMultiplier: number;
  };

  const baseXP = 5;
  const totalXP = Math.floor(baseXP * bonusMultiplier);

  console.log(
    `[Gamification] Check-in: user=${userId}, day=${streakDay}, ` +
    `XP=${totalXP} (${baseXP}x${bonusMultiplier})`,
  );

  // TODO: Integrate with gamification system
  // 1. Create CheckinRecord
  // 2. Award XP
  // 3. Update streak counter
  // 4. Check streak achievements (3-day, 7-day, 30-day, etc.)
}

/**
 * Update a check-in streak.
 */
export async function handleCheckinStreakUpdated(event: EventEnvelope): Promise<void> {
  const { userId, newStreak, previousStreak, broken } = event.data as {
    userId: string;
    newStreak: number;
    previousStreak: number;
    broken: boolean;
  };

  console.log(
    `[Gamification] Streak updated: user=${userId}, ${previousStreak} → ${newStreak}` +
    (broken ? ' (broken!)' : ''),
  );

  if (broken) {
    console.log(`[Gamification] User ${userId} lost their ${previousStreak}-day streak`);
  }
}

// ─── Handler: XP System ──────────────────────────────────────────────────────

/**
 * Award XP to a user.
 * Checks for level-up after XP is added.
 */
export async function handleXPEarned(event: EventEnvelope): Promise<void> {
  const { userId, amount, source, reason, newXPTotal } = event.data as {
    userId: string;
    amount: number;
    source: string;
    reason: string;
    newXPTotal: number;
  };

  console.log(
    `[Gamification] XP earned: user=${userId}, +${amount} XP (${source}: ${reason}), ` +
    `total=${newXPTotal}`,
  );

  // TODO: Check if user leveled up
  // 1. Get current level thresholds
  // 2. Compare newXPTotal against thresholds
  // 3. If crossed threshold, publish GAMIFICATION_EVENTS.LEVEL_UP
}

/**
 * Handle XP spending.
 */
export async function handleXPSpent(event: EventEnvelope): Promise<void> {
  const { userId, amount, item, remainingXP } = event.data as {
    userId: string;
    amount: number;
    item: string;
    remainingXP: number;
  };

  console.log(
    `[Gamification] XP spent: user=${userId}, -${amount} XP for "${item}", ` +
    `remaining=${remainingXP}`,
  );
  // TODO: Check if level down is needed
}

// ─── Handler: Level System ───────────────────────────────────────────────────

/**
 * Handle a user leveling up.
 * Awards level-up bonus and checks for level-specific achievements.
 */
export async function handleLevelUp(event: EventEnvelope): Promise<void> {
  const { userId, oldLevel, newLevel, title, perks } = event.data as {
    userId: string;
    oldLevel: number;
    newLevel: number;
    title: string;
    perks?: string[];
  };

  console.log(
    `[Gamification] 🎉 Level up! user=${userId}, ${oldLevel} → ${newLevel} ` +
    `("${title}")`,
  );

  // TODO: Level up rewards
  // 1. Update user level in DB
  // 2. Send congratulation notification
  // 3. Award level-up bonus (gold, cashback multiplier, etc.)
  // 4. Check achievements tied to level milestones
  // 5. Update leaderboard
}

/**
 * Handle a level down (rare, from XP spending).
 */
export async function handleLevelDown(event: EventEnvelope): Promise<void> {
  const { userId, oldLevel, newLevel } = event.data as {
    userId: string;
    oldLevel: number;
    newLevel: number;
  };

  console.log(
    `[Gamification] Level down: user=${userId}, ${oldLevel} → ${newLevel}`,
  );
  // TODO: Update user level, revoke perks if needed
}

// ─── Handler: Achievements ───────────────────────────────────────────────────

/**
 * Handle an achievement unlock.
 * Awards achievement rewards and sends congratulation notification.
 */
export async function handleAchievementUnlocked(event: EventEnvelope): Promise<void> {
  const { userId, achievementId, name, description, icon, reward } = event.data as {
    userId: string;
    achievementId: string;
    name: string;
    description: string;
    icon: string;
    reward?: { type: string; amount: number };
  };

  console.log(
    `[Gamification] 🏆 Achievement unlocked: user=${userId}, "${name}" (${achievementId})`,
  );

  // TODO: Achievement unlock flow
  // 1. Create UserAchievement record
  // 2. Award reward (XP, gold, etc.)
  // 3. Send congratulation in-app notification
  // 4. Publish to social feed if public
  // 5. Check achievement chains
}

// ─── Handler: Quests ─────────────────────────────────────────────────────────

/**
 * Handle a quest start.
 */
export async function handleQuestStarted(event: EventEnvelope): Promise<void> {
  const { userId, questId, title, deadline } = event.data as {
    userId: string;
    questId: string;
    title: string;
    deadline?: string;
  };

  console.log(`[Gamification] Quest started: user=${userId}, "${title}" (${questId})`);
  // TODO: Create UserQuest record with status IN_PROGRESS
}

/**
 * Handle a quest completion.
 */
export async function handleQuestCompleted(event: EventEnvelope): Promise<void> {
  const { userId, questId, title, xpReward, goldReward } = event.data as {
    userId: string;
    questId: string;
    title: string;
    xpReward: number;
    goldReward?: number;
  };

  console.log(
    `[Gamification] Quest completed: user=${userId}, "${title}", ` +
    `XP=${xpReward}, gold=${goldReward ?? 0}`,
  );

  // TODO: Quest completion flow
  // 1. Update UserQuest status to COMPLETED
  // 2. Award rewards
  // 3. Notify user to claim rewards
}

/**
 * Handle quest reward claim.
 */
export async function handleQuestClaimed(event: EventEnvelope): Promise<void> {
  const { userId, questId, rewards } = event.data as {
    userId: string;
    questId: string;
    rewards: Array<{ type: string; amount: number }>;
  };

  console.log(
    `[Gamification] Quest claimed: user=${userId}, quest=${questId}, ` +
    `rewards=${rewards.map((r) => `${r.amount} ${r.type}`).join(', ')}`,
  );
  // TODO: Credit rewards to user
}

// ─── Handler: Leaderboard ────────────────────────────────────────────────────

/**
 * Handle a leaderboard update.
 * Recalculates and broadcasts leaderboard rankings.
 */
export async function handleLeaderboardUpdated(event: EventEnvelope): Promise<void> {
  const { leaderboardType, topUsers, updatedUser } = event.data as {
    leaderboardType: string;
    topUsers: Array<{ userId: string; rank: number; value: number }>;
    updatedUser?: { userId: string; oldRank: number; newRank: number };
  };

  console.log(
    `[Gamification] Leaderboard updated: type=${leaderboardType}, ` +
    `top=${topUsers.slice(0, 3).map((u) => `#${u.rank}`).join(', ')}`,
  );

  if (updatedUser && updatedUser.newRank < updatedUser.oldRank) {
    console.log(
      `[Gamification] ${updatedUser.userId} climbed from #${updatedUser.oldRank} ` +
      `to #${updatedUser.newRank}`,
    );
  }

  // TODO: Broadcast leaderboard via WebSocket
}

// ─── Handler: Price Predictions ──────────────────────────────────────────────

/**
 * Handle a prediction submission.
 */
export async function handlePredictionSubmitted(event: EventEnvelope): Promise<void> {
  const { userId, goldType, predictedPrice, confidence, deadline } = event.data as {
    userId: string;
    goldType: string;
    predictedPrice: number;
    confidence: number;
    deadline: string;
  };

  console.log(
    `[Gamification] Prediction submitted: user=${userId}, ${goldType} → ${predictedPrice} ` +
    `(confidence: ${confidence}%, deadline: ${deadline})`,
  );
  // TODO: Create prediction record
}

/**
 * Handle prediction resolution.
 */
export async function handlePredictionResolved(event: EventEnvelope): Promise<void> {
  const { predictionId, userId, predictedPrice, actualPrice, correct, xpEarned } = event.data as {
    predictionId: string;
    userId: string;
    predictedPrice: number;
    actualPrice: number;
    correct: boolean;
    xpEarned: number;
  };

  const accuracy = Math.abs(1 - Math.abs(predictedPrice - actualPrice) / actualPrice) * 100;

  console.log(
    `[Gamification] Prediction resolved: user=${userId}, ` +
    `predicted=${predictedPrice}, actual=${actualPrice}, ` +
    `accuracy=${accuracy.toFixed(1)}%, correct=${correct}, XP=${xpEarned}`,
  );
  // TODO: Update prediction status, award XP, check prediction achievements
}

// ─── Handler Registration ────────────────────────────────────────────────────

/**
 * Register all gamification event handlers.
 */
export function getGamificationHandlerRegistrations(): EventHandlerRegistration[] {
  return [
    {
      pattern: GAMIFICATION_EVENTS.CHECKIN_PERFORMED,
      handler: handleCheckinPerformed,
      name: 'handleCheckinPerformed',
    },
    {
      pattern: GAMIFICATION_EVENTS.CHECKIN_STREAK_UPDATED,
      handler: handleCheckinStreakUpdated,
      name: 'handleCheckinStreakUpdated',
    },
    {
      pattern: GAMIFICATION_EVENTS.XP_EARNED,
      handler: handleXPEarned,
      name: 'handleXPEarned',
    },
    {
      pattern: GAMIFICATION_EVENTS.XP_SPENT,
      handler: handleXPSpent,
      name: 'handleXPSpent',
    },
    {
      pattern: GAMIFICATION_EVENTS.LEVEL_UP,
      handler: handleLevelUp,
      name: 'handleLevelUp',
    },
    {
      pattern: GAMIFICATION_EVENTS.LEVEL_DOWN,
      handler: handleLevelDown,
      name: 'handleLevelDown',
    },
    {
      pattern: GAMIFICATION_EVENTS.ACHIEVEMENT_UNLOCKED,
      handler: handleAchievementUnlocked,
      name: 'handleAchievementUnlocked',
    },
    {
      pattern: GAMIFICATION_EVENTS.QUEST_STARTED,
      handler: handleQuestStarted,
      name: 'handleQuestStarted',
    },
    {
      pattern: GAMIFICATION_EVENTS.QUEST_COMPLETED,
      handler: handleQuestCompleted,
      name: 'handleQuestCompleted',
    },
    {
      pattern: GAMIFICATION_EVENTS.QUEST_CLAIMED,
      handler: handleQuestClaimed,
      name: 'handleQuestClaimed',
    },
    {
      pattern: GAMIFICATION_EVENTS.LEADERBOARD_UPDATED,
      handler: handleLeaderboardUpdated,
      name: 'handleLeaderboardUpdated',
    },
    {
      pattern: GAMIFICATION_EVENTS.PREDIATION_SUBMITTED,
      handler: handlePredictionSubmitted,
      name: 'handlePredictionSubmitted',
    },
    {
      pattern: GAMIFICATION_EVENTS.PREDICTION_RESOLVED,
      handler: handlePredictionResolved,
      name: 'handlePredictionResolved',
    },
  ];
}
