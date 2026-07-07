import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const report = await req.text();
  console.warn("[csp-report]", report.slice(0, 4000));
  return new NextResponse(null, { status: 204 });
}
