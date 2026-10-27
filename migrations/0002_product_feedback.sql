CREATE TABLE IF NOT EXISTS product_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 3 AND 2000),
  reaction TEXT CHECK (reaction IS NULL OR reaction IN ('yes', 'maybe', 'no')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
