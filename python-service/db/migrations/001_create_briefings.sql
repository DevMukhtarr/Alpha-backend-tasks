CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY,

    company_name VARCHAR(200) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    sector VARCHAR(120),

    analyst_name VARCHAR(120) NOT NULL,

    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,

    generated BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    generated_at TIMESTAMPTZ
);

CREATE INDEX idx_briefings_ticker ON briefings(ticker);