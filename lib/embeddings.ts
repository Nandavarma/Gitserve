export async function embed(text: string): Promise<number[]> {
  const res = await fetch(process.env.EMBEDDING_API!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error("Embedding API failed");
  }

  const data = await res.json();
  return data.embedding;
}
