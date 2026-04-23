# Task 4-a — Backend API Agent: Gold Quest Backend API Routes

## Summary
Created all 13 backend API route files for the "Gold Quest" Gamified SEO Reward Engine. All routes use the existing Prisma models (Mission, UserMission, QuestRewardTransaction, UserGamification) and follow the `{success, data}` JSON response pattern.

## Files Created

### Quest API Routes (11 files)
1. **`/src/app/api/quest/dashboard/route.ts`** — GET dashboard: XP, level, total gold, streak, multiplier, recent rewards, available missions
2. **`/src/app/api/quest/missions/route.ts`** — GET all active missions (filterable) + POST seed 18 demo missions across 8 types
3. **`/src/app/api/quest/today/route.ts`** — GET today's daily missions with progress and completion counts
4. **`/src/app/api/quest/track/route.ts`** — POST track engagement (missionId, trackedTime, scrollDepth, interactions), validates rules, auto-completes
5. **`/src/app/api/quest/claim/route.ts`** — POST claim reward: marks claimed, creates QuestRewardTransaction, updates XP with streak multiplier
6. **`/src/app/api/quest/badges/route.ts`** — GET quest category badges with earned/locked/hidden separation
7. **`/src/app/api/quest/leaderboard/route.ts`** — GET weekly/monthly top 20 leaderboard by quest XP
8. **`/src/app/api/quest/streak/route.ts`** — GET streak info + POST increment (validates not done today, calculates multiplier)
9. **`/src/app/api/quest/learning-paths/route.ts`** — GET learning path missions grouped as lessons with completion status
10. **`/src/app/api/quest/rewards/route.ts`** — GET paginated reward history with totals and source breakdown
11. **`/src/app/api/quest/search/route.ts`** — POST track search queries, auto-matches to search missions

### Admin API Routes (2 files)
12. **`/src/app/api/admin/quest-missions/route.ts`** — GET all missions (paginated) + POST create + PUT update
13. **`/src/app/api/admin/quest-missions/[id]/route.ts`** — DELETE mission (cascades) + PUT toggle active

## Key Implementation Details
- **Streak multiplier**: day1=1x, day3=1.5x, day7=2x, day14=3x, day30=5x
- **Level formula**: `floor(sqrt(xp/100)) + 1`
- **Rules validation**: parses rulesJson, checks minDuration/minScroll/minInteractions/requiredPages
- **Seed data**: 18 demo missions across 8 types (content:3, explore:3, search:2, tool:2, daily_return:2, social_share:2, profile:2, learning:4) — all with Persian content
- **User ID**: hardcoded as "1" for demo
- **Timezone**: Tehran (UTC+3:30) for daily calculations
- **Lint**: 0 errors, 0 warnings
