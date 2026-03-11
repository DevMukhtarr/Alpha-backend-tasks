CREATE TABLE IF NOT EXISTS briefing_risks (
    id SERIAL PRIMARY KEY,

    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risks_briefing_id ON briefing_risks(briefing_id);