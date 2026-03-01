import { NextRequest, NextResponse } from "next/server";

import { deleteMonthData, saveMonthData } from "@/lib/server/repository";
import type { LedgerItem } from "@/lib/types/ledger";

type SaveMonthBody = {
  salaryAmount: number;
  carryCashFromPrev: number;
  additionalIncomeType?: string;
  plannedItems: LedgerItem[];
  actualItems: LedgerItem[];
};

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ yyyymm: string }> },
) {
  try {
    const { yyyymm } = await context.params;
    const body = (await request.json()) as SaveMonthBody;
    await saveMonthData({
      yyyymm,
      salaryAmount: Number(body.salaryAmount || 0),
      carryCashFromPrev: Number(body.carryCashFromPrev || 0),
      additionalIncomeType: body.additionalIncomeType ?? "이월금액",
      plannedItems: body.plannedItems ?? [],
      actualItems: body.actualItems ?? [],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "월 저장 실패" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ yyyymm: string }> },
) {
  try {
    const { yyyymm } = await context.params;
    await deleteMonthData(yyyymm);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "월 삭제 실패" },
      { status: 500 },
    );
  }
}
