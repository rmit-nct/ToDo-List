import { apiRequest } from "./api";

export type Account = {
  id: string;
  name: string;
  email: string;
  title: string;
  twoFactorEnabled: boolean;
  authMode?: "password" | "username";
  username?: string;
};

export async function signInWithUsername(username: string) {
  const csrfResponse = await fetch("/api/username/csrf");
  const { csrfToken } = await csrfResponse.json();
  if (!csrfResponse.ok || !csrfToken)
    throw new Error("Unable to start sign-in. Please try again.");
  const response = await fetch("/api/username/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      username: username.trim().toLowerCase(),
      json: "true",
      callbackUrl: `${window.location.origin}/account`,
    }),
  });
  const result = await response.json();
  if (
    !response.ok ||
    !result.url ||
    new URL(result.url, window.location.origin).searchParams.has("error")
  )
    throw new Error(
      "Unable to sign in. Check your username or try again shortly.",
    );
  return apiRequest<Account>("/username-session", {
    method: "POST",
    body: "{}",
  });
}
