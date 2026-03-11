const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_API_URL = `https://router.huggingface.co/hf-inference/pipeline/feature-extraction/${HF_MODEL}`;

/**
 * Embed a single string via the HuggingFace Inference API.
 * Returns a 384-dimensional float array (same dimension as the local model).
 *
 * Requires env var: HF_API_KEY  (create a free token at huggingface.co/settings/tokens)
 */
export async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY environment variable is not set");

  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HuggingFace embed error ${res.status}: ${body}`);
  }

  const data: number[] | number[][] = await res.json();
  // The API may return a nested array [[...]] or a flat array [...]
  return Array.isArray(data[0]) ? (data as number[][])[0] : (data as number[]);
}
