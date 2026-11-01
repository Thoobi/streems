-- One host, no accounts. The host unlocks with the HOST_PASSCODE secret; everyone else
-- joins with the call's link (/c/<code>) or by typing its code on the home page.
-- The old users/sessions/broadcasts tables are no longer read and are left in place.
CREATE TABLE IF NOT EXISTS calls (
  code       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  host_name  TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at   TEXT
);
CREATE INDEX IF NOT EXISTS calls_status ON calls(status, started_at);
