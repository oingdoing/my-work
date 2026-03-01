import type {
  CategoryType,
  LedgerItem,
  LivingGroup,
  PayCategory,
  PurposeAccount,
} from "@/lib/types/ledger";

export const defaultPurposeAccounts: Omit<PurposeAccount, "id">[] = [
  {
    purposeType: "생활비",
    bankName: "국민",
    cardName: "삼성페이카드",
    monthlyLimit: 310000,
    usageSummary: "신용카드 한도를 정해둔 생활비 금액에 맞게 정한다.",
    note: "전월실적 30이상",
    sortOrder: 1,
  },
  {
    purposeType: "구독&정기결제",
    bankName: "신한",
    cardName: "신한처음카드",
    monthlyLimit: 310000,
    usageSummary: "",
    note: "전월실적 30이상",
    sortOrder: 2,
  },
  {
    purposeType: "경조사비",
    bankName: "",
    cardName: "민트현취카드",
    monthlyLimit: 100000,
    usageSummary: "매월 10만원씩 저축하고, 필요 시 연결 카드로 결제",
    note: "",
    sortOrder: 3,
  },
];

export const defaultLivingGroups: Omit<LivingGroup, "id">[] = [
  { groupType: "연간구독", label: "구독 (연간)", defaultAmount: 293727, paymentMethod: "", memo: "", sortOrder: 1 },
  { groupType: "월간구독", label: "구독 (월간)", defaultAmount: 73290, paymentMethod: "", memo: "", sortOrder: 2 },
  { groupType: "기본생활", label: "기본 생활", defaultAmount: 533000, paymentMethod: "", memo: "", sortOrder: 3 },
  { groupType: "기타생활", label: "기타 생활비", defaultAmount: 0, paymentMethod: "", memo: "", sortOrder: 4 },
  { groupType: "낭비", label: "낭비", defaultAmount: 0, paymentMethod: "", memo: "", sortOrder: 5 },
  { groupType: "카드분류", label: "카드별 분류", defaultAmount: 0, paymentMethod: "", memo: "", sortOrder: 6 },
];

export const defaultPayCategories: Omit<PayCategory, "id">[] = [
  { label: "삼성카드", sortOrder: 1 },
  { label: "신한처음", sortOrder: 2 },
  { label: "현금", sortOrder: 3 },
];

const categoryTemplate: Array<{ categoryType: CategoryType; itemName: string }> = [
  { categoryType: "고정저축", itemName: "비상금 저축" },
  { categoryType: "유동지출", itemName: "생활 변동비" },
  { categoryType: "고정지출", itemName: "정기 결제" },
  { categoryType: "고정투자", itemName: "ETF / 장기투자" },
  { categoryType: "추가지출", itemName: "예외 지출" },
  { categoryType: "기타", itemName: "기타" },
];

export const buildDefaultLedgerItems = (): Omit<LedgerItem, "id">[] => {
  return categoryTemplate.map((row, index) => ({
    categoryType: row.categoryType,
    itemName: row.itemName,
    amount: 0,
    cardName: "",
    memo: "",
    sortOrder: index + 1,
  }));
};
