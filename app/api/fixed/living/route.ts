import { NextRequest, NextResponse } from "next/server";

import { saveLivingGroups } from "@/lib/server/repository";
import type { LivingGroup } from "@/lib/types/ledger";

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { rows: LivingGroup[] };
    await saveLivingGroups(body.rows ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "생활비 분류 저장 실패" },
      { status: 500 },
    );
  }
}
