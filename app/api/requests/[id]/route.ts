import { NextResponse } from "next/server";
import { getAdminUser } from "../../../auth";
import { updateRequest } from "../../../../db/queries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Login admin diperlukan" }, { status: 401 });
  try {
    const { id } = await context.params;
    await updateRequest(id, await request.json() as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Perubahan gagal" }, { status: 400 });
  }
}
