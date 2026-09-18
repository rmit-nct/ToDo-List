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
    page.getByRole("heading", { name: "Create Workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/nct-qa/original-entry.png",
    fullPage: true,
  });
  await page
    .getByLabel("Workspace Name", { exact: true })
    .fill("Design studio");
  await page.getByLabel("Your Name", { exact: true }).fill("Original creator");
  await page
    .getByRole("button", { name: "Create Workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Homepage", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Today Dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Today Dashboard", exact: true }),
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
  await page
    .getByRole("link", { name: "Weekly Sprint Board", exact: true })
    .click();
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
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Homepage", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Member", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Member name", { exact: true })
    .fill("Original member form");
  await page.getByRole("button", { name: "Add Member", exact: true }).click();
  await expect(page.getByLabel("Member name", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("link", {
      name: /Calendar|Team workload|Overview/,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Today Dashboard", exact: true })
    .click();
  await page
    .getByLabel("Search tasks", { exact: true })
    .fill("not a matching task");
  await expect(
    page.getByRole("heading", { name: "Prepare the project demo" }),
  ).toBeHidden();
  await page.getByLabel("Search tasks", { exact: true }).fill("");
  await page.getByRole("heading", { name: "Prepare the project demo" }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Edited task description");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await expect(
    page.getByText("Edited task description", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/nct-qa/today-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("link", { name: "Weekly Sprint Board", exact: true })
    .click();
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
    "Browser QA passed: original entry, original Home and member form, creation, reload persistence, quick actions, column collapse, theme persistence, mobile navigation, dialog Escape, deletion; no page errors or horizontal overflow.",
  );
} finally {
  await browser.close();
}
