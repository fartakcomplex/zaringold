---
Task ID: 3-a
Agent: full-stack-developer
Task: Build backend API routes for Gamification, Achievements, Check-In, and VIP modules

Work Log:
- Read worklog.md to understand project state (Tasks 2-e through 25)
- Read prisma/schema.prisma to verify all required models exist (UserGamification, Achievement, UserAchievement, CheckIn, VIPSubscription, PricePrediction, CashbackReward)
- Read existing API routes (loans, wallet/deposit) to understand code patterns
- Created 13 API routes across 4 modules:

### Gamification Module (5 routes)

1. **`/api/gamification/profile/route.ts`** — GET
   - Gets or creates UserGamification record
   - Calculates level using formula: `floor(sqrt(xp / 100)) + 1`
   - Computes level progress % between current and next level
   - Counts earned badges from UserAchievement table
   - Computes rank (position by XP across all users)
   - Returns: xp, level, levelProgress, streak, badges, rank, checkInCount, predictionScore, referralCount

2. **`/api/gamification/achievements/route.ts`** — GET
   - Lists all visible (non-hidden) achievements ordered by sortOrder
   - Joins with UserAchievement to determine earned status
   - Returns: id, slug, title, description, icon, category, xpReward, goldRewardMg, earned (bool), earnedAt

3. **`/api/gamification/checkin/route.ts`** — POST
   - Daily check-in with Tehran timezone awareness
   - Prevents duplicate check-ins on same day
   - Streak logic: continues if checked in yesterday, resets otherwise
   - Day rewards: Day 1-6 = 5000 toman, Day 7 = 0.01g gold, Day 14 = 10000 toman, Day 30 = VIP trial (3 days)
   - XP: 10 per check-in + 50 bonus at streak milestones (7, 14, 30)
   - Auto-unlocks 7 achievements: first_checkin, streak_7, streak_14, streak_30, streak_60, checkins_50, checkins_100
   - Auto-creates Achievement records if they don't exist
   - Applies fiat rewards to Wallet, gold rewards to GoldWallet, VIP trial to VIPSubscription
   - Recalculates level after XP addition

4. **`/api/gamification/checkin/status/route.ts`** — GET
   - Checks if already checked in today (Tehran timezone)
   - Returns: checkedInToday, currentStreak, longestStreak, totalCheckIns, nextReward, dayProgress

5. **`/api/gamification/xp/route.ts`** — POST
   - Adds XP to user with reason tracking
   - Recalculates level, detects level-up
   - Returns: added, total, oldLevel, newLevel, leveledUp, reason

6. **`/api/gamification/leaderboard/route.ts`** — GET
   - Top 20 users sorted by XP then streak
   - Masks phone numbers for privacy
   - Returns: rank, fullName, avatar, xp, level, streak, badges, checkIns

### VIP Module (2 routes)

7. **`/api/vip/subscribe/route.ts`** — POST
   - Validates plan (silver/gold/black) all with 30-day duration
   - Upserts VIPSubscription record
   - Returns: plan, planLabel, startedAt, expiresAt, daysRemaining

8. **`/api/vip/status/route.ts`** — GET
   - Returns VIP status with auto-expiry check
   - Auto-deactivates expired subscriptions
   - Calculates daysRemaining
   - Returns: isVip, plan, planLabel, isActive, expiresAt, daysRemaining, autoRenew

### Cashback Module (2 routes)

9. **`/api/cashback/route.ts`** — GET
   - Lists user's cashback rewards with optional status filter
   - Auto-marks expired rewards
   - Returns summary: total, claimed, pending, totalPendingFiat, totalPendingGold

10. **`/api/cashback/claim/route.ts`** — POST
    - Validates ownership and status before claiming
    - Checks expiry, adds reward to Wallet (fiat) or GoldWallet (gold)
    - Returns: reward details with Persian formatted value label

### Predictions Module (3 routes)

11. **`/api/predictions/route.ts`** — POST
    - Submit daily price prediction with future date validation
    - Prevents duplicate predictions per target date per user
    - Returns: prediction record with pending status

12. **`/api/predictions/resolve/route.ts`** — POST
    - Resolves all pending predictions for a target date
    - 2% accuracy threshold for correct prediction
    - Awards 50 XP for correct, 5 XP for participation
    - Updates predictionScore and XP on gamification profile

13. **`/api/predictions/leaderboard/route.ts`** — GET
    - Top 10 users by predictionScore then XP
    - Returns: rank, fullName, avatar, score, xp, level, correctPredictions

### Design Decisions
- All responses use `{ success: boolean, ...data }` pattern
- All error messages in Persian
- Tehran timezone (UTC+3:30) used for check-in date comparison
- Level formula: `floor(sqrt(xp / 100)) + 1` — consistent across all XP-modifying routes
- Auto-creation pattern: gamification profile, achievements created on first access
- Phone masking for privacy in leaderboards: `0912****001`

Stage Summary:
- 13 API routes created across 4 modules (Gamification, VIP, Cashback, Predictions)
- All routes use existing Prisma schema models (no schema changes needed)
- Lint: 0 errors, 0 warnings
- No existing files modified
- All text in Persian, consistent with project conventions
