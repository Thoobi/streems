-- Hosts have accounts again: each call belongs to the user who started it.
-- Joiners still need no account; they come in through the call's /c/<code> link.
ALTER TABLE calls ADD COLUMN host_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS calls_host ON calls(host_id, status, started_at);
