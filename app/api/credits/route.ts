/**
 * app/api/credits/route.ts
 *
 * IP-based credit system — credits are shared across all browsers on the same IP.
 * Fingerprint = SHA-256(IP) — stored server-side only.
 *
 * Required Supabase table (run once in SQL editor):
 *
 *   CREATE TABLE IF NOT EXISTS user_credits (
 *     fingerprint TEXT PRIMARY KEY,
 *     credits     INTEGER      NOT NULL DEFAULT 3,
 *     reset_at    TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
 *   );
 *
 *   -- Allow the anon key to read and write (disable RLS or add policies):
 *   ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "allow all" ON user_credits FOR ALL USING (true) WITH CHECK (true);
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
  // Key on IP only so credits are shared across all browsers/devices on the same network
  return createHash("sha256").update(ip).digest("hex");
}

interface CreditRecord {
  credits: number;
  reset_at: string;
}

function freshResetAt(): string {
  return new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Read the current credit record for a fingerprint.
 * - If no record exists, inserts a fresh one.
 * - If the 24-hour window has expired, resets credits.
 * - If a DB read error occurs, does NOT write anything (avoids corrupting real data).
 */
async function resolveCredits(fingerprint: string): Promise<CreditRecord> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits, reset_at")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (error) {
    // DB is unavailable — fail open without writing so we don't reset real credits
    console.error("[credits] DB read error:", error.message);
    return { credits: DEFAULT_CREDITS, reset_at: freshResetAt() };
  }

  const now = new Date();

  if (!data) {
    // Genuinely new IP — insert a fresh record
    const reset_at = freshResetAt();
    const { error: insertError } = await supabase
      .from("user_credits")
      .insert({ fingerprint, credits: DEFAULT_CREDITS, reset_at });
    if (insertError) {
      console.error("[credits] insert error:", insertError.message);
    }
    return { credits: DEFAULT_CREDITS, reset_at };
  }

  // 24-hour window expired → reset credits
  if (new Date(data.reset_at) <= now) {
    const reset_at = freshResetAt();
    await supabase
      .from("user_credits")
      .update({ credits: DEFAULT_CREDITS, reset_at })
      .eq("fingerprint", fingerprint);
    return { credits: DEFAULT_CREDITS, reset_at };
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

/** POST /api/credits — consume 1 credit, returns new count */
export async function POST(req: Request) {
  try {
    const fingerprint = buildFingerprint(req);
    const record = await resolveCredits(fingerprint);

    if (record.credits <= 0) {
      return Response.json(
        {
          error: "No credits remaining. Resets in 24 hours.",
          credits: 0,
          ok: false,
        },
        { status: 402 },
      );
    }

    const newCredits = record.credits - 1;
    const { error } = await supabase
      .from("user_credits")
      .update({ credits: newCredits })
      .eq("fingerprint", fingerprint);

    if (error) {
      console.error("[credits POST] update error:", error.message);
      return Response.json(
        { error: "Failed to consume credit", ok: false },
        { status: 500 },
      );
    }

    return Response.json({ credits: newCredits, ok: true });
  } catch (err) {
    console.error("[credits POST]", err);
    return Response.json(
      { error: "Failed to consume credit", ok: false },
      { status: 500 },
    );
  }
}

/** DELETE /api/credits — refund 1 credit (used when a cached repo is served) */
export async function DELETE(req: Request) {
  try {
    const fingerprint = buildFingerprint(req);
    const record = await resolveCredits(fingerprint);

    const newCredits = Math.min(record.credits + 1, DEFAULT_CREDITS);
    const { error } = await supabase
      .from("user_credits")
      .update({ credits: newCredits })
      .eq("fingerprint", fingerprint);

    if (error) {
      console.error("[credits DELETE] update error:", error.message);
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ credits: newCredits, ok: true });
  } catch (err) {
    console.error("[credits DELETE]", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
