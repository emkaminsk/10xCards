/*
 * 10xCards MVP Database Schema Migration
 * 
 * Purpose: Create complete database schema for 10xCards MVP - AI-powered flashcard application
 * Affected tables: all core tables (users, user_settings, import_sessions, cards, proposed_cards, leitner_boxes, reviews)
 * 
 * Features:
 * - AI-generated flashcard proposals with TTL cleanup
 * - Leitner box spaced repetition system
 * - Global deduplication using trigram similarity
 * - Row Level Security for multi-tenant preparation
 * - Performance-optimized indexes for 100K+ flashcards
 * - Audit trail with automatic timestamp updates
 * 
 * Special considerations:
 * - Uses Supabase auth.users table structure
 * - JSONB tags for flexible AI metadata storage
 * - Soft delete for cards to preserve review statistics
 * - TTL management for expired proposals
 */

-- Enable required PostgreSQL extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create custom ENUM types for type safety and performance
create type card_status as enum ('active', 'archived');
create type proficiency_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type review_rating as enum ('again', 'hard', 'good', 'easy');

-- User settings table (1:1 relationship with auth.users)
-- Stores user preferences including Spanish proficiency level for AI flashcard generation
create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proficiency_level proficiency_level not null default 'A2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_settings unique(user_id)
);

-- Import sessions table
-- Tracks article import sessions with source metadata and generation statistics
create table import_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text,
  source_content text,
  total_generated integer default 0,
  total_accepted integer default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 month')
);

-- Cards table (accepted flashcards)
-- Stores finalized flashcards with AI-generated tags and soft delete capability
create table cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_session_id uuid references import_sessions(id) on delete set null,
  front text not null,
  back text not null,
  context text check (length(context) <= 500), -- Enforce 500 character limit for optimal display
  tags jsonb default '{}', -- AI-generated metadata: part of speech, tense, mood, domain
  status card_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz, -- Soft delete to preserve review statistics
  constraint unique_card_per_user unique(user_id, front, back) -- Global deduplication per user
);

-- Proposed cards table (AI suggestions with TTL)
-- Temporary storage for AI-generated flashcard proposals, automatically cleaned after 1 month
create table proposed_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_session_id uuid not null references import_sessions(id) on delete cascade,
  front text not null,
  back text not null,
  context text check (length(context) <= 500), -- Enforce 500 character limit
  tags jsonb default '{}', -- AI-generated metadata
  is_selected boolean not null default false, -- User selection state for bulk operations
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 month') -- TTL for automatic cleanup
);

-- Leitner boxes table (spaced repetition system)
-- Implements Leitner algorithm with 5 box levels for optimal spaced repetition
create table leitner_boxes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  box_level integer not null check (box_level >= 1 and box_level <= 5) default 1, -- Leitner box levels 1-5
  next_review_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_card_per_user_box unique(user_id, card_id) -- One box per card per user
);

-- Reviews table (learning session history)
-- Complete audit trail of all flashcard reviews with performance metrics
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  rating review_rating not null, -- User's difficulty assessment (again/hard/good/easy)
  response_time_ms integer, -- Time taken to answer (for analytics)
  box_level_before integer not null, -- Box level before this review
  box_level_after integer not null, -- Box level after this review
  session_id uuid, -- Optional grouping for learning sessions
  created_at timestamptz not null default now()
);

-- Performance indexes for optimal query execution
-- These indexes are critical for supporting 100K+ flashcards with <400ms response times

-- Basic user filtering indexes
create index idx_cards_user_id on cards(user_id) where deleted_at is null;
create index idx_proposed_cards_import_session on proposed_cards(import_session_id);
create index idx_proposed_cards_expires on proposed_cards(expires_at);

-- Composite index for Leitner algorithm queries (most critical for performance)
-- Optimizes queries for: "get next cards to review for user X on date Y"
create index idx_leitner_boxes_next_review on leitner_boxes(user_id, next_review_date, box_level);

-- Review history indexes for analytics and card statistics
create index idx_reviews_card_created on reviews(card_id, created_at desc);
create index idx_reviews_user_session on reviews(user_id, session_id) where session_id is not null;

-- GIN indexes for JSONB tag searching and filtering
-- Enables fast queries like: "find cards tagged with 'verb' or 'present tense'"
create index idx_tags_gin on cards using gin (tags);
create index idx_proposed_tags_gin on proposed_cards using gin (tags);

-- Trigram index for similarity-based deduplication
-- Enables fuzzy matching to prevent duplicate flashcards
create index idx_cards_front_back_trgm on cards using gin ((front || ' ' || back) gin_trgm_ops);

-- Database functions and triggers for automation

-- Function: Automatic timestamp updates
-- Ensures updated_at is always current when records are modified
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Triggers for automatic timestamp management
create trigger update_user_settings_updated_at 
    before update on user_settings 
    for each row execute function update_updated_at_column();

create trigger update_cards_updated_at 
    before update on cards 
    for each row execute function update_updated_at_column();

create trigger update_leitner_boxes_updated_at 
    before update on leitner_boxes 
    for each row execute function update_updated_at_column();

-- Function: Similarity-based deduplication
-- Prevents creation of similar flashcards using trigram similarity
-- Threshold of 0.8 catches very similar cards while allowing variations
create or replace function check_card_similarity()
returns trigger as $$
begin
    -- Check if a similar flashcard already exists for this user
    -- Uses trigram similarity with 0.8 threshold (80% similarity)
    if exists (
        select 1 from cards 
        where user_id = new.user_id 
        and deleted_at is null
        and similarity(front, new.front) > 0.8
        and similarity(back, new.back) > 0.8
    ) then
        raise exception 'Similar flashcard already exists for this user';
    end if;
    return new;
end;
$$ language 'plpgsql';

-- Trigger for deduplication on card insertion
create trigger check_card_similarity_trigger 
    before insert on cards 
    for each row 
    execute function check_card_similarity();

-- Function: TTL cleanup for expired proposals
-- Automatically removes expired proposed_cards and orphaned import_sessions
-- Should be called periodically (e.g., daily cron job)
create or replace function cleanup_expired_proposals()
returns void as $$
begin
    -- Remove expired proposed cards (older than 1 month)
    delete from proposed_cards where expires_at < now();
    
    -- Remove expired import sessions that have no associated accepted cards
    -- This preserves import_sessions that have been used to create actual cards
    delete from import_sessions 
    where expires_at < now() 
    and id not in (
        select distinct import_session_id 
        from cards 
        where import_session_id is not null
    );
end;
$$ language 'plpgsql';

-- Row Level Security (RLS) configuration
-- Enables secure multi-tenant architecture even though MVP is single-user

-- Enable RLS on all tables
alter table user_settings enable row level security;
alter table import_sessions enable row level security;
alter table cards enable row level security;
alter table proposed_cards enable row level security;
alter table leitner_boxes enable row level security;
alter table reviews enable row level security;

-- RLS Policies for authenticated users
-- Each policy ensures users can only access their own data

-- User Settings Policies
-- Allows authenticated users to manage their own settings
create policy "authenticated_users_select_own_settings" 
    on user_settings for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_settings" 
    on user_settings for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_settings" 
    on user_settings for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_settings" 
    on user_settings for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Import Sessions Policies
-- Allows authenticated users to manage their own import sessions
create policy "authenticated_users_select_own_sessions" 
    on import_sessions for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_sessions" 
    on import_sessions for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_sessions" 
    on import_sessions for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_sessions" 
    on import_sessions for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Cards Policies
-- Allows authenticated users to manage their own flashcards
create policy "authenticated_users_select_own_cards" 
    on cards for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_cards" 
    on cards for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_cards" 
    on cards for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_cards" 
    on cards for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Proposed Cards Policies
-- Allows authenticated users to manage their own proposed flashcards
create policy "authenticated_users_select_own_proposals" 
    on proposed_cards for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_proposals" 
    on proposed_cards for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_proposals" 
    on proposed_cards for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_proposals" 
    on proposed_cards for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Leitner Boxes Policies
-- Allows authenticated users to manage their own spaced repetition data
create policy "authenticated_users_select_own_boxes" 
    on leitner_boxes for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_boxes" 
    on leitner_boxes for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_boxes" 
    on leitner_boxes for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_boxes" 
    on leitner_boxes for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- Reviews Policies
-- Allows authenticated users to manage their own learning history
create policy "authenticated_users_select_own_reviews" 
    on reviews for select 
    to authenticated 
    using (auth.uid() = user_id);

create policy "authenticated_users_insert_own_reviews" 
    on reviews for insert 
    to authenticated 
    with check (auth.uid() = user_id);

create policy "authenticated_users_update_own_reviews" 
    on reviews for update 
    to authenticated 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "authenticated_users_delete_own_reviews" 
    on reviews for delete 
    to authenticated 
    using (auth.uid() = user_id);

-- No policies for anonymous users - all access requires authentication
-- This ensures data security and privacy for the flashcard application
