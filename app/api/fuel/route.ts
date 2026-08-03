import { NextResponse } from "next/server";
import { getAdminUser } from "../../auth";
import { createFuelRecord } from "../../../db/queries";

export async function POST(request: Request) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Login admin diperlukan" }, { status: 401 });
  try {
    const result = await createFuelRecord(await request.json() as Record<string, unknown>);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Data pengisian BBM tidak valid" }, { status: 400 });
  }
}
