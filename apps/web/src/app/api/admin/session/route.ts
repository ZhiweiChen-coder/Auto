import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({
    authenticated,
    configured: isAdminConfigured(),
  });
}
