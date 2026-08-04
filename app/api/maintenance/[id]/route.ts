import { NextResponse } from "next/server";
import { getOperatorUser } from "../../../auth";
import { updateMaintenanceRecord } from "../../../../db/queries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!await getOperatorUser()) return NextResponse.json({ error: "Login pengguna diperlukan" }, { status: 401 });
    const { id } = await context.params;
    return NextResponse.json(await updateMaintenanceRecord(id, await request.json() as Record<string, unknown>));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memperbarui pemeliharaan" }, { status: 400 }); }
}
