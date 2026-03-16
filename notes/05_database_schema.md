# 05 — Database Schema

## Status

Confirmed from code — `electron/db/schema.sql` and `electron/services/db.service.ts`.

## Database

- Engine: SQLite (better-sqlite3)
- Location: `~/Library/Application Support/whatsapp-text-scheduler/schedules.db`
- Mode: WAL (Write-Ahead Logging), foreign keys ON

## Tables

### `schedules`

```sql
CREATE TABLE IF NOT EXISTS schedules (
  id             TEXT PRIMARY KEY,              -- nanoid (e.g. "V1StGXR8_Z5jdHi6B-myT")
  phone_number   TEXT NOT NULL,                 -- E.164-style, e.g. "+15551234567"
  contact_name   TEXT NOT NULL DEFAULT '',      -- display name, empty if manual entry
  message        TEXT NOT NULL,                 -- plaintext message body
  schedule_type  TEXT NOT NULL,                 -- 'one_time' | 'daily' | 'weekly'
                                                -- | 'quarterly' | 'half_yearly' | 'yearly'
  scheduled_at   TEXT,                          -- ISO 8601 datetime, used only for one_time
  time_of_day    TEXT,                          -- "HH:mm" (24h), used for daily/weekly/extended
  day_of_week    INTEGER,                       -- 0=Sun … 6=Sat, used for weekly
  day_of_month   INTEGER,                       -- 1–28, used for quarterly/half_yearly/yearly
  month_of_year  INTEGER,                       -- 0=Jan … 11=Dec, used for yearly
  enabled        INTEGER NOT NULL DEFAULT 1,    -- 0 | 1 boolean
  dry_run        INTEGER NOT NULL DEFAULT 0,    -- 0 | 1 boolean
  created_at     TEXT NOT NULL,                 -- ISO 8601 datetime
  updated_at     TEXT NOT NULL                  -- ISO 8601 datetime
);
```

**Notes**:
- `day_of_month` and `month_of_year` were added in a later migration. `db.service.ts` runs `ALTER TABLE` to add these columns on startup if missing (safe for existing DBs).
- One-time schedules are auto-disabled (`enabled = 0`) after successful execution.
- `dry_run` per-schedule is OR'd with the global `global_dry_run` setting at execution time.

### `run_logs`

```sql
CREATE TABLE IF NOT EXISTS run_logs (
  id             TEXT PRIMARY KEY,              -- nanoid
  schedule_id    TEXT NOT NULL
                   REFERENCES schedules(id) ON DELETE CASCADE,
  status         TEXT NOT NULL,                 -- 'success' | 'failed' | 'dry_run' | 'skipped'
  error_message  TEXT,                          -- null on success; error string on failure
  fired_at       TEXT NOT NULL,                 -- ISO 8601 — when job was triggered
  completed_at   TEXT NOT NULL                  -- ISO 8601 — when execution finished
);

CREATE INDEX IF NOT EXISTS idx_run_logs_schedule ON run_logs (schedule_id);
CREATE INDEX IF NOT EXISTS idx_run_logs_fired_at ON run_logs (fired_at DESC);
```

**Notes**:
- Cascade delete: all logs for a schedule are removed when the schedule is deleted.
- `getLogs()` joins `schedules` to return `contact_name` and `message` alongside each log row.
- `clearLogs()` accepts an optional `olderThanDays` integer; passing null clears all logs.

### `settings`

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed rows (inserted on first run):
INSERT OR IGNORE INTO settings VALUES ('global_dry_run',      '0');
INSERT OR IGNORE INTO settings VALUES ('default_country_code', '+1');
INSERT OR IGNORE INTO settings VALUES ('send_delay_ms',        '3000');
INSERT OR IGNORE INTO settings VALUES ('whatsapp_app',         'WhatsApp');
```

**Notes**:
- All values stored as TEXT strings; parsing to boolean/number happens in `db.service.ts`.
- `updateSetting()` uses `INSERT OR REPLACE` (upsert).
- `whatsapp_app` is the exact application name used in `tell application "NAME" to activate` AppleScript.

## Relationships

```
schedules (1) ─── (many) run_logs
    id ────────────────── schedule_id (FK, CASCADE DELETE)
```

`settings` is standalone with no FK relationships.

## Row-to-Object Mapping

`db.service.ts` maps snake_case column names to camelCase TypeScript fields:
- `phone_number` → `phoneNumber`
- `contact_name` → `contactName`
- `schedule_type` → `scheduleType`
- `scheduled_at` → `scheduledAt`
- `time_of_day` → `timeOfDay`
- `day_of_week` → `dayOfWeek`
- `day_of_month` → `dayOfMonth`
- `month_of_year` → `monthOfYear`
- `dry_run` → `dryRun` (INTEGER 0/1 → boolean)
- `enabled` → `enabled` (INTEGER 0/1 → boolean)
