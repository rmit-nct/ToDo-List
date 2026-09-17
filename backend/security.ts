import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72, "Use at most 72 characters.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 bytes.",
  );
export const nameSchema = z.string().trim().min(1).max(80);
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function rateLimit(
  scope: string,
  identity: string,
  max: number,
  minutes = 15,
) {
  const database = await db();
  const window = Math.floor(Date.now() / (minutes * 60000));
  const key = digest(`${scope}:${identity}:${window}`);
  const record = await database
    .collection("limits")
    .findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expires: new Date((window + 1) * minutes * 60000) },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (record!.count > max)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
export function checkOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Use JSON for this request.");
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 32768)
    throw new HttpError(413, "Request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
