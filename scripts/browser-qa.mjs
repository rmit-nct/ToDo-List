import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_URL || "http://localhost:3100";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("/tmp/nct-qa", { recursive: true });
try {
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/nct-qa/login-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  const username = `browser-${Date.now()}`;
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `Hello, ${username}.` }),
  ).toBeVisible();
  await page.getByLabel("Workspace name").fill("Design studio");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Today Dashboard" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Prepare the project demo");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Review the flow together and capture our final screenshots.");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sprint board", exact: true }).click();
  await page
    .getByRole("button", { name: "Quick actions for Prepare the project demo" })
    .click();
  await page.getByRole("button", { name: "In progress", exact: true }).click();
  await expect(page.locator('[data-status="in-progress"]')).toContainText(
    "Prepare the project demo",
  );
  await page.getByRole("button", { name: "Collapse In progress" }).click();
  await expect(page.locator("#in-progress-column-tasks")).toBeHidden();
  await page.getByRole("button", { name: "Expand In progress" }).click();
  await page.screenshot({
    path: "/tmp/nct-qa/board-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator(".app")).toHaveClass(/theme-dark/);
  await page.reload();
  await expect(page.locator(".app")).toHaveClass(/theme-dark/);
  await page.screenshot({
    path: "/tmp/nct-qa/board-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: "My tasks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deadline calendar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.screenshot({
    path: "/tmp/nct-qa/calendar-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Team workload", exact: true }).click();
  await page.getByRole("link", { name: `View tasks for ${username}` }).click();
  await expect(page.getByLabel("Filter by assignee")).not.toHaveValue("all");
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  await expect((await download).suggestedFilename()).toMatch(/nct-tasks.*csv/);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByLabel("Display name").fill("QA Updated");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Changes saved." }),
  ).toBeVisible();
  await expect(page.locator(".profile strong")).toHaveText("QA Updated");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("link", { name: "Sprint board", exact: true }).click();
  await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
  await expect(
    page.getByRole("heading", { name: "Weekly Sprint Board" }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/nct-qa/board-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw new Error("Mobile page overflows horizontally");
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByRole("button", { name: "Quick actions for Prepare the project demo" })
    .click();
  page.once("dialog", (d) => d.accept());
  await page.screenshot({
    path: "/tmp/nct-qa/popup-mobile.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeHidden();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Browser QA passed: username login, calendar, workload filtering, CSV export, creation, reload persistence, quick actions, column collapse, theme persistence, My Tasks, profile save, mobile navigation, dialog Escape, deletion; no page errors or horizontal overflow.",
  );
} finally {
  await browser.close();
}
