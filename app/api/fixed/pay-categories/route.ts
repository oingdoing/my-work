import { NextRequest, NextResponse } from "next/server";

import { savePayCategories } from "@/lib/server/repository";
import type { PayCategory } from "@/lib/types/ledger";

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { rows: PayCategory[] };
    await savePayCategories(body.rows ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "결제 수단 저장 실패" },
      { status: 500 },
    );
  }
}
