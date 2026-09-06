// Pull in the tools we installed
const express = require("express");
const cors = require("cors");

// Pull in our mock data (destructuring, same idea as on the frontend)
const { mockTasks, mockMembers } = require("./mockData");

const app = express();

app.use(cors());
app.use(express.json());

// --- GET /api/tasks ---
// Supports optional query params: ?search=&status=&priority=
// Example: /api/tasks?status=To Do&priority=High
app.get("/api/tasks", (req, res) => {
  // req.query holds whatever comes after the "?" in the URL, as an object
  const { search, status, priority } = req.query;

  // Start with everything, then narrow it down step by step
  let result = mockTasks;

  if (search) {
    // Only keep tasks whose title includes the search text (case-insensitive)
    result = result.filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status) {
    result = result.filter((task) => task.status === status);
  }

  if (priority) {
    result = result.filter((task) => task.priority === priority);
  }

  // res.json() sends the data back as JSON, and sets the right headers automatically
  res.json(result);
});

// --- GET /api/members ---
// Just returns the whole list, no filtering needed per the spec
app.get("/api/members", (req, res) => {
  res.json(mockMembers);
});

// --- POST /api/members ---
// Adds a new member to the (currently in-memory) list
app.post("/api/members", (req, res) => {
  // req.body holds the JSON data sent by whoever called this route
  const { name, email } = req.body;

  // Basic validation: reject the request if name is missing
  if (!name || name.trim() === "") {
    // 400 = "Bad Request" — the client sent something invalid
    return res.status(400).json({ error: "Name is required" });
  }

  const newMember = {
    id: Date.now().toString(), // simple unique-ish id for now, since there's no real DB yet
    name,
    email: email || undefined,
  };

  mockMembers.push(newMember); // add it to our in-memory array

  // 201 = "Created" — the standard status code for a successful POST that made something new
  res.status(201).json(newMember);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});