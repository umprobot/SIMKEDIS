import { NextResponse } from "next/server";
import { createLoanRequest } from "../../../db/queries";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const result = await createLoanRequest(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Permohonan tidak valid" }, { status: 400 });
  }
}
