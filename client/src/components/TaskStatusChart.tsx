import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import type { Task } from "../types";

// Colors pull from the shared design tokens in app.css so the chart
// follows theme changes automatically.
const COLORS = {
  todo: "var(--teal)",
  inProgress: "var(--yellow)",
  done: "var(--green)",
};

interface TaskStatusChartProps {
  title: string;
  tasks: Task[];
}

function TaskStatusChart({ title, tasks }: TaskStatusChartProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // compare by date only, ignore time of day

  // Status counts are a clean, non-overlapping partition of the given
  // tasks — an overdue "in-progress" task still counts as "in-progress"
  // here. Overdue is a separate dimension (timeliness, not status) and
  // is reported alongside the chart instead of stealing a slice from it.
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let overdueCount = 0;

  for (const task of tasks) {
    if (task.status === "todo") todoCount++;
    else if (task.status === "in-progress") inProgressCount++;
    else if (task.status === "done") doneCount++;

    if (task.status !== "done" && new Date(task.dueDate) < today) {
      overdueCount++;
    }
  }

  const total = tasks.length;

  const data = [
    { name: "To Do", value: todoCount, color: COLORS.todo },
    { name: "In Progress", value: inProgressCount, color: COLORS.inProgress },
    { name: "Done", value: doneCount, color: COLORS.done },
  ].filter((entry) => entry.value > 0); // hide empty slices instead of showing a 0% wedge

  if (total === 0) {
    return (
      <div className="task-status-chart">
        <div className="task-status-chart-heading">
          <div className="group-heading">
            <div>
              <span className="group-dot blue" />
              <h2>{title}</h2>
            </div>
          </div>
        </div>
        <p className="status-message">No tasks yet to show progress for.</p>
      </div>
    );
  }

  return (
    <div className="task-status-chart">
      <div className="task-status-chart-heading">
        <div className="group-heading">
          <div>
            <span className="group-dot blue" />
            <h2>{title}</h2>
          </div>
        </div>
        {overdueCount > 0 && (
          <span className="overdue-badge">
            {overdueCount} overdue
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            label={(props) => {
              const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
              const RADIAN = Math.PI / 180;
              const angle = midAngle ?? 0;
              const radius = innerRadius + (outerRadius - innerRadius) / 2;
              const x = cx + radius * Math.cos(-angle * RADIAN);
              const y = cy + radius * Math.sin(-angle * RADIAN);

              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={600}
                  className="chart-slice-label"
                >
                  {`${Math.round((Number(value) / total) * 100)}%`}
                </text>
              );
            }}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" strokeWidth={0} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TaskStatusChart;