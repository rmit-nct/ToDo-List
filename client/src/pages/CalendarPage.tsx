import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { useTasks } from "../taskStoreContext";
import { useWorkspace } from "../workspaceContext";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { dateKey, monthDays } from "../planning";
import type { Task } from "../types";
export function CalendarPage() {
  const { tasks, isLoading, error } = useTasks();
  const { workspace } = useWorkspace();
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [showDone, setShowDone] = useState(false);
  const [modal, setModal] = useState<Task | null | undefined>();
  const active = tasks.filter((t) => showDone || t.status !== "done");
  const selectedTasks = active.filter(
    (t) => t.dueDate.slice(0, 10) === selected,
  );
  const today = dateKey(new Date());
  const heading = month.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  function jumpToday() {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(dateKey(now));
  }
  return (
    <div className="page planning-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE ROOM FOR WHAT'S NEXT</p>
          <h1>Deadline calendar</h1>
          <span>See the busy days before they become a rush.</span>
        </div>
        <button className="primary" onClick={() => setModal(null)}>
          <Plus /> New task
        </button>
      </div>
      <div className="calendar-layout">
        <section className="calendar-panel" aria-label="Deadline calendar">
          <div className="calendar-toolbar">
            <h2 aria-live="polite">{heading}</h2>
            <div>
              <button
                aria-label="Previous month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft />
              </button>
              <button onClick={jumpToday}>Today</button>
              <button
                aria-label="Next month"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <label className="calendar-option">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
            />{" "}
            Include completed tasks
          </label>
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span className="weekday" key={day}>
                {day}
              </span>
            ))}
            {monthDays(month).map((day) => {
              const key = dateKey(day);
              const due = active.filter((t) => t.dueDate.slice(0, 10) === key);
              return (
                <button
                  key={key}
                  className={`calendar-day ${day.getMonth() !== month.getMonth() ? "outside" : ""} ${key === today ? "is-today" : ""}`}
                  aria-label={`${day.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}, ${due.length} tasks`}
                  aria-pressed={selected === key}
                  onClick={() => {
                    setSelected(key);
                    setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                >
                  <strong>{day.getDate()}</strong>
                  {due.length > 0 && (
                    <>
                      <span className="calendar-count">
                        {due.length} <span>due</span>
                      </span>
                      <span className="calendar-preview">{due[0].title}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <section className="day-agenda" aria-label="Selected day tasks">
          <div className="section-heading">
            <h2>
              {new Date(selected + "T12:00:00").toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
            </h2>
            <span>{selectedTasks.length} tasks</span>
          </div>
          {selectedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={setModal} />
          ))}
          {!selectedTasks.length && !isLoading && !error && (
            <div className="empty-state roomy">
              <CalendarDays />
              <h3>A little breathing room</h3>
              <p>
                {showDone
                  ? "No deadlines on this day."
                  : "No open deadlines on this day."}
              </p>
            </div>
          )}
          <button className="add-card" onClick={() => setModal(null)}>
            <Plus /> Add task for this day
          </button>
        </section>
      </div>
      {modal !== undefined && (
        <TaskModal
          task={modal ?? undefined}
          initialDate={selected}
          workspaceId={workspace.id}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  );
}
