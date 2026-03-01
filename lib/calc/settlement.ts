import type { CategoryType, LedgerItem, SettlementSummary } from "@/lib/types/ledger";

const outgoingCategories: CategoryType[] = [
  "고정저축",
  "유동지출",
  "고정지출",
  "고정투자",
  "추가지출",
  "기타",
];

const sumCategory = (items: LedgerItem[], categoryType: CategoryType): number =>
  items
    .filter((item) => item.categoryType === categoryType)
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);

const sumOutgoing = (items: LedgerItem[]): number =>
  outgoingCategories.reduce((acc, category) => acc + sumCategory(items, category), 0);

export const calculateSettlement = (
  salary: number,
  plannedItems: LedgerItem[],
  actualItems: LedgerItem[],
  carryCashFromPrev = 0,
): SettlementSummary => {
  const plannedTotalOut = sumOutgoing(plannedItems);
  const actualTotalOut = sumOutgoing(actualItems);
  const plannedNetCash =
    Number(salary || 0) + Number(carryCashFromPrev || 0) - plannedTotalOut;
  const actualNetCash =
    Number(salary || 0) + Number(carryCashFromPrev || 0) - actualTotalOut;

  const categories: CategoryType[] = [
    "고정저축",
    "유동지출",
    "고정지출",
    "고정투자",
    "추가지출",
    "기타",
  ];

  const categoryDelta = categories.reduce<Record<CategoryType, number>>((acc, category) => {
    acc[category] = sumCategory(plannedItems, category) - sumCategory(actualItems, category);
    return acc;
  }, {} as Record<CategoryType, number>);

  return {
    plannedTotalOut,
    actualTotalOut,
    plannedAdditionalIncome: 0,
    actualAdditionalIncome: 0,
    plannedNetCash,
    actualNetCash,
    delta: actualNetCash - plannedNetCash,
    categoryDelta,
  };
};
