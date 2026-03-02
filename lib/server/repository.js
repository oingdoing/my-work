import { randomUUID } from "crypto";

import { calculateSettlement } from "@/lib/calc/settlement";
import {
  buildDefaultLedgerItems,
  defaultLivingGroups,
  defaultPayCategories,
  defaultPurposeAccounts,
} from "@/lib/data/defaults";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const yyyymmNow = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const yyyymmNext = (yyyymm) => {
  const [yearStr, monthStr] = yyyymm.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return yyyymmNow();
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const ADDITIONAL_INCOME_TYPES = ["이월금액", "인센티브", "연말정산", "추가업무", "기타"];
const mapMonth = (row) => ({
  id: row.id,
  yyyymm: row.yyyymm,
  salaryAmount: Number(row.salary_amount || 0),
  carryCashFromPrev: Number(row.carry_cash_from_prev || 0),
  additionalIncomeType: ADDITIONAL_INCOME_TYPES.includes(row.additional_income_type)
    ? row.additional_income_type
    : "이월금액",
  taxDeduction: Number(row.tax_deduction ?? 0),
  status: row.status,
});

const mapLedger = (row) => ({
  id: row.id,
  categoryType: row.category_type,
  itemName: row.item_name,
  amount: Number(row.amount || 0),
  cardName: row.card_name ?? "",
  memo: row.memo,
  sortOrder: row.sort_order,
  isFromPlan: row.is_from_plan,
});

const getContext = () => {
  const env = getServerEnv();
  return { ownerId: env.ownerId, supabaseAdmin: getSupabaseAdmin() };
};

const ensureFixedDefaults = async () => {
  const { ownerId, supabaseAdmin } = getContext();
  const { count: purposeCount } = await supabaseAdmin
    .from("purpose_accounts")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (!purposeCount) {
    await supabaseAdmin.from("purpose_accounts").insert(
      defaultPurposeAccounts.map((row) => ({
        id: randomUUID(),
        owner_id: ownerId,
        purpose_type: row.purposeType,
        bank_name: row.bankName,
        card_name: row.cardName,
        monthly_limit: row.monthlyLimit,
        usage_summary: row.usageSummary,
        note: row.note,
        sort_order: row.sortOrder,
      })),
    );
  }

  const { count: livingCount } = await supabaseAdmin
    .from("living_groups")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (!livingCount) {
    await supabaseAdmin.from("living_groups").insert(
      defaultLivingGroups.map((row) => ({
        id: randomUUID(),
        owner_id: ownerId,
        group_type: row.groupType,
        label: row.label,
        default_amount: row.defaultAmount,
        payment_method: row.paymentMethod,
        memo: row.memo,
        sort_order: row.sortOrder,
      })),
    );
  }

  const { count: payCategoryCount } = await supabaseAdmin
    .from("payment_categories")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (!payCategoryCount) {
    await supabaseAdmin.from("payment_categories").insert(
      defaultPayCategories.map((row) => ({
        id: randomUUID(),
        owner_id: ownerId,
        label: row.label,
        sort_order: row.sortOrder,
      })),
    );
  }
};

export const createMonthFromPrevious = async (targetMonth) => {
  const { ownerId, supabaseAdmin } = getContext();
  const { data: months } = await supabaseAdmin
    .from("months")
    .select("id, yyyymm, salary_amount, carry_cash_from_prev, additional_income_type, tax_deduction, status")
    .eq("owner_id", ownerId)
    .order("yyyymm", { ascending: false });

  const latest = months?.[0] ?? null;
  const newYyyymm = targetMonth ?? (latest ? yyyymmNext(latest.yyyymm) : yyyymmNow());
  const { data: existing } = await supabaseAdmin
    .from("months")
    .select("id, yyyymm, salary_amount, carry_cash_from_prev, additional_income_type, tax_deduction, status")
    .eq("owner_id", ownerId)
    .eq("yyyymm", newYyyymm)
    .maybeSingle();

  if (existing) {
    return { month: mapMonth(existing), plannedItems: [], actualItems: [] };
  }

  let seedPlanned = buildDefaultLedgerItems();
  let carryCashFromPrev = 0;
  let salaryAmount = 0;

  const isNextMonth = latest && newYyyymm === yyyymmNext(latest.yyyymm);
  if (isNextMonth) {
    const { data: prevPlanned } = await supabaseAdmin
      .from("planned_items")
      .select("id, category_type, item_name, amount, card_name, memo, sort_order")
      .eq("owner_id", ownerId)
      .eq("month_id", latest.id)
      .order("sort_order", { ascending: true });

    const { data: prevActual } = await supabaseAdmin
      .from("actual_items")
      .select("id, category_type, item_name, amount, card_name, memo, sort_order, is_from_plan")
      .eq("owner_id", ownerId)
      .eq("month_id", latest.id)
      .order("sort_order", { ascending: true });

    const planned = (prevPlanned ?? []).map(mapLedger);
    const actual = (prevActual ?? []).map(mapLedger);

    const prevSettlement = calculateSettlement(
      Number(latest.salary_amount || 0),
      planned,
      actual,
      Number(latest.carry_cash_from_prev || 0),
      Number(latest.tax_deduction ?? 0),
    );
    carryCashFromPrev = prevSettlement.actualNetCash;
    salaryAmount = Number(latest.salary_amount || 0);

    if (planned.length > 0) {
      seedPlanned = planned.map((item, index) => ({
        categoryType: item.categoryType,
        itemName: item.itemName,
        amount: item.amount,
        cardName: item.cardName ?? "",
        memo: item.memo,
        sortOrder: index + 1,
      }));
    }
  }

  const { data: createdMonth, error: monthError } = await supabaseAdmin
    .from("months")
    .insert({
      id: randomUUID(),
      owner_id: ownerId,
      yyyymm: newYyyymm,
      salary_amount: salaryAmount,
      carry_cash_from_prev: carryCashFromPrev,
      additional_income_type: "이월금액",
      tax_deduction: 0,
      status: "draft",
    })
    .select("id, yyyymm, salary_amount, carry_cash_from_prev, additional_income_type, tax_deduction, status")
    .single();

  if (monthError || !createdMonth) throw monthError ?? new Error("월 생성 실패");

  const plannedRows = seedPlanned.map((item, index) => ({
    id: randomUUID(),
    owner_id: ownerId,
    month_id: createdMonth.id,
    category_type: item.categoryType,
    item_name: item.itemName,
    amount: item.amount,
    card_name: item.cardName ?? "",
    memo: item.memo,
    sort_order: index + 1,
  }));

  const actualRows = seedPlanned.map((item, index) => ({
    id: randomUUID(),
    owner_id: ownerId,
    month_id: createdMonth.id,
    category_type: item.categoryType,
    item_name: item.itemName,
    amount: item.amount,
    card_name: item.cardName ?? "",
    memo: item.memo,
    is_from_plan: true,
    sort_order: index + 1,
  }));

  const { data: savedPlanned } = await supabaseAdmin
    .from("planned_items")
    .insert(plannedRows)
    .select("id, category_type, item_name, amount, card_name, memo, sort_order");
  const { data: savedActual } = await supabaseAdmin
    .from("actual_items")
    .insert(actualRows)
    .select("id, category_type, item_name, amount, card_name, memo, sort_order, is_from_plan");

  return {
    month: mapMonth(createdMonth),
    plannedItems: (savedPlanned ?? []).map(mapLedger),
    actualItems: (savedActual ?? []).map(mapLedger),
  };
};

export const getBootstrapData = async (targetMonth) => {
  const { ownerId, supabaseAdmin } = getContext();
  await ensureFixedDefaults();

  const { data: monthRows } = await supabaseAdmin
    .from("months")
    .select("id, yyyymm, salary_amount, carry_cash_from_prev, additional_income_type, tax_deduction, status")
    .eq("owner_id", ownerId)
    .order("yyyymm", { ascending: false });

  let months = (monthRows ?? []).map(mapMonth);
  if (months.length === 0) {
    const created = await createMonthFromPrevious(targetMonth ?? yyyymmNow());
    months = [created.month];
  }

  const selectedMonth = targetMonth ?? months[0]?.yyyymm ?? null;
  const selectedMonthRecord = months.find((month) => month.yyyymm === selectedMonth) ?? months[0];

  const { data: purposeRows } = await supabaseAdmin
    .from("purpose_accounts")
    .select("id, purpose_type, bank_name, card_name, monthly_limit, usage_summary, note, sort_order")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });

  const { data: livingRows } = await supabaseAdmin
    .from("living_groups")
    .select("id, group_type, label, default_amount, payment_method, memo, sort_order")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });

  const { data: payCategoryRows } = await supabaseAdmin
    .from("payment_categories")
    .select("id, label, sort_order")
    .eq("owner_id", ownerId)
    .order("sort_order", { ascending: true });

  let plannedRows = [];
  let actualRows = [];
  if (selectedMonthRecord) {
    const plannedResult = await supabaseAdmin
      .from("planned_items")
      .select("id, category_type, item_name, amount, card_name, memo, sort_order")
      .eq("owner_id", ownerId)
      .eq("month_id", selectedMonthRecord.id)
      .order("sort_order", { ascending: true });
    plannedRows = plannedResult.data ?? [];

    const actualResult = await supabaseAdmin
      .from("actual_items")
      .select("id, category_type, item_name, amount, card_name, memo, sort_order, is_from_plan")
      .eq("owner_id", ownerId)
      .eq("month_id", selectedMonthRecord.id)
      .order("sort_order", { ascending: true });
    actualRows = actualResult.data ?? [];
  }

  return {
    ownerId,
    selectedMonth: selectedMonthRecord?.yyyymm ?? null,
    months,
    purposeAccounts: (purposeRows ?? []).map((row) => ({
      id: row.id,
      purposeType: row.purpose_type,
      bankName: row.bank_name,
      cardName: row.card_name,
      monthlyLimit: Number(row.monthly_limit || 0),
      usageSummary: row.usage_summary,
      note: row.note,
      sortOrder: row.sort_order,
    })),
    livingGroups: (livingRows ?? []).map((row) => ({
      id: row.id,
      groupType: row.group_type,
      label: row.label,
      defaultAmount: Number(row.default_amount || 0),
      paymentMethod: row.payment_method ?? "",
      memo: row.memo ?? "",
      sortOrder: row.sort_order,
    })),
    payCategories: (payCategoryRows ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sort_order,
    })),
    plannedItems: plannedRows.map(mapLedger),
    actualItems: actualRows.map(mapLedger),
  };
};

export const saveMonthData = async (params) => {
  const { ownerId, supabaseAdmin } = getContext();
  const { data: month, error } = await supabaseAdmin
    .from("months")
    .upsert(
      {
        owner_id: ownerId,
        yyyymm: params.yyyymm,
        salary_amount: params.salaryAmount,
        carry_cash_from_prev: params.carryCashFromPrev,
        additional_income_type: params.additionalIncomeType ?? "이월금액",
        tax_deduction: params.taxDeduction ?? 0,
        status: "draft",
      },
      { onConflict: "owner_id,yyyymm" },
    )
    .select("id")
    .single();
  if (error || !month) throw error ?? new Error("월 저장 실패");

  await supabaseAdmin.from("planned_items").delete().eq("owner_id", ownerId).eq("month_id", month.id);
  await supabaseAdmin.from("actual_items").delete().eq("owner_id", ownerId).eq("month_id", month.id);

  if (params.plannedItems?.length) {
    await supabaseAdmin.from("planned_items").insert(
      params.plannedItems.map((item, index) => ({
        id: randomUUID(),
        owner_id: ownerId,
        month_id: month.id,
        category_type: item.categoryType,
        item_name: item.itemName,
        amount: Number(item.amount || 0),
        card_name: item.cardName ?? "",
        memo: item.memo ?? "",
        sort_order: index + 1,
      })),
    );
  }

  if (params.actualItems?.length) {
    await supabaseAdmin.from("actual_items").insert(
      params.actualItems.map((item, index) => ({
        id: randomUUID(),
        owner_id: ownerId,
        month_id: month.id,
        category_type: item.categoryType,
        item_name: item.itemName,
        amount: Number(item.amount || 0),
        card_name: item.cardName ?? "",
        memo: item.memo ?? "",
        is_from_plan: Boolean(item.isFromPlan),
        sort_order: index + 1,
      })),
    );
  }
};

export const deleteMonthData = async (yyyymm) => {
  const { ownerId, supabaseAdmin } = getContext();
  const { count: monthCount, error: countError } = await supabaseAdmin
    .from("months")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (countError) throw countError;
  if ((monthCount ?? 0) <= 1) {
    throw new Error("데이터가 하나 이상 있어야 해요.");
  }

  const { data: month, error: monthError } = await supabaseAdmin
    .from("months")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("yyyymm", yyyymm)
    .maybeSingle();

  if (monthError) throw monthError;
  if (!month) {
    throw new Error("삭제할 월 데이터가 없습니다.");
  }

  const { error: deleteError } = await supabaseAdmin
    .from("months")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", month.id);

  if (deleteError) throw deleteError;
};

export const savePurposeAccounts = async (rows) => {
  const { ownerId, supabaseAdmin } = getContext();
  await supabaseAdmin.from("purpose_accounts").delete().eq("owner_id", ownerId);
  if (rows.length > 0) {
    await supabaseAdmin.from("purpose_accounts").insert(
      rows.map((row, index) => ({
        id: randomUUID(),
        owner_id: ownerId,
        purpose_type: row.purposeType,
        bank_name: row.bankName,
        card_name: row.cardName,
        monthly_limit: Number(row.monthlyLimit || 0),
        usage_summary: row.usageSummary,
        note: row.note,
        sort_order: index + 1,
      })),
    );
  }
};

export const saveLivingGroups = async (rows) => {
  const { ownerId, supabaseAdmin } = getContext();
  await supabaseAdmin.from("living_groups").delete().eq("owner_id", ownerId);
  if (rows.length > 0) {
    await supabaseAdmin.from("living_groups").insert(
      rows.map((row, index) => ({
        id: randomUUID(),
        owner_id: ownerId,
        group_type: row.groupType,
        label: row.label,
        default_amount: Number(row.defaultAmount || 0),
        payment_method: row.paymentMethod ?? "",
        memo: row.memo ?? "",
        sort_order: index + 1,
      })),
    );
  }
};

export const savePayCategories = async (rows) => {
  const { ownerId, supabaseAdmin } = getContext();
  await supabaseAdmin.from("payment_categories").delete().eq("owner_id", ownerId);
  if (rows.length > 0) {
    await supabaseAdmin.from("payment_categories").insert(
      rows.map((row, index) => ({
        id: randomUUID(),
        owner_id: ownerId,
        label: row.label,
        sort_order: index + 1,
      })),
    );
  }
};


