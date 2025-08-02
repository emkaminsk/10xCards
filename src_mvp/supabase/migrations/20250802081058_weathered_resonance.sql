-- 10xCards PoC Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Import sessions table
CREATE TABLE import_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leitner boxes system
CREATE TABLE boxes (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    box_index INTEGER DEFAULT 1 CHECK (box_index BETWEEN 1 AND 3),
    next_review DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (card_id)
);

-- Review history
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    grade TEXT CHECK (grade IN ('easy', 'hard')),
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Card proposals (before acceptance)
CREATE TABLE card_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_boxes_next_review ON boxes(next_review);
CREATE INDEX idx_card_proposals_session ON card_proposals(session_id);
CREATE INDEX idx_reviews_card_id ON reviews(card_id);