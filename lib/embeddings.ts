import { pipeline } from "@xenova/transformers";

let extractor: any;

export async function embed(text: string) {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(result.data);
}
