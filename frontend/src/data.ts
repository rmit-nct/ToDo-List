import type { Member, Task } from './types';

export const members: Member[] = [
  { id: 'm1', name: 'My Ngoc', initials: 'MN', color: '#ea9a73' },
  { id: 'm2', name: 'Thy Nguyen', initials: 'TN', color: '#72a6bd' },
  { id: 'm3', name: 'Phuong Tran', initials: 'PT', color: '#8c79bd' },
  { id: 'm4', name: 'Team Leader', initials: 'TL', color: '#5ca57d' },
];

const iso = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

export const seedTasks: Task[] = [
  { id: 't1', title: 'Finalize task data model', description: 'Confirm fields and validation with the team.', status: 'in-progress', priority: 'high', dueDate: iso(0), assignee: members[0], creator: members[0], workspaceId: 'web-dev', createdAt: iso(-5) },
  { id: 't2', title: 'Build dashboard stat cards', description: 'Connect totals to the task query.', status: 'todo', priority: 'medium', dueDate: iso(1), assignee: members[0], creator: members[1], workspaceId: 'web-dev', createdAt: iso(-3) },
  { id: 't3', title: 'Review accessible status control', status: 'todo', priority: 'high', dueDate: iso(-1), assignee: members[2], creator: members[0], workspaceId: 'web-dev', createdAt: iso(-6) },
  { id: 't4', title: 'Wire sprint board filters', status: 'done', priority: 'low', dueDate: iso(2), assignee: members[1], creator: members[0], workspaceId: 'web-dev', createdAt: iso(-8) },
  { id: 't5', title: 'Prepare mobile board layout', status: 'in-progress', priority: 'medium', dueDate: iso(4), assignee: members[3], creator: members[0], workspaceId: 'web-dev', createdAt: iso(-2) },
  { id: 't6', title: 'Document CRUD endpoints', status: 'done', priority: 'medium', dueDate: iso(0), assignee: members[0], creator: members[3], workspaceId: 'web-dev', createdAt: iso(-7) },
];
