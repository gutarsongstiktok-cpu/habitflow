# UpHabit 3.0 — product polish

This release keeps the existing AppData schema and backend JSONB storage compatible.

## UX/UI
- New Today dashboard as the primary home screen.
- Stronger visual hierarchy, cards, progress states and mobile navigation.
- Dark/light appearance switch.
- Telegram haptic feedback on important actions.
- Improved empty states and modal interactions.
- Responsive layout for compact Android screens.

## Gamification
- Level/XP/coins remain compatible with the 2.0 model.
- Achievement presentation improved.
- Perfect-day achievement is now unlocked when all habits are completed for today.

## Finance
- Balance hero, income/expense split, wallets, budgets and savings goals.
- Quick finance actions.
- Goal progress with quick contribution.
- Cleaner transaction history.

## Analytics
- Productivity index.
- 7/14-day habit rhythm chart.
- Task completion, streak, XP and savings metrics.
- Expense distribution by category.

## AI Coach
- Built-in local recommendation layer based on current habits, tasks, streak and spending.
- It requires no new API key and does not change backend authentication.
- It is intentionally deterministic in this release; a real LLM provider can be connected later.

## Compatibility
No database migration is required. Existing users keep their current habits, tasks, finance data and gamification JSON.
