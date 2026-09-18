import { createHash } from "node:crypto";
import mongoose from "mongoose";
import serverless from "serverless-http";
import { createServer } from "node:http";
import { scope, schemas } from "../backend/runtime-mongoose";

let indexesReady = false;

export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const uri = process.env.MONGODB_URI;
  if (!uri)
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  // Reuse the deployed secret as a stable key for the original account module.
  // This does not change existing secrets or stored account data.
  if (!process.env.SETTINGS_ENCRYPTION_KEY && process.env.NEXTAUTH_SECRET)
    process.env.SETTINGS_ENCRYPTION_KEY = createHash("sha256")
      .update(process.env.NEXTAUTH_SECRET)
      .digest("hex");
  process.env.APP_ORIGINS ||= process.env.NEXTAUTH_URL || url.origin;
  const connection = await mongoose
    .createConnection(uri, {
      dbName: process.env.MONGODB_DB,
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 10000,
    })
    .asPromise();
  try {
    return await scope.run(connection, async () => {
      if (url.pathname === "/api/health") {
        await connection.db!.command({ ping: 1 });
        return Response.json({ status: "ok" });
      }
      const { app } = await import("../backend/server");
      if (!indexesReady) {
        for (const [name, schema] of schemas) {
          const model =
            connection.models[name] || connection.model(name, schema);
          await model.createIndexes();
        }
        indexesReady = true;
      }
      const handleAsNodeRequest = (
        globalThis as typeof globalThis & {
          __nctHandleAsNodeRequest?: (
            port: number,
            request: Request,
          ) => Promise<Response>;
        }
      ).__nctHandleAsNodeRequest;
      if (handleAsNodeRequest) {
        const server = createServer((req, res) =>
          scope.run(connection, () => {
            // The native bridge may rewrite Origin to its internal routing host.
            // Validate the browser's original header in the unchanged Express middleware.
            const origin = request.headers.get("origin");
            if (origin) req.headers.origin = origin;
            else delete req.headers.origin;
            Object.defineProperty(req, "ip", {
              value: request.headers.get("cf-connecting-ip") || "127.0.0.1",
              configurable: true,
            });
            app(req, res);
          }),
        );
        await new Promise<void>((resolve) => server.listen(0, resolve));
        try {
          const address = server.address();
          if (!address || typeof address === "string")
            throw new Error("Missing adapter port");
          const response = await handleAsNodeRequest(address.port, request);
          const body = await response.arrayBuffer();
          const headers = new Headers(response.headers);
          headers.set("Cache-Control", "no-store");
          return new Response(body, { status: response.status, headers });
        } finally {
          server.close();
        }
      }
      const invoke = serverless(app);
      const result = (await invoke(
        {
          httpMethod: request.method,
          path: url.pathname,
          headers: Object.fromEntries(request.headers),
          queryStringParameters: Object.fromEntries(url.searchParams),
          requestContext: {
            identity: {
              sourceIp: request.headers.get("cf-connecting-ip") || "127.0.0.1",
            },
          },
          body: ["GET", "HEAD"].includes(request.method)
            ? null
            : await request.text(),
          isBase64Encoded: false,
        },
        {},
      )) as {
        statusCode: number;
        body: string;
        headers?: Record<string, string>;
        multiValueHeaders?: Record<string, string[]>;
        isBase64Encoded?: boolean;
      };
      const headers = new Headers(result.headers);
      for (const [name, values] of Object.entries(
        result.multiValueHeaders || {},
      )) {
        headers.delete(name);
        for (const value of values) headers.append(name, value);
      }
      headers.set("Cache-Control", "no-store");
      return new Response(
        result.isBase64Encoded
          ? Buffer.from(result.body, "base64")
          : result.body,
        { status: result.statusCode, headers },
      );
    });
  } finally {
    await connection.close();
  }
}
