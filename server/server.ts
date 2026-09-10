import express, { Request, Response } from "express";
import cors from "cors";
import { mockTasks, mockMembers } from "./mockData";
import type { TeamMember } from "./types";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running!");
});

app.get("/api/tasks", (req: Request, res: Response) => {
  const { search, status, priority } = req.query;

  let result = mockTasks;

  if (search && typeof search === "string") {
    result = result.filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status && typeof status === "string") {
    result = result.filter((task) => task.status === status);
  }

  if (priority && typeof priority === "string") {
    result = result.filter((task) => task.priority === priority);
  }

  res.json(result);
});

app.get("/api/members", (req: Request, res: Response) => {
  res.json(mockMembers);
});

app.post("/api/members", (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  const newMember: TeamMember = {
    id: Date.now().toString(),
    name,
    email: email || undefined,
  };

  mockMembers.push(newMember);

  res.status(201).json(newMember);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});