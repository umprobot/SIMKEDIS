import { NextResponse } from "next/server";
import { createManagedDriver, getAdminUser } from "../../auth";

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });
  try {
    return NextResponse.json(await createManagedDriver(await request.json() as Record<string, unknown>), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Akun driver tidak valid" }, { status: 400 });
  }
}
