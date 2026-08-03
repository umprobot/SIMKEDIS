import { NextResponse } from "next/server";
import { getAdminUser } from "../../auth";
import { createVehicle } from "../../../db/queries";

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Login admin diperlukan" }, { status: 401 });
  try {
    const result = await createVehicle(await request.json() as Record<string, unknown>);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Data kendaraan tidak valid" }, { status: 400 });
  }
}
