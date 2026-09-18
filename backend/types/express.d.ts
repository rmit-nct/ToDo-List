// Augments Express's Request type with fields attached dynamically by
// middleware (account.js's optionalUser, and the /api/tasks membership
// check in server.ts). Without this, TypeScript has no way to know these
// properties exist, since they're set at runtime by plain-JS middleware
// rather than declared on the Request type itself.
export {};

declare global {
  namespace Express {
    interface Request {
      account?: {
        id: string;
        name: string;
        email: string;
        title?: string;
      };
      existingTask?: {
        id: string;
        workspaceId: string;
        createdAt?: string;
        creator?: { id: string; name: string; initials: string; color: string };
        [key: string]: unknown;
      };
    }
  }
}