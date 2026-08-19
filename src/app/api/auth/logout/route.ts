import { NextResponse } from "next/server";
import { apagarToken } from "@/lib/session";

export async function POST() {
  await apagarToken();
  return NextResponse.json({ ok: true });
}
