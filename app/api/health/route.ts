import connectDB from "@/lib/db";

export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}

export async function HEAD() {
  try {
    await connectDB();
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
