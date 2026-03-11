import "dotenv/config";
import fs from "fs";
import { embed } from "../lib/embeddings";
import { supabase } from "../lib/supabase";
import { chunkText } from "../lib/chunk";

async function run() {
  const text = fs.readFileSync("data/docs.txt", "utf8");

  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embedding = await embed(chunk);

    await supabase.from("documents").insert({
      content: chunk,
      embedding,
    });
  }

  console.log("Documents indexed");
}

run();
