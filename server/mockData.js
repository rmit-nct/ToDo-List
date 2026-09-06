// Same shape as our frontend's mockData.ts

const mockTasks = [
  {
    id: "1",
    title: "Set up MongoDB connection",
    description: "",
    status: "To Do",
    priority: "High",
    dueDate: "2026-08-20",
    assignedMemberId: "m1",
  },
  {
    id: "2",
    title: "Build login page UI",
    description: "",
    status: "In Progress",
    priority: "Medium",
    dueDate: "2026-08-28",
    assignedMemberId: "m2",
  },
  {
    id: "3",
    title: "Write README",
    description: "",
    status: "Done",
    priority: "Low",
    dueDate: "2026-08-26",
    assignedMemberId: "m1",
  },
];

const mockMembers = [
  { id: "m1", name: "Alex", email: "alex@example.com" },
  { id: "m2", name: "Sam" },
];

// module.exports is how plain Node.js files share things with other files —
// it's the CommonJS equivalent of "export" in your TypeScript files.
module.exports = { mockTasks, mockMembers };