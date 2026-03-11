/**
 * app/api/credits/route.ts
 *
 * Fingerprint-based credit system.
 * Fingerprint = SHA-256(IP + ":" + User-Agent) — stored server-side only.
 *
 * Required Supabase table (run once in SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS user_credits (
 *     fingerprint TEXT PRIMARY KEY,
 *     credits     INTEGER      NOT NULL DEFAULT 3,
 *     reset_at    TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
 *   );
 */

import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

const DEFAULT_CREDITS = 3;
const RESET_HOURS = 24;

function buildFingerprint(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

interface CreditRecord {
  credits: number;
  reset_at: string;
}

async function resolveCredits(fingerprint: string): Promise<CreditRecord> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits, reset_at")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  const now = new Date();
  const resetAt = new Date(now.getTime() + RESET_HOURS * 60 * 60 * 1000).toISOString();

  if (error || !data) {
    // New user — insert fresh record
    await supabase.from("user_credits").upsert(
      { fingerprint, credits: DEFAULT_CREDITS, reset_at: resetAt },
      { onConflict: "fingerprint" },
    );
    return { credits: DEFAULT_CREDITS, reset_at: resetAt };
  }

  // Check if the window has expired → reset
  if (new Date(data.reset_at) <= now) {
    await supabase
      .from("user_credits")
      .update({ credits: DEFAULT_CREDITS, reset_at: resetAt })
      .eq("fingerprint", fingerprint);
    return { credits: DEFAULT_CREDITS, reset_at: resetAt };
  }

  return { credits: data.credits, reset_at: data.reset_at };
}

/** GET /api/credits — returns current credit count */
export async function GET(req: Request) {
  try {
    const fingerprint = buildFingerprint(req);
    const record = await resolveCredits(fingerprint);
    return Response.json({ credits: record.credits, resetAt: record.reset_at });
  } catch (err) {
    console.error("[credits GET]", err);
    // Fail open so users aren't blocked by DB issues
    return Response.json({ credits: DEFAULT_CREDITS, resetAt: null });
  }
}

/** POST /api/credits — consume 1 credit */
export async function POST(req: Request) {
  try {
    const fingerprint = buildFingerprint(req);
    const record = await resolveCredits(fingerprint);

    if (record.credits <= 0) {
      return Response.json(
        { error: "No credits remaining. Resets in 24 hours.", credits: 0, ok: false },
        { status: 402 },
      );
    }

    const newCredits = record.credits - 1;
    await supabase
      .from("user_credits")
      .update({ credits: newCredits })
      .eq("fingerprint", fingerprint);

    return Response.json({ credits: newCredits, ok: true });
  } catch (err) {
    console.error("[credits POST]", err);
    return Response.json({ error: "Failed to consume credit", ok: false }, { status: 500 });
  }
}
