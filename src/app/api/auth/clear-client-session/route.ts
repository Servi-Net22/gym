import { NextRequest, NextResponse } from "next/server";
import { CLIENT_SESSION_COOKIE } from "@/lib/client-session";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/mi/login";
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete(CLIENT_SESSION_COOKIE);
  return response;
}
