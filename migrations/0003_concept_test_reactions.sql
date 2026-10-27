CREATE TABLE IF NOT EXISTS concept_test_reactions (
  session_token TEXT PRIMARY KEY,
  reaction TEXT NOT NULL CHECK (reaction IN ('yes', 'maybe', 'no')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
