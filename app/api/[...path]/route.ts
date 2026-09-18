export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function route(request: Request) {
  try {
    // MongoDB and Mongoose initialize inside the Worker request context.
    const { handleRequest } = await import("../../backend-handler");
    return await handleRequest(request);
  } catch (error) {
    console.error("API request failed", {
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "The service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
export {
  route as GET,
  route as POST,
  route as PUT,
  route as PATCH,
  route as DELETE,
};
