import { NextResponse } from "next/server";
import { isAdminRequest } from "@/src/lib/admin-auth";
import { deleteContactData, isDatabaseConfigured } from "@/src/lib/persistence";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest()) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "The database is not configured." }, { status: 503 });
  const { id } = await params;
  try {
    const result = await deleteContactData(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Could not delete contact", error);
    return NextResponse.json({ error: "We could not delete this contact." }, { status: 500 });
  }
}
