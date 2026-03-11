# Gitserve — AI Code Intelligence

Gitserve lets you point at any **public GitHub repository** and instantly get three types of AI-powered analysis — no cloning required. Paste a repo URL, wait for it to be indexed, and choose between a chat interface, a structure review, or a security audit.

Built with Next.js, Groq (LLaMA 3.3 70B), local HuggingFace embeddings, and Supabase.

---

## The 3 Tools

### 1. Chat

Ask natural language questions about a repository. Gitserve indexes the codebase using RAG (Retrieval-Augmented Generation) and answers using the most relevant code chunks as context. Great for understanding unfamiliar codebases quickly.

### 2. Structure

Analyses the repository's folder structure and file organisation against best-practice rules for Next.js, React, and generic projects. Returns a list of findings with severity badges (error / warn / info), a visual folder tree, the detected framework, and an LLM-generated prose summary.

### 3. Security

Scans all indexed file chunks with a rule-based regex engine covering 14 categories — hardcoded secrets, weak crypto, dangerous injections, exposed credentials, misconfigured CORS, and more. Produces a 0–100 security score, a sorted findings list (critical → high → medium → low), and a plain-text risk narrative written by the LLM.

> **Note:** The security scanner never sends your code to the LLM. Only finding metadata (rule name, file path, severity) is included in the prompt.

---

## Credit System

Each visitor gets **3 free credits**, reset every **24 hours**. One credit is consumed per repository ingestion. Credits are tracked server-side using a SHA-256 fingerprint of IP + User-Agent — no account required.

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
  embedding VECTOR(384),  -- all-MiniLM-L6-v2 produces 384-dim vectors
  repo_id   TEXT
);

CREATE INDEX idx_documents_repo_id ON documents(repo_id);

-- Credit tracking (no auth required)
CREATE TABLE user_credits (
  fingerprint TEXT        PRIMARY KEY,
  credits     INTEGER     NOT NULL DEFAULT 3,
  reset_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Optional: Seed global documentation

If you want a fallback knowledge base (e.g., framework docs) that powers answers when no repo-specific context is found, add content to `data/docs.txt` and run:

```bash
npm run ingest
```

This chunks and embeds the file, storing it in Supabase without a `repo_id` so it is accessible across all queries.

---

## Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Framework    | Next.js (App Router)                                                    |
| LLM          | Groq — `llama-3.3-70b-versatile`                                        |
| Embeddings   | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` (local, no API cost) |
| Vector store | Supabase with `pgvector`                                                |
| Styling      | Tailwind CSS                                                            |

---

## Project Structure

```
app/
  api/           # Route handlers: chat, ingest, security, structure, credits
  tools/[tool]/  # Shared UI for all 3 tools (chat | structure | security)
components/      # React components (ChatInterface, SecurityResults, StructureResults, …)
lib/
  rules/         # JSON rule definitions for Next.js, React, and generic checks
  llm.ts         # Groq client
  embeddings.ts  # Local HuggingFace embeddings
  retriever.ts   # Cosine-similarity RAG retriever
  security.ts    # Regex-based security scanner
  structure.ts   # Path-based structure analyser
  github.ts      # GitHub API helpers
  supabase.ts    # Supabase client
scripts/
  ingest.ts      # One-shot CLI to seed data/docs.txt into Supabase
```
