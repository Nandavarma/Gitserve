/**
 * Database setup helper.
 *
 * Prints the SQL that needs to be run in your Supabase SQL Editor to create
 * all required tables and policies.
 *
 * Usage:
 *   npm run setup-db
 *
 * Then copy the printed SQL into:
 *   supabase.com → your project → SQL Editor → New query → Run
 */

const SQL = `
-- Enable pgvector extension (required for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- documents table (RAG / embeddings)
CREATE TABLE IF NOT EXISTS documents (
  id        BIGSERIAL  PRIMARY KEY,
  content   TEXT       NOT NULL,
  embedding VECTOR(384),
  repo_id   TEXT
);

-- Similarity-search RPC used by the retriever
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(384),
  match_count     INT DEFAULT 3
)
RETURNS TABLE (content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT content,
         1 - (embedding <=> query_embedding) AS similarity
  FROM   documents
  ORDER  BY embedding <=> query_embedding
  LIMIT  match_count;
$$;

-- user_credits table (IP-based, 24-hour rolling window)
CREATE TABLE IF NOT EXISTS user_credits (
  fingerprint TEXT        PRIMARY KEY,
  credits     INTEGER     NOT NULL DEFAULT 3,
  reset_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Allow the anon key to read/write user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_credits' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY allow_all ON user_credits FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;
`;

console.log("\n=== Run the following SQL in your Supabase SQL Editor ===\n");
console.log("  supabase.com → your project → SQL Editor → New query → Run\n");
console.log(SQL);
console.log("=========================================================\n");
