# UpHabit 6.1 — Finance Fix

## Fixed
- Finance categories are now manageable: create, edit name/type/color, delete when unused.
- Budget creation now exposes all expense categories, not only the two initial defaults.
- Added a category-management shortcut directly inside the New Budget dialog.
- New installs receive a useful starter set of finance categories; existing user categories/data are preserved.
- Future-dated transactions no longer affect wallet balance before their date.
- Existing legacy data is migrated safely: future transactions that were previously included in wallet balances are removed from the current balance once.
- On app startup, due scheduled transactions are applied to balances automatically.
- Editing a transaction correctly handles moving it from past/today to future and vice versa.
- Deleting a transaction only reverses its balance impact if it was actually applied.
- Current-month income/expense and budget spending ignore future-dated operations.
- Future operations are labeled `Запланировано` in history.

## Example
If today is 10.09 and a salary of 6500 is entered for 14.09, the 6500 is not added to the wallet on 10.09. When UpHabit is opened on 14.09, the scheduled income is applied to the wallet.

## Data compatibility
No PostgreSQL migration is required. The new `balanceApplied` field is optional and backwards compatible with existing JSONB app data.
