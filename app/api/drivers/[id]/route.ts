import { NextResponse } from "next/server";
import { getAdminUser } from "../../../auth";
import { updateDriver, updateDriverStatus } from "../../../../db/queries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });
  try {
    const { id } = await context.params;
    const input = await request.json() as Record<string, unknown>;
    return NextResponse.json(input.action === "availability" ? await updateDriverStatus(id, input) : await updateDriver(id, input));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Status pengemudi gagal diperbarui" }, { status: 400 });
  }
}
