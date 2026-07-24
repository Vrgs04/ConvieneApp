CREATE TABLE IF NOT EXISTS device_settings (
  device_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
