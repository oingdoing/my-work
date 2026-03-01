import { NextRequest, NextResponse } from "next/server";

import { getBootstrapData } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get("month") ?? undefined;
    const data = await getBootstrapData(month);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터 조회 실패" },
      { status: 500 },
    );
  }
}
