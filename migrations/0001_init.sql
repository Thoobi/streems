-- Apply with: pnpm db:migrate:local  (or db:migrate:remote for production)

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('host', 'listener')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS broadcasts (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  meeting_id TEXT NOT NULL,
  host_id    TEXT NOT NULL REFERENCES users(id),
  status     TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at   TEXT
);
CREATE INDEX IF NOT EXISTS broadcasts_status ON broadcasts(status, started_at);
