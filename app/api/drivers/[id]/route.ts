import { NextResponse } from "next/server";
import { getAdminUser } from "../../../auth";
import { updateDriverStatus } from "../../../../db/queries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });
  try {
    const { id } = await context.params;
    return NextResponse.json(await updateDriverStatus(id, await request.json() as Record<string, unknown>));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Status pengemudi gagal diperbarui" }, { status: 400 });
  }
}
