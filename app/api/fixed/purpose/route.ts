import { NextRequest, NextResponse } from "next/server";

import { savePurposeAccounts } from "@/lib/server/repository";
import type { PurposeAccount } from "@/lib/types/ledger";

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { rows: PurposeAccount[] };
    await savePurposeAccounts(body.rows ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "목적별 계좌 저장 실패" },
      { status: 500 },
    );
  }
}
