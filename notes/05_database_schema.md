# 05 — Database Schema

## Purpose
Document the implemented local database model and behavior used by the app.

## Status
- **Confirmed from code**: SQLite schema and mappings in `electron/services/db.service.ts`.
- **Strongly inferred**: `electron/db/schema.sql` is no longer canonical and is partially stale.

## Confirmed from code

### Engine and location
- Engine: SQLite via `better-sqlite3`.
- Open mode: WAL enabled and foreign keys enabled at init.
- DB file path: `join(app.getPath('userData'), 'schedules.db')`.

### Table: `schedules`
Columns implemented in runtime SCHEMA:
- `id TEXT PRIMARY KEY`
- `phone_number TEXT NOT NULL`
- `contact_name TEXT NOT NULL DEFAULT ''`
- `message TEXT NOT NULL`
- `schedule_type TEXT NOT NULL`
- `scheduled_at TEXT`
- `time_of_day TEXT`
- `day_of_week INTEGER`
- `day_of_month INTEGER`
- `month_of_year INTEGER`
- `enabled INTEGER NOT NULL DEFAULT 1`
- `dry_run INTEGER NOT NULL DEFAULT 0`
- `created_at TEXT NOT NULL DEFAULT datetime('now','localtime')`
- `updated_at TEXT NOT NULL DEFAULT datetime('now','localtime')`

Usage notes:
- One-time schedules use `scheduled_at`.
- Daily/weekly/extended use `time_of_day`; weekly also uses `day_of_week`.
- Quarterly/half-yearly/yearly use `day_of_month` and optional/required `month_of_year`.

### Table: `run_logs`
Columns implemented in runtime SCHEMA/migrations:
- `id TEXT PRIMARY KEY`
- `schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE`
- `status TEXT NOT NULL CHECK(status IN ('success','failed','dry_run','skipped'))`
- `error_message TEXT`
- `fired_at TEXT NOT NULL`
- `completed_at TEXT`
- `execution_duration INTEGER` (added by migration)
- `scheduled_time TEXT` (added by migration)

Indexes:
- `idx_run_logs_schedule(schedule_id)`
- `idx_run_logs_fired_at(fired_at DESC)`

### Table: `settings`
- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`

Seeded default keys:
- `global_dry_run = '0'`
- `default_country_code = '+1'`
- `send_delay_ms = '3000'`
- `whatsapp_app = 'WhatsApp'`

### Relationships and ownership
- `schedules (1) -> (many) run_logs` via `schedule_id`, cascade delete enabled.
- No user/account ownership columns (single local-user model).

### Migrations and retention
- Startup `ALTER TABLE` attempts for: `day_of_month`, `month_of_year`, `execution_duration`, `scheduled_time`.
- Startup log pruning: deletes run logs older than 90 days.

## Inferred / proposed
- **Strongly inferred** risk: duplicate schema definition (`db.service.ts` SCHEMA vs `electron/db/schema.sql`) can drift.

## Important details
- App-level camelCase mapping is handled by `rowToSchedule` and `rowToRunLog`.
- Settings values are stored as text and parsed into booleans/numbers at read time.
- No encryption at rest for SQLite file is implemented.

## Open issues / gaps
- Runtime schema does not enforce `schedule_type` enum/check in SQL (validation is mostly application-level).
- `settings:update` handler accepts arbitrary key/value updates.
- No migration version table/history; migration is opportunistic `ALTER TABLE ... try/catch`.

## Recommended next steps
1. Make one schema source canonical (prefer runtime or generated migrations).
2. Add explicit DB-level constraints for schedule type and recurrence field combinations.
3. Add lightweight migration versioning to reduce drift risk.
