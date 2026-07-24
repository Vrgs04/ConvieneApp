CREATE TABLE IF NOT EXISTS analyses (id TEXT PRIMARY KEY, device_id TEXT, platform TEXT NOT NULL, classification TEXT NOT NULL, offered_fare REAL, total_distance_km REAL, total_duration_min REAL, estimated_net_profit REAL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
