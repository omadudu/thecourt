CREATE TABLE IF NOT EXISTS hearings (
  id TEXT PRIMARY KEY,
  baseline TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  remote TEXT,
  status TEXT NOT NULL,
  score INTEGER,
  verdict TEXT,
  report_key TEXT,
  workflow_id TEXT,
  created_at TEXT NOT NULL
);
