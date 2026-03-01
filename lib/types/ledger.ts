export type PurposeType = "생활비" | "구독&정기결제" | "경조사비";

export type LivingGroupType =
  | "연간구독"
  | "월간구독"
  | "기본생활"
  | "기타생활"
  | "낭비"
  | "카드분류";

export type PayCategory = {
  id: string;
  label: string;
  sortOrder: number;
};

export type CategoryType =
  | "고정저축"
  | "유동지출"
  | "고정지출"
  | "고정투자"
  | "추가지출"
  | "기타";

export type PurposeAccount = {
  id: string;
  purposeType: PurposeType;
  bankName: string;
  cardName: string;
  monthlyLimit: number;
  usageSummary: string;
  note: string;
  sortOrder: number;
};

export type LivingGroup = {
  id: string;
  groupType: LivingGroupType;
  label: string;
  defaultAmount: number;
  paymentMethod: string;
  memo: string;
  sortOrder: number;
};

export type AdditionalIncomeType = "이월금액" | "인센티브" | "연말정산" | "추가업무" | "기타";

export type MonthRecord = {
  id: string;
  yyyymm: string;
  salaryAmount: number;
  carryCashFromPrev: number;
  additionalIncomeType: AdditionalIncomeType;
  status: "draft" | "closed";
};

export type LedgerItem = {
  id: string;
  categoryType: CategoryType;
  itemName: string;
  amount: number;
  cardName?: string;
  memo: string;
  sortOrder: number;
  isFromPlan?: boolean;
};

export type BootstrapPayload = {
  ownerId: string;
  selectedMonth: string | null;
  months: MonthRecord[];
  purposeAccounts: PurposeAccount[];
  livingGroups: LivingGroup[];
  payCategories: PayCategory[];
  plannedItems: LedgerItem[];
  actualItems: LedgerItem[];
};

export type SettlementSummary = {
  plannedTotalOut: number;
  actualTotalOut: number;
  plannedAdditionalIncome: number;
  actualAdditionalIncome: number;
  plannedNetCash: number;
  actualNetCash: number;
  delta: number;
  categoryDelta: Record<CategoryType, number>;
};
