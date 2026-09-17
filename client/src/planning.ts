import type { Task } from "./types";
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from(
    { length: 42 },
    (_, i) =>
      new Date(first.getFullYear(), first.getMonth(), first.getDate() + i),
  );
}
export function taskCsv(tasks: Task[]): string {
  // Quote every field and neutralize spreadsheet formulas, including leading whitespace.
  const cell = (value: string) =>
    `"${(/^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  return [
    ["Title", "Description", "Status", "Priority", "Due date", "Assignee"],
    ...tasks.map((t) => [
      t.title,
      t.description ?? "",
      t.status,
      t.priority,
      t.dueDate.slice(0, 10),
      t.assignee?.name ?? "Unassigned",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function downloadTasks(tasks: Task[]) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", taskCsv(tasks)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `nct-tasks-${dateKey(new Date())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
