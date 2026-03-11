import { supabase } from "./supabase";
import { embed } from "./embeddings";

/**
 * Retrieve the top-3 most relevant chunks for `query`.
 *
 * When `repoId` is supplied we:
 *  1. Fetch all chunks stored for that repo (client-side, max 600 rows).
 *  2. Compute cosine similarity locally and return the top 3.
 *
 * This avoids needing a custom Supabase RPC that supports a repo_id filter.
 * For the global fallback we delegate to the existing match_documents RPC.
 */
export async function retrieveContext(
  query: string,
  repoId?: string,
): Promise<string> {
  const embedding = (await embed(query)) as number[];

  if (repoId) {
    const { data: docs, error } = await supabase
      .from("documents")
      .select("content, embedding")
      .eq("repo_id", repoId)
      .limit(600);

    if (!error && docs && docs.length > 0) {
      const ranked = docs
        .map((d: { content: string; embedding: number[] }) => ({
          content: d.content,
          similarity: cosineSimilarity(embedding, d.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      return ranked.map((d) => d.content).join("\n\n---\n\n");
    }
  }

  // Global fallback (original behaviour)
  const { data } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: 3,
  });

  return ((data ?? []) as Array<{ content: string }>)
    .map((d) => d.content)
    .join("\n\n---\n\n");
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
