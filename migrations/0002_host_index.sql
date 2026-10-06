-- Every account can now host its own broadcasts; broadcasts.host_id decides who hosts.
-- users.role is no longer read (left in place, its default keeps inserts working).
CREATE INDEX IF NOT EXISTS broadcasts_host ON broadcasts(host_id, status, started_at);
