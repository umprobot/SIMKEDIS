import { NextResponse } from "next/server";
import { getOperatorUser } from "../../auth";
import { createFuelRecord } from "../../../db/queries";

export async function POST(request: Request) {
  if (!await getOperatorUser()) return NextResponse.json({ error: "Login pengguna diperlukan" }, { status: 401 });
  try {
    const result = await createFuelRecord(await request.json() as Record<string, unknown>);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Data pengisian BBM tidak valid" }, { status: 400 });
  }
}
