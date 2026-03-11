CREATE TABLE IF NOT EXISTS briefing_metrics (
    id SERIAL PRIMARY KEY,

    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,

    name VARCHAR(120) NOT NULL,
    value VARCHAR(120) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (briefing_id, name)
);