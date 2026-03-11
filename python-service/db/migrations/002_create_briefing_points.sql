CREATE TABLE IF NOT EXISTS briefing_points (
    id SERIAL PRIMARY KEY,

    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_briefing_id ON briefing_points(briefing_id);