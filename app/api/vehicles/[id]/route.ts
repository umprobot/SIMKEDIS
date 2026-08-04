import { NextResponse } from "next/server";
import { getAdminUser } from "../../../auth";
import { deleteVehicle, updateVehicle } from "../../../../db/queries";

async function authorized() { return Boolean(await getAdminUser()); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Login admin diperlukan" }, { status: 401 });
  try {
    const { id } = await context.params;
    await updateVehicle(id, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Perubahan gagal" }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authorized()) return NextResponse.json({ error: "Login admin diperlukan" }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteVehicle(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Penghapusan gagal" }, { status: 400 });
  }
}
