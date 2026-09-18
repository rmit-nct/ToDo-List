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
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    "Use 3–32 letters, numbers, dots, underscores or hyphens.",
  );
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
  const record = await database.collection("limits").findOneAndUpdate(
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
