import { groq } from "../../../lib/llm";
import { retrieveContext } from "../../../lib/retriever";

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are a helpful AI assistant that answers questions about a GitHub repository.
Use the provided code context to give accurate, specific answers.
Reference file names and function names when relevant.
Keep your answer concise — no more than 180 words. Be direct, skip filler.`,

  structure: `You are a software architect analysing a GitHub repository.
Focus on high-level architecture, module boundaries, data flows, and design patterns.
Use the provided code context to explain the structure clearly and precisely.
Keep your answer concise — no more than 180 words.`,

  security: `You are a security expert reviewing a GitHub repository for vulnerabilities.
Look for OWASP Top 10 issues, hardcoded secrets, injection vulnerabilities, 
authentication weaknesses, and insecure patterns.
Be specific — name the files and code that are problematic.
If you find no significant issues state that clearly.
Keep your answer concise — no more than 180 words.`,
};

export async function POST(req: Request) {
  try {
    const { message, repoId, toolRole = "chat" } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const context = await retrieveContext(
      message,
      repoId as string | undefined,
    );
    const systemPrompt = SYSTEM_PROMPTS[toolRole] ?? SYSTEM_PROMPTS.chat;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nCode context from the repository:\n\`\`\`\n${context}\n\`\`\``,
        },
        { role: "user", content: message },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    return Response.json({
      response: completion.choices[0].message.content,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    console.error("[chat]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
