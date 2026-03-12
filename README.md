# Gitserve — AI Code Intelligence

Gitserve lets you point at any **public GitHub repository** and instantly get three types of AI-powered analysis — no cloning required. Paste a repo URL (or pick from a list of pre-indexed popular repositories), wait for it to be indexed, and choose between a chat interface, a structure review, or a security audit.

Built with Next.js, Groq (LLaMA 3.3 70B), a self-hosted embedding server (`BAAI/bge-small-en-v1.5`), and Supabase.

---

## The 3 Tools

### 1. Chat

Ask natural language questions about a repository. Gitserve indexes the codebase using RAG (Retrieval-Augmented Generation) and answers using the most relevant file summaries as context. Great for understanding unfamiliar codebases quickly.

### 2. Structure

Analyses the repository's folder structure and file organisation against best-practice rules for Next.js, React, and generic projects. Returns a list of findings with severity badges (error / warn / info), a visual folder tree, the detected framework, and an LLM-generated prose summary.

### 3. Security

Scans all indexed file summaries with a rule-based regex engine covering 14 categories — hardcoded secrets, weak crypto, dangerous injections, exposed credentials, misconfigured CORS, and more. Produces a 0–100 security score, a sorted findings list (critical → high → medium → low), and a plain-text risk narrative written by the LLM.

> **Note:** The security scanner never sends your code to the LLM. Only finding metadata (rule name, file path, severity) is included in the prompt.

---

## Popular Repositories

Gitserve ships with **10 pre-indexed popular repositories** that load instantly with no credits consumed:

| Repo                     | Language   | Stars |
| ------------------------ | ---------- | ----- |
| facebook/react           | TypeScript | 230k  |
| vercel/swr               | TypeScript | 31k   |
| supabase/supabase        | TypeScript | 76k   |
| langchain-ai/langchain   | Python     | 98k   |
| nestjs/nest              | TypeScript | 68k   |
| tailwindlabs/tailwindcss | JavaScript | 85k   |
| shadcn-ui/ui             | TypeScript | 75k   |
| trpc/trpc                | TypeScript | 35k   |
| prisma/prisma            | TypeScript | 40k   |
| microsoft/TypeScript     | TypeScript | 102k  |

To seed these into your own Supabase instance, run:

```bash
npm run preindex
```

The script calls your self-hosted embedding server (`EMBEDDING_API`). Already-indexed repos are skipped automatically on subsequent runs.

---

## Embedding Strategy

Instead of splitting files into raw text chunks, Gitserve generates a **structured summary** per file:

```
File: src/auth/auth.service.ts
Language: TypeScript
Exports: loginUser, registerUser, hashPassword
Dependencies: jsonwebtoken, bcrypt
Purpose: Handles authentication and JWT token generation

<first 600 chars of source>
```

This yields **1 embedding per file** instead of 6–8, keeping embedding API calls minimal while preserving full semantic retrieval quality.

---

## Credit System

Each visitor gets **3 free credits**, reset every **24 hours**. One credit is consumed per repository ingestion. Credits are tracked server-side using a SHA-256 fingerprint of the client IP — shared across all browsers on the same network, no account required.

Pre-indexed popular repositories are served from cache and **do not consume credits**.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Nandavarma/Gitserve.git
cd Gitserve
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Required — Groq API key for LLM completions (llama-3.3-70b-versatile)
# Get yours at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Required — URL of your self-hosted embedding server
# The server must expose POST /embed with body { text: string }
# and return { embedding: number[] } (384-dim, BAAI/bge-small-en-v1.5)
EMBEDDING_API=http://your-server-ip:8000/embed

# Required — Supabase project URL
# Found in your Supabase project → Settings → API → Project URL
SUPABASE_URL=https://your-project.supabase.co

# Required — Supabase anon/public key
# Found in your Supabase project → Settings → API → Project API Keys → anon public
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional — GitHub personal access token
# Without it, GitHub API requests are rate-limited to 60/hour (unauthenticated).
# With it, the limit rises to 5 000/hour — strongly recommended for large repos.
# Create one at https://github.com/settings/tokens (no scopes needed for public repos)
GITHUB_TOKEN=your_github_token_here
```

### 3. Provision Supabase

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks (RAG store)
CREATE TABLE documents (
  id        BIGSERIAL PRIMARY KEY,
  content   TEXT,
  embedding VECTOR(384),  -- BAAI/bge-small-en-v1.5 produces 384-dim vectors
  repo_id   TEXT
);

CREATE INDEX idx_documents_repo_id ON documents(repo_id);

-- Similarity-search RPC
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

-- Credit tracking (IP-based, no account required)
CREATE TABLE user_credits (
  fingerprint TEXT        PRIMARY KEY,
  credits     INTEGER     NOT NULL DEFAULT 3,
  reset_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all ON user_credits FOR ALL USING (true) WITH CHECK (true);
```

### 4. Pre-index popular repositories (optional but recommended)

```bash
npm run preindex
```

Requires `EMBEDDING_API` to be set. Run it once before deploying to seed the popular repos cache.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                                         |
| LLM          | Groq — `llama-3.3-70b-versatile`                                |
| Embeddings   | Self-hosted FastAPI server — `BAAI/bge-small-en-v1.5` (384-dim) |
| Vector store | Supabase with `pgvector`                                        |
| Styling      | Tailwind CSS v4                                                 |

---

## Project Structure

```
app/
  api/           # Route handlers: chat, ingest, security, structure, credits
  tools/[tool]/  # Shared UI for all 3 tools (chat | structure | security)
components/      # React components (ChatInterface, PopularReposModal, …)
lib/
  rules/         # JSON rule definitions for Next.js, React, and generic checks
  llm.ts         # Groq client
  embeddings.ts  # Self-hosted embedding server client (BAAI/bge-small-en-v1.5)
  summarize.ts   # Static file summarizer (exports, deps, purpose — no LLM)
  retriever.ts   # Cosine-similarity RAG retriever
  security.ts    # Regex-based security scanner
  structure.ts   # Path-based structure analyser
  github.ts      # GitHub API helpers
  supabase.ts    # Supabase client
  popular-repos.ts # Pre-indexed repo definitions
scripts/
  ingest.ts      # One-shot CLI to seed data/docs.txt into Supabase
  preindex.ts    # CLI to pre-index popular repositories locally
public/
data/
  docs.txt       # Optional fallback knowledge base
```
