# UpHabit 5.1

- Bottom navigation: Сегодня | Привычки | Задачи | Финансы | Профиль.
- Аналитика removed from bottom navigation and added as the first card in Профиль.
- Привычки are now a full primary tab; existing habit editing/deleting remains available.
- Finance wallets now have Изменить and Удалить controls.
- Wallet deletion is blocked when the wallet has transactions, preventing orphaned finance records.
- Wallet editing preserves balance and transaction history; name and currency can be changed.
- Existing backend, Telegram auth, PostgreSQL persistence and data model remain compatible.
