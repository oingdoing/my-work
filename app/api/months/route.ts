import { NextRequest, NextResponse } from "next/server";

import { createMonthFromPrevious } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { yyyymm?: string };
    const result = await createMonthFromPrevious(body.yyyymm);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "월 생성 실패" },
      { status: 500 },
    );
  }
}
