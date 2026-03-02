"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { calculateSettlement } from "@/lib/calc/settlement";
import type {
  BootstrapPayload,
  CategoryType,
  LedgerItem,
  LivingGroup,
  PayCategory,
  PurposeAccount,
} from "@/lib/types/ledger";

const categories: CategoryType[] = [
  "고정저축",
  "유동지출",
  "고정지출",
  "고정투자",
  "추가지출",
  "기타",
];

const livingTypes = ["연간구독", "월간구독", "기본생활", "기타생활", "낭비", "카드분류"] as const;

const additionalIncomeTypes = ["이월금액", "인센티브", "연말정산", "추가업무", "기타"] as const;

const formatKRW = (value: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatAmount = (value: number): string =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value || 0);

const parseAmountInput = (value: string): number => Number(value.replace(/[^\d]/g, "") || 0);

const prevYyyymm = (yyyymm: string): string => {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const emptyPurpose = (): PurposeAccount => ({
  id: crypto.randomUUID(),
  purposeType: "생활비",
  bankName: "",
  cardName: "",
  monthlyLimit: 0,
  usageSummary: "",
  note: "",
  sortOrder: 0,
});

const emptyLiving = (): LivingGroup => ({
  id: crypto.randomUUID(),
  groupType: "기본생활",
  label: "",
  defaultAmount: 0,
  paymentMethod: "",
  memo: "",
  sortOrder: 0,
});

const emptyPayCategory = (): PayCategory => ({
  id: crypto.randomUUID(),
  label: "",
  sortOrder: 0,
});

const emptyLedger = (): LedgerItem => ({
  id: crypto.randomUUID(),
  categoryType: "유동지출",
  itemName: "",
  amount: 0,
  cardName: "",
  memo: "",
  sortOrder: 0,
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [months, setMonths] = useState<BootstrapPayload["months"]>([]);
  const [salaryAmount, setSalaryAmount] = useState(0);
  const [carryCashFromPrev, setCarryCashFromPrev] = useState(0);
  const [taxDeduction, setTaxDeduction] = useState(0);
  const [additionalIncomeType, setAdditionalIncomeType] = useState<"이월금액" | "인센티브" | "연말정산" | "추가업무" | "기타">("이월금액");
  const [purposeAccounts, setPurposeAccounts] = useState<PurposeAccount[]>([]);
  const [livingGroups, setLivingGroups] = useState<LivingGroup[]>([]);
  const [payCategories, setPayCategories] = useState<PayCategory[]>([]);
  const [isPurposeEditing, setIsPurposeEditing] = useState(false);
  const [isLivingEditing, setIsLivingEditing] = useState(false);
  const [isPlannedEditing, setIsPlannedEditing] = useState(false);
  const [isActualEditing, setIsActualEditing] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isDeleteMonthConfirmOpen, setIsDeleteMonthConfirmOpen] = useState(false);
  const [isDeleteMonthBlockedAlertOpen, setIsDeleteMonthBlockedAlertOpen] = useState(false);
  const [isCreateNextMonthConfirmOpen, setIsCreateNextMonthConfirmOpen] = useState(false);
  const [isCreatePrevMonthConfirmOpen, setIsCreatePrevMonthConfirmOpen] = useState(false);
  const [isSaveBasicDataConfirmOpen, setIsSaveBasicDataConfirmOpen] = useState(false);
  const [isCrossSectionEditAlertOpen, setIsCrossSectionEditAlertOpen] = useState(false);
  const [isPayCategoryEditorOpen, setIsPayCategoryEditorOpen] = useState(false);
  const [isPayCategoryDeleteConfirmOpen, setIsPayCategoryDeleteConfirmOpen] = useState(false);
  const [pendingPayCategoryDeleteId, setPendingPayCategoryDeleteId] = useState<string | null>(null);
  const [draftPayCategories, setDraftPayCategories] = useState<PayCategory[]>([]);
  const [isEditSwitchAlertOpen, setIsEditSwitchAlertOpen] = useState(false);
  const [isSaveBlockedAlertOpen, setIsSaveBlockedAlertOpen] = useState(false);
  const [pendingEditTarget, setPendingEditTarget] = useState<"purpose" | "living" | "planned" | "actual" | null>(null);
  const [isCopyMonthDataOpen, setIsCopyMonthDataOpen] = useState(false);
  const [copySourceMonth, setCopySourceMonth] = useState<string>("");
  const [plannedItems, setPlannedItems] = useState<LedgerItem[]>([]);
  const [actualItems, setActualItems] = useState<LedgerItem[]>([]);
  const [isSalaryHidden, setIsSalaryHidden] = useState(true);

  const selectedMonthRecord = months.find((m) => m.yyyymm === selectedMonth);
  useEffect(() => {
    if (!selectedMonthRecord) return;
    setSalaryAmount(selectedMonthRecord.salaryAmount);
    setCarryCashFromPrev(selectedMonthRecord.carryCashFromPrev);
    setTaxDeduction(selectedMonthRecord.taxDeduction ?? 0);
  }, [selectedMonthRecord]);

  const settlement = useMemo(
    () =>
      calculateSettlement(
        salaryAmount,
        plannedItems,
        actualItems,
        carryCashFromPrev,
        taxDeduction,
      ),
    [salaryAmount, plannedItems, actualItems, carryCashFromPrev, taxDeduction],
  );
  const categoryExpenseStats = useMemo(() => {
    return categories.map((categoryType) => {
      const plannedSum = plannedItems
        .filter((item) => item.categoryType === categoryType)
        .reduce((acc, item) => acc + Number(item.amount || 0), 0);
      const actualSum = actualItems
        .filter((item) => item.categoryType === categoryType)
        .reduce((acc, item) => acc + Number(item.amount || 0), 0);
      return { categoryType, plannedSum, actualSum };
    });
  }, [plannedItems, actualItems]);
  const cardSummary = useMemo(() => {
    if (payCategories.length === 0) return [];
    return payCategories.map((category) => {
      const sum = actualItems.reduce((acc, item) => {
        return item.cardName === category.label ? acc + Number(item.amount || 0) : acc;
      }, 0);
      return { label: category.label, amount: sum };
    });
  }, [actualItems, payCategories]);
  const livingPaymentSummary = useMemo(() => {
    if (payCategories.length === 0) return [];
    return payCategories.map((category) => {
      const sum = livingGroups.reduce((acc, item) => {
        return item.paymentMethod === category.label ? acc + Number(item.defaultAmount || 0) : acc;
      }, 0);
      return { label: category.label, amount: sum };
    });
  }, [livingGroups, payCategories]);
  const livingPaymentTotal = useMemo(
    () => livingPaymentSummary.reduce((sum, row) => sum + row.amount, 0),
    [livingPaymentSummary],
  );
  const livingGroupTypeSummary = useMemo(() => {
    return livingTypes.map((type) => {
      const sum = livingGroups.reduce((acc, item) => {
        return item.groupType === type ? acc + Number(item.defaultAmount || 0) : acc;
      }, 0);
      return { label: type, amount: sum };
    });
  }, [livingGroups]);
  const livingGroupTypeTotal = useMemo(
    () => livingGroupTypeSummary.reduce((sum, row) => sum + row.amount, 0),
    [livingGroupTypeSummary],
  );

  /* 테이블 정렬: 1차 분류(가나다순), 2차 금액(높은→낮은) */
  const sortedPurposeAccounts = useMemo(
    () =>
      [...purposeAccounts].sort((a, b) => {
        const cmp = a.purposeType.localeCompare(b.purposeType, "ko-KR");
        if (cmp !== 0) return cmp;
        return (b.monthlyLimit ?? 0) - (a.monthlyLimit ?? 0);
      }),
    [purposeAccounts],
  );
  const sortedLivingGroups = useMemo(
    () =>
      [...livingGroups].sort((a, b) => {
        const cmp = a.groupType.localeCompare(b.groupType, "ko-KR");
        if (cmp !== 0) return cmp;
        return (b.defaultAmount ?? 0) - (a.defaultAmount ?? 0);
      }),
    [livingGroups],
  );
  const sortedPlannedItems = useMemo(
    () =>
      [...plannedItems].sort((a, b) => {
        const cmp = a.categoryType.localeCompare(b.categoryType, "ko-KR");
        if (cmp !== 0) return cmp;
        return (b.amount ?? 0) - (a.amount ?? 0);
      }),
    [plannedItems],
  );
  const sortedActualItems = useMemo(
    () =>
      [...actualItems].sort((a, b) => {
        const cmp = a.categoryType.localeCompare(b.categoryType, "ko-KR");
        if (cmp !== 0) return cmp;
        return (b.amount ?? 0) - (a.amount ?? 0);
      }),
    [actualItems],
  );
  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonth) return "-";
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return selectedMonth;
    return `${year}년 ${String(month).padStart(2, "0")}월`;
  }, [selectedMonth]);
  const orderedMonths = useMemo(
    () => [...months].sort((a, b) => a.yyyymm.localeCompare(b.yyyymm)),
    [months],
  );
  const currentMonthIndex = useMemo(
    () => orderedMonths.findIndex((month) => month.yyyymm === selectedMonth),
    [orderedMonths, selectedMonth],
  );
  const prevMonth = currentMonthIndex > 0 ? orderedMonths[currentMonthIndex - 1] : null;
  const nextMonth =
    currentMonthIndex >= 0 && currentMonthIndex < orderedMonths.length - 1
      ? orderedMonths[currentMonthIndex + 1]
      : null;
  const showToast = (text: string, type: "success" | "error") => {
    setMessageType(type);
    setMessage(text);
  };

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const loadData = useCallback(async (month?: string, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const query = month ? `?month=${encodeURIComponent(month)}` : "";
      const response = await fetch(`/api/bootstrap${query}`, { cache: "no-store" });
      const data = (await response.json()) as BootstrapPayload;
      if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");

      setMonths(data.months);
      setSelectedMonth(data.selectedMonth);
      setPurposeAccounts(data.purposeAccounts);
      setLivingGroups(data.livingGroups);
      setPayCategories(data.payCategories);
      setPlannedItems(data.plannedItems);
      setActualItems(data.actualItems);

      const monthData = data.months.find((m) => m.yyyymm === data.selectedMonth) ?? data.months[0];
      setSalaryAmount(monthData?.salaryAmount ?? 0);
      setCarryCashFromPrev(monthData?.carryCashFromPrev ?? 0);
      setTaxDeduction(monthData?.taxDeduction ?? 0);
      setAdditionalIncomeType(monthData?.additionalIncomeType ?? "이월금액");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "조회 실패", "error");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveFixed = async () => {
    setSaving(true);
    setMessage("");
    try {
      const [purposeRes, livingRes] = await Promise.all([
        fetch("/api/fixed/purpose", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: purposeAccounts }),
        }),
        fetch("/api/fixed/living", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: livingGroups }),
        }),
      ]);
      if (!purposeRes.ok || !livingRes.ok) throw new Error("고정 정보 저장 실패");
      showToast("기본 설정을 저장했습니다.", "success");
      await loadData(selectedMonth ?? undefined);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "저장 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePayCategorySettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const cleanedRows = draftPayCategories
        .map((row, index) => ({
          ...row,
          label: row.label.trim(),
          sortOrder: index + 1,
        }))
        .filter((row) => row.label.length > 0);

      const response = await fetch("/api/fixed/pay-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: cleanedRows }),
      });
      if (!response.ok) throw new Error("결제 수단 저장 실패");

      setIsPayCategoryEditorOpen(false);
      showToast("결제 수단 설정을 저장했습니다.", "success");
      await loadData(selectedMonth ?? undefined);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "저장 실패", "error");
    } finally {
      setSaving(false);
    }
  };
  const openPayCategoryDeleteConfirm = (id: string) => {
    setPendingPayCategoryDeleteId(id);
    setIsPayCategoryDeleteConfirmOpen(true);
  };
  const confirmDeletePayCategory = () => {
    if (!pendingPayCategoryDeleteId) return;
    setDraftPayCategories((prev) => prev.filter((item) => item.id !== pendingPayCategoryDeleteId));
    setPendingPayCategoryDeleteId(null);
    setIsPayCategoryDeleteConfirmOpen(false);
  };

  const isAnyEditing =
    isPurposeEditing || isLivingEditing || isPlannedEditing || isActualEditing;

  const saveMonth = async () => {
    if (!selectedMonth) return;
    if (isAnyEditing) {
      setIsSaveBlockedAlertOpen(true);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/months/${selectedMonth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryAmount,
          carryCashFromPrev,
          additionalIncomeType,
          taxDeduction,
          plannedItems,
          actualItems,
        }),
      });
      if (!response.ok) throw new Error("월 저장 실패");
      showToast("월 데이터를 저장했습니다.", "success");
      await loadData(selectedMonth);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "저장 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  const createNextMonth = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "월 생성 실패");
      showToast(`${data.month.yyyymm} 월을 생성했습니다.`, "success");
      setIsCreateNextMonthConfirmOpen(false);
      await loadData(data.month.yyyymm);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "월 생성 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  const createPrevMonth = async () => {
    if (!selectedMonth) return;
    const targetYyyymm = prevYyyymm(selectedMonth);
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yyyymm: targetYyyymm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "월 생성 실패");
      showToast(`${data.month.yyyymm} 월을 생성했습니다.`, "success");
      setIsCreatePrevMonthConfirmOpen(false);
      await loadData(data.month.yyyymm);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "월 생성 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrentMonth = async () => {
    if (!selectedMonth) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/months/${selectedMonth}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "월 삭제 실패");
      showToast(`${selectedMonth} 월 데이터를 삭제했습니다.`, "success");
      setIsDeleteMonthConfirmOpen(false);
      await loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "삭제 실패";
      if (errorMessage === "데이터가 하나 이상 있어야 해요.") {
        setIsDeleteMonthConfirmOpen(false);
        setIsDeleteMonthBlockedAlertOpen(true);
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setSaving(false);
    }
  };
  const openDeleteMonthDialog = () => {
    if (!selectedMonth) return;
    if (months.length <= 1) {
      setIsDeleteMonthBlockedAlertOpen(true);
      return;
    }
    setIsDeleteMonthConfirmOpen(true);
  };
  const moveMonth = async (yyyymm: string | null) => {
    if (!yyyymm) return;
    setSelectedMonth(yyyymm);
    await loadData(yyyymm);
  };
  const getActiveEditingSection = (): "purpose" | "living" | "planned" | "actual" | null => {
    if (isPurposeEditing) return "purpose";
    if (isLivingEditing) return "living";
    if (isPlannedEditing) return "planned";
    if (isActualEditing) return "actual";
    return null;
  };
  const setEditingSectionState = (section: "purpose" | "living" | "planned" | "actual", value: boolean) => {
    if (section === "purpose") setIsPurposeEditing(value);
    if (section === "living") setIsLivingEditing(value);
    if (section === "planned") setIsPlannedEditing(value);
    if (section === "actual") setIsActualEditing(value);
  };
  const requestEditSection = (target: "purpose" | "living" | "planned" | "actual") => {
    const isTargetEditing =
      (target === "purpose" && isPurposeEditing) ||
      (target === "living" && isLivingEditing) ||
      (target === "planned" && isPlannedEditing) ||
      (target === "actual" && isActualEditing);

    if (isTargetEditing) {
      setEditingSectionState(target, false);
      showToast("수정을 완료했습니다. 저장하시려면 '저장'버튼을 눌러주세요!", "success");
      return;
    }

    const active = getActiveEditingSection();
    if (active && active !== target) {
      setPendingEditTarget(target);
      setIsEditSwitchAlertOpen(true);
      return;
    }

    setEditingSectionState(target, true);
  };
  const cancelEditSection = async (target: "purpose" | "living" | "planned" | "actual") => {
    await loadData(selectedMonth ?? undefined, { silent: true });
    setEditingSectionState(target, false);
    showToast("수정을 취소했습니다.", "success");
  };
  const confirmEditSwitch = async () => {
    const active = getActiveEditingSection();
    if (active === "purpose" || active === "living") {
      await saveFixed();
      setIsPurposeEditing(false);
      setIsLivingEditing(false);
    } else if (active === "planned" || active === "actual") {
      await saveMonth();
      setIsPlannedEditing(false);
      setIsActualEditing(false);
    }

    if (pendingEditTarget) {
      setEditingSectionState(pendingEditTarget, true);
    }
    setPendingEditTarget(null);
    setIsEditSwitchAlertOpen(false);
  };
  const openSaveBasicDataDialog = () => {
    if (isAnyEditing) {
      setIsSaveBlockedAlertOpen(true);
      return;
    }
    void saveFixed();
  };
  const confirmCrossSectionAndContinueBasicSave = () => {
    setIsPlannedEditing(false);
    setIsActualEditing(false);
    setIsCrossSectionEditAlertOpen(false);
    if (isPurposeEditing || isLivingEditing) {
      setIsSaveBasicDataConfirmOpen(true);
      return;
    }
    void saveFixed();
  };
  const confirmSaveBasicData = async () => {
    setIsPurposeEditing(false);
    setIsLivingEditing(false);
    setIsSaveBasicDataConfirmOpen(false);
    await saveFixed();
  };

  const copyMonthData = async () => {
    if (!selectedMonth || !copySourceMonth) return;
    const ok = window.confirm("정말 복사하시겠습니까?");
    if (!ok) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/bootstrap?month=${encodeURIComponent(copySourceMonth)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as BootstrapPayload & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "데이터 조회 실패");
      const sourceMonthRecord = data.months.find((m) => m.yyyymm === copySourceMonth);
      const putRes = await fetch(`/api/months/${selectedMonth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryAmount: sourceMonthRecord?.salaryAmount ?? 0,
          carryCashFromPrev: sourceMonthRecord?.carryCashFromPrev ?? 0,
          additionalIncomeType: sourceMonthRecord?.additionalIncomeType ?? "이월금액",
          taxDeduction: sourceMonthRecord?.taxDeduction ?? 0,
          plannedItems: data.plannedItems ?? [],
          actualItems: data.actualItems ?? [],
        }),
      });
      if (!putRes.ok) throw new Error("복사 실패");
      showToast("데이터를 복사했습니다.", "success");
      setIsCopyMonthDataOpen(false);
      setCopySourceMonth("");
      await loadData(selectedMonth);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "복사 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="app-main mx-auto max-w-md p-8 text-center text-gray-500">불러오는 중...</main>;
  }

  return (
    <main className="app-main relative mx-auto min-h-screen max-w-[1100px] space-y-5 px-3 py-6 pb-[160px] md:px-6 md:py-8 md:pb-[160px]">
      <button
        type="button"
        onClick={() => setIsCopyMonthDataOpen(true)}
        className="btn-copy-monthdata absolute right-4 top-4 z-20 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm"
      >
        데이터 가져오기
      </button>
      <section className="section-title pt-2 text-left">
        <h1 className="text-[20px] font-bold tracking-tight md:text-[22px]">가계부 - 예산 점검 페이지</h1>
        <p className="mt-2 text-sm text-gray-500">
          에상 지출과 실제 지출을 함께 기록하고, 월 정산에서 잔여 현금을 확인합니다.
        </p>
      </section>

      <section className="section-month-nav rounded-[28px] p-5 md:p-6">
        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => void moveMonth(prevMonth?.yyyymm ?? null)}
            disabled={!prevMonth}
            aria-label="이전 달"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 disabled:opacity-40"
          >
            <MonthArrowIcon direction="left" /> 
          </button>
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(true)}
            className="text-3xl font-semibold tracking-tight text-gray-900 hover:underline"
          >
            {selectedMonthLabel}
          </button>
          <button
            type="button"
            onClick={() => void moveMonth(nextMonth?.yyyymm ?? null)}
            disabled={!nextMonth}
            aria-label="다음 달"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 disabled:opacity-40"
          >
            <MonthArrowIcon direction="right" />
          </button>
        </div>
        <div className="month-create-buttons mx-auto flex w-full flex-wrap items-center justify-between gap-y-2 md:mt-5">
          <button
            onClick={() => setIsCreatePrevMonthConfirmOpen(true)}
            disabled={saving || !selectedMonth}
            className="btn-create-date text-sm font-semibold text-gray-700 underline underline-offset-4 transition hover:text-gray-900 disabled:opacity-50"
          >
            이전 달 생성
          </button>
          <button
            onClick={() => setIsCreateNextMonthConfirmOpen(true)}
            disabled={saving}
            className="btn-create-date text-sm font-semibold text-gray-700 underline underline-offset-4 transition hover:text-gray-900 disabled:opacity-50"
          >
            다음 달 생성
          </button>
        </div>
      </section>

      <section className="section-budget-category section-card section-card-form">
        <div className="section-header-row">
          <h2 className="section-heading">목적별 통장 & 카드 사용 분류</h2>
          <div className="flex items-center gap-2">
            {isPurposeEditing && (
              <button
                type="button"
                onClick={() => void cancelEditSection("purpose")}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
            )}
            <button
              onClick={() => requestEditSection("purpose")}
              className={`btn-modify h-10 rounded-xl border px-4 text-sm font-medium ${isPurposeEditing ? "border-[#333] bg-[#333] text-white" : "border-gray-200 bg-gray-50"}`}
            >
              {isPurposeEditing ? "수정 완료" : "수정"}
            </button>
          </div>
        </div>
        <div className="table-wrap mt-[32px]">
          <table className="w-full min-w-[820px] border-collapse text-sm [&_th]:whitespace-nowrap">
            <thead>
              <tr className="thead-row">
                <th className="cell-th">목적</th>
                <th className="cell-th">통장</th>
                <th className="cell-th">연결카드</th>
                <th className="cell-th">금액</th>
                <th className="cell-th">사용요약</th>
                <th className="cell-th">유의사항</th>
                {isPurposeEditing ? <th className="cell-th">삭제</th> : null}
              </tr>
            </thead>
            <tbody>
              {sortedPurposeAccounts.map((row, index) => (
                <tr key={row.id}>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <select
                        value={row.purposeType}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, purposeType: event.target.value as PurposeAccount["purposeType"] }
                                : item,
                            ),
                          )
                        }
                        className="input-edit"
                      >
                        <option value="생활비">생활비</option>
                        <option value="구독&정기결제">구독&정기결제</option>
                        <option value="경조사비">경조사비</option>
                      </select>
                    ) : (
                      <span>{row.purposeType}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <input
                        value={row.bankName}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, bankName: event.target.value } : item,
                            ),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.bankName}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <input
                        value={row.cardName}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, cardName: event.target.value } : item,
                            ),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.cardName}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <input
                        inputMode="numeric"
                        value={formatAmount(row.monthlyLimit)}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, monthlyLimit: parseAmountInput(event.target.value) }
                                : item,
                            ),
                          )
                        }
                        className="input-edit text-right"
                      />
                    ) : (
                      <span className="block text-right">{formatAmount(row.monthlyLimit)}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <input
                        value={row.usageSummary}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, usageSummary: event.target.value } : item,
                            ),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.usageSummary}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isPurposeEditing ? (
                      <input
                        value={row.note}
                        onChange={(event) =>
                          setPurposeAccounts((prev) =>
                            prev.map((item) => (item.id === row.id ? { ...item, note: event.target.value } : item)),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.note}</span>
                    )}
                  </td>
                  {isPurposeEditing ? (
                    <td className="cell-td text-center">
                      <button
                        onClick={() =>
                          setPurposeAccounts((prev) =>
                            prev.filter((item, rowIndex) => !(item.id === row.id && rowIndex === index)),
                          )
                        }
                        className="btn-delete-cell"
                      >
                        삭제
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isPurposeEditing ? (
          <button
            onClick={() => setPurposeAccounts((prev) => [...prev, { ...emptyPurpose(), sortOrder: prev.length + 1 }])}
            className="btn-row-add mt-3"
          >
            행 추가
          </button>
        ) : null}
      </section>

      <section className="section-living-coast section-card section-card-form">
        <div className="section-header-row">
          <h2 className="section-heading">분류별 생활비</h2>
          <div className="flex items-center gap-2">
            {isLivingEditing && (
              <button
                type="button"
                onClick={() => void cancelEditSection("living")}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
            )}
            <button
              onClick={() => requestEditSection("living")}
              className={`btn-modify h-10 rounded-xl border px-4 text-sm font-medium ${isLivingEditing ? "border-[#333] bg-[#333] text-white" : "border-gray-200 bg-gray-50"}`}
            >
              {isLivingEditing ? "수정 완료" : "수정"}
            </button>
          </div>
        </div>
        <div className="table-wrap mt-4">
          <table className="w-full min-w-[820px] border-collapse text-sm [&_th]:whitespace-nowrap">
            <thead>
              <tr className="thead-row">
                <th className="cell-th">분류</th>
                <th className="cell-th">이름</th>
                <th className="cell-th">금액</th>
                <th className="cell-th">결제 수단</th>
                <th className="cell-th">메모</th>
                {isLivingEditing ? <th className="cell-th">삭제</th> : null}
              </tr>
            </thead>
            <tbody>
              {sortedLivingGroups.map((row) => (
                <tr key={row.id} data-living-type={row.groupType}>
                  <th scope="row" className="cell-td">
                    {isLivingEditing ? (
                      <select
                        value={row.groupType}
                        onChange={(event) =>
                          setLivingGroups((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, groupType: event.target.value as LivingGroup["groupType"] }
                                : item,
                            ),
                          )
                        }
                        className="input-edit"
                      >
                        {livingTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      ) : (
                      <span>{row.groupType}</span>
                    )}
                  </th>
                  <td className="cell-td">
                    {isLivingEditing ? (
                      <input
                        value={row.label}
                        onChange={(event) =>
                          setLivingGroups((prev) =>
                            prev.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.label}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isLivingEditing ? (
                      <input
                        inputMode="numeric"
                        value={formatAmount(row.defaultAmount)}
                        onChange={(event) =>
                          setLivingGroups((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, defaultAmount: parseAmountInput(event.target.value) }
                                : item,
                            ),
                          )
                        }
                        className="input-edit text-right"
                      />
                    ) : (
                      <span className="block text-right">{formatAmount(row.defaultAmount)}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isLivingEditing ? (
                      <select
                        value={row.paymentMethod}
                        onChange={(event) =>
                          setLivingGroups((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, paymentMethod: event.target.value } : item,
                            ),
                          )
                        }
                        className="input-edit"
                      >
                        <option value="">선택</option>
                        {payCategories.map((category) => (
                          <option key={category.id} value={category.label}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{row.paymentMethod}</span>
                    )}
                  </td>
                  <td className="cell-td">
                    {isLivingEditing ? (
                      <input
                        value={row.memo}
                        onChange={(event) =>
                          setLivingGroups((prev) =>
                            prev.map((item) => (item.id === row.id ? { ...item, memo: event.target.value } : item)),
                          )
                        }
                        className="input-edit"
                      />
                    ) : (
                      <span>{row.memo}</span>
                    )}
                  </td>
                  {isLivingEditing ? (
                    <td className="cell-td text-center">
                      <button
                        onClick={() => setLivingGroups((prev) => prev.filter((item) => item.id !== row.id))}
                        className="btn-delete-cell"
                      >
                        삭제
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLivingEditing ? (
          <button
            onClick={() => setLivingGroups((prev) => [...prev, { ...emptyLiving(), sortOrder: prev.length + 1 }])}
            className="btn-row-add mt-[28px]"
          >
            행 추가
          </button>
        ) : null}
        <div className="mt-[40px] grid grid-cols-1 gap-[40px] lg:grid-cols-2">
          <div className="rounded-2xl">
            <h3 className="text-[16px] font-semibold text-gray-700">분류 정산</h3>
            <div className="mt-[20px] overflow-x-auto rounded-xl bg-white">
              <table className="table-living-summary w-full border-collapse text-sm">
                <thead>
                  <tr className="thead-row">
                    <th className="cell-th text-left">분류별</th>
                    <th className="cell-th text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {livingGroupTypeSummary.length === 0 ? (
                    <tr>
                      <td className="border border-gray-200 p-3 text-gray-500" colSpan={2}>
                        분류 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    livingGroupTypeSummary.map((row) => (
                      <tr key={row.label}>
                        <td className="cell-td">{row.label}</td>
                        <td className="cell-td text-right">{formatKRW(row.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50 font-semibold text-gray-800">
                    <td className="cell-td">총액</td>
                    <td className="cell-td text-right">{formatKRW(livingGroupTypeTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl">
            <h3 className="text-[16px] font-semibold text-gray-700">생활비 정산</h3>
            <div className="mt-[20px] overflow-x-auto rounded-xl bg-white">
              <table className="table-living-summary w-full border-collapse text-sm">
                <thead>
                  <tr className="thead-row">
                    <th className="cell-th text-left">결제 수단별</th>
                    <th className="cell-th text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {livingPaymentSummary.length === 0 ? (
                    <tr>
                      <td className="border border-gray-200 p-3 text-gray-500" colSpan={2}>
                        결제 수단이 입력된 생활비 항목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    livingPaymentSummary.map((row) => (
                      <tr key={row.label}>
                        <td className="cell-td">{row.label}</td>
                        <td className="cell-td text-right">{formatKRW(row.amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-gray-50 font-semibold text-gray-800">
                    <td className="cell-td">총액</td>
                    <td className="cell-td text-right">{formatKRW(livingPaymentTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div className="my-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setDraftPayCategories(payCategories.map((row) => ({ ...row })));
            setIsPayCategoryEditorOpen(true);
          }}
          className="btn-setting-pay h-11 min-w-36 rounded-2xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700"
        >
          결제 수단 설정
        </button>
        <button
          onClick={openSaveBasicDataDialog}
          disabled={saving}
          className="btn-save-plan h-11 min-w-36 rounded-2xl bg-teal-500 px-6 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
        >
          에상 저장
        </button>
      </div>
      <div className="mb-[50px] h-px w-full bg-gray-200/90" />

      <section className="section-expense-planned section-card section-card-form">
        <div className="section-header-row">
          <h2 className="section-heading">지출예정 / 실제지출</h2>
        </div>
        <div className="section-content mt-3 space-y-3">
          <div
            className={`flex flex-col gap-1 text-sm ${!isPlannedEditing ? "cursor-pointer" : ""}`}
            role={!isPlannedEditing ? "button" : undefined}
            tabIndex={!isPlannedEditing ? 0 : undefined}
            onMouseDown={
              !isPlannedEditing
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSalaryHidden((prev) => !prev);
                  }
                : undefined
            }
            onKeyDown={
              !isPlannedEditing
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsSalaryHidden((prev) => !prev);
                    }
                  }
                : undefined
            }
          >
            <span>월급</span>
            <input
              type={isSalaryHidden ? "password" : "text"}
              inputMode="numeric"
              readOnly={!isPlannedEditing}
              value={formatAmount(salaryAmount)}
              onChange={(event) => setSalaryAmount(parseAmountInput(event.target.value))}
              className="mt-1 h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-sm outline-none focus:border-teal-400 md:text-base read-only:cursor-pointer read-only:bg-gray-50"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>추가 수입(전월 이월, 인센, 연말정산 등)</span>
              <div className="mt-1 flex gap-2">
                <select
                  value={additionalIncomeType}
                  onChange={(e) => setAdditionalIncomeType(e.target.value as (typeof additionalIncomeTypes)[number])}
                  disabled={!isPlannedEditing}
                  className="h-11 min-w-[120px] rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-400 disabled:cursor-default disabled:opacity-90 md:text-base"
                >
                  {additionalIncomeTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {isPlannedEditing ? (
                  <input
                    inputMode="numeric"
                    value={formatAmount(carryCashFromPrev)}
                    onChange={(event) => setCarryCashFromPrev(parseAmountInput(event.target.value))}
                    className="h-11 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right outline-none focus:border-teal-400"
                  />
                ) : (
                  <p className="flex h-11 flex-1 items-center justify-end rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-sm md:text-base">
                    {formatAmount(carryCashFromPrev)}
                  </p>
                )}
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>세금공제</span>
              {isPlannedEditing ? (
                <input
                  inputMode="numeric"
                  value={formatAmount(taxDeduction)}
                  onChange={(event) => setTaxDeduction(parseAmountInput(event.target.value))}
                  className="mt-1 h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-sm outline-none focus:border-teal-400 md:text-base"
                />
              ) : (
                <p className="mt-1 flex h-11 items-center justify-end rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-sm md:text-base">
                  {formatAmount(taxDeduction)}
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <LedgerEditor
            title="지출예정"
            rows={sortedPlannedItems}
            onChange={setPlannedItems}
            editable={isPlannedEditing}
            payCategories={payCategories}
            headerActions={
              <div className="flex items-center gap-2">
                {isPlannedEditing && (
                  <button
                    type="button"
                    onClick={() => void cancelEditSection("planned")}
                    className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={() => requestEditSection("planned")}
                  className={`btn-modify h-10 rounded-xl border px-4 text-sm font-medium ${isPlannedEditing ? "border-[#333] bg-[#333] text-white" : "border-gray-200 bg-gray-50"}`}
                >
                  {isPlannedEditing ? "수정 완료" : "수정"}
                </button>
              </div>
            }
          />
          <div className="min-w-0">
              <LedgerEditor
              title="실제지출"
              rows={sortedActualItems}
              onChange={setActualItems}
              editable={isActualEditing}
              payCategories={payCategories}
              headerActions={
                <div className="flex items-center gap-2">
                  {isActualEditing && (
                    <button
                      type="button"
                      onClick={() => void cancelEditSection("actual")}
                      className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={() => requestEditSection("actual")}
                    className={`btn-modify h-10 rounded-xl border px-4 text-sm font-medium ${isActualEditing ? "border-[#333] bg-[#333] text-white" : "border-gray-200 bg-gray-50"}`}
                  >
                    {isActualEditing ? "수정 완료" : "수정"}
                  </button>
                </div>
              }
              extraActions={
                isActualEditing ? (
                  <button
                    onClick={() =>
                      setActualItems(
                        plannedItems.map((item, index) => ({
                          ...item,
                          id: crypto.randomUUID(),
                          sortOrder: index + 1,
                          isFromPlan: true,
                        })),
                      )
                    }
                    className="btn-row-add"
                  >
                    예정 지출을 실제 지출로 복사
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold">분류별 지출 통계</h3>
          <div className="table-wrap mt-3">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="cell-th text-left">분류</th>
                  <th className="cell-th text-right">예정 금액</th>
                  <th className="cell-th text-right">실제 지출</th>
                </tr>
              </thead>
              <tbody>
                {categoryExpenseStats.map((row) => (
                  <tr key={row.categoryType} data-ledger-category={row.categoryType}>
                    <th scope="row" className="cell-th text-left font-medium">{row.categoryType}</th>
                    <td className="cell-td text-right">{formatKRW(row.plannedSum)}</td>
                    <td className="cell-td text-right">{formatKRW(row.actualSum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-expense-summary section-card">
        <h2 className="section-heading">정산</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <SummaryCard title="이달 총 수입" value={formatKRW(salaryAmount + carryCashFromPrev - taxDeduction)} />
          <SummaryCard title="에상 총지출" value={formatKRW(settlement.plannedTotalOut)} />
          <SummaryCard title="실제 총지출" value={formatKRW(settlement.actualTotalOut)} />
          <SummaryCard title="에상 잔액" value={formatKRW(settlement.plannedNetCash)} />
          <SummaryCard title="실제 잔액" value={formatKRW(settlement.actualNetCash)} />
          <SummaryCard title="잔액 차이" value={formatKRW(settlement.delta)} />
        </div>
        <div className="table-wrap mt-4">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="thead-row">
                <th className="cell-th text-left">카테고리</th>
                <th className="cell-th text-right">에상 - 실제</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category}>
                  <td className="cell-td">{category}</td>
                  <td className="cell-td text-right">{formatKRW(settlement.categoryDelta[category])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="expense-card-summary mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-medium">카드별 실제지출 합계</h3>
          <div className="mt-2 space-y-1 text-sm">
            {cardSummary.length === 0 ? (
              <p className="text-gray-500">설정된 결제 수단이 없습니다.</p>
            ) : (
              cardSummary.map((row) => (
                <p key={row.label} className="flex justify-between">
                  <span>{row.label}</span>
                  <span>{formatKRW(row.amount)}</span>
                </p>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="fixed bottom-0 left-0 z-10 w-full border-t border-[#ccc] bg-white  py-[20px]">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between px-5">
          <button
            onClick={openDeleteMonthDialog}
            disabled={saving || !selectedMonth}
            className="btn-delete-data h-11 min-w-36 rounded-2xl bg-gray-400 px-6 text-sm font-semibold text-white transition hover:bg-gray-500 disabled:opacity-50"
          >
            삭제
          </button>
          <button
            onClick={saveMonth}
            disabled={saving || !selectedMonth}
            className="btn-save-data h-11 min-w-36 rounded-2xl bg-teal-600 px-6 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </section>

      {isPayCategoryEditorOpen ? (
        <div
          className="edit-pay-category modal-overlay"
          onClick={() => setIsPayCategoryEditorOpen(false)}
        >
          <div
            className="modal-panel modal-panel-md"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">결제 수단 설정</h3>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                onClick={() => setIsPayCategoryEditorOpen(false)}
              >
                닫기
              </button>
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {draftPayCategories.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <input
                    value={row.label}
                    onChange={(event) =>
                      setDraftPayCategories((prev) =>
                        prev.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)),
                      )
                    }
                    placeholder={`결제 수단 ${index + 1}`}
                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => openPayCategoryDeleteConfirm(row.id)}
                    className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setDraftPayCategories((prev) => [...prev, { ...emptyPayCategory(), sortOrder: prev.length + 1 }])
              }
              className="btn-row-add mt-3"
            >
              결제 수단 추가
            </button>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPayCategoryEditorOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={savePayCategorySettings}
                disabled={saving}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPayCategoryDeleteConfirmOpen ? (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsPayCategoryDeleteConfirmOpen(false);
            setPendingPayCategoryDeleteId(null);
          }}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">정말 삭제하시겠습니까?</h3>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPayCategoryDeleteConfirmOpen(false);
                  setPendingPayCategoryDeleteId(null);
                }}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDeletePayCategory}
                className="btn-confirm h-10 rounded-xl bg-gray-700 px-4 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCopyMonthDataOpen ? (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsCopyMonthDataOpen(false);
            setCopySourceMonth("");
          }}
        >
          <div
            className="modal-panel modal-panel-md"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">데이터 가져오기</h3>
            <label className="mt-4 block text-sm">
              <span className="mb-2 block">가져올 월 선택</span>
              <select
                value={copySourceMonth}
                onChange={(e) => setCopySourceMonth(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">선택</option>
                {months.map((m) => (
                  <option key={m.id} value={m.yyyymm}>
                    {m.yyyymm}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCopyMonthDataOpen(false);
                  setCopySourceMonth("");
                }}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={copyMonthData}
                disabled={saving || !copySourceMonth}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                복사하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="toast-wrap">
          <div className={`toast-panel ${messageType === "error" ? "toast-panel--error" : "toast-panel--success"}`}>
            {message}
          </div>
        </div>
      ) : null}

      {isMonthPickerOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsMonthPickerOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">월 선택</h3>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                닫기
              </button>
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {months.map((month) => (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => {
                    const next = month.yyyymm;
                    setSelectedMonth(next);
                    setIsMonthPickerOpen(false);
                    void loadData(next);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                    selectedMonth === month.yyyymm
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span>{month.yyyymm}</span>
                  {selectedMonth === month.yyyymm ? <span>선택됨</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isCreateNextMonthConfirmOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsCreateNextMonthConfirmOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">다음 달을 추가할까요?</h3>
            <p className="mt-2 text-sm text-gray-500">현재 월 데이터를 기준으로 다음 달이 생성됩니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateNextMonthConfirmOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={createNextMonth}
                disabled={saving}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreatePrevMonthConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
          onClick={() => setIsCreatePrevMonthConfirmOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">이전 달을 추가할까요?</h3>
            <p className="mt-2 text-sm text-gray-500">
              {selectedMonth ? `${prevYyyymm(selectedMonth)} 월이 빈 데이터로 생성됩니다.` : "선택한 월의 이전 달이 생성됩니다."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatePrevMonthConfirmOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={createPrevMonth}
                disabled={saving}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteMonthConfirmOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsDeleteMonthConfirmOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">정말 데이터를 삭제하시겠습니까?</h3>
            <p className="mt-2 text-sm text-gray-500">
              현재 선택한 {selectedMonthLabel}의 지출예정/실제지출 데이터가 삭제됩니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteMonthConfirmOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={deleteCurrentMonth}
                disabled={saving}
                className="btn-confirm h-10 rounded-xl bg-gray-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteMonthBlockedAlertOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsDeleteMonthBlockedAlertOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">데이터가 하나 이상 있어야 해요.</h3>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteMonthBlockedAlertOpen(false)}
                className="btn-confirm h-10 rounded-xl bg-gray-700 px-4 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSaveBasicDataConfirmOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsSaveBasicDataConfirmOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              현재 수정이 진행 중입니다. 수정을 완료하고 현재 데이터를 저장하시겠습니까?
            </h3>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSaveBasicDataConfirmOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmSaveBasicData()}
                disabled={saving}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSaveBlockedAlertOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsSaveBlockedAlertOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              아직 수정이 완료되지 않은 영역이 있습니다. 수정을 완료하고 저장해 주세요.
            </h3>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSaveBlockedAlertOpen(false)}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCrossSectionEditAlertOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setIsCrossSectionEditAlertOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              다른 영역에서 수정이 완료되지 않았습니다. 수정하던 내용을 저장하고 현재 영역을 수정하시겠습니까?
            </h3>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCrossSectionEditAlertOpen(false)}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmCrossSectionAndContinueBasicSave}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditSwitchAlertOpen ? (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsEditSwitchAlertOpen(false);
            setPendingEditTarget(null);
          }}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              다른 영역에서 수정이 완료되지 않았습니다. 수정하던 내용을 저장하고 현재 영역을 수정하시겠습니까?
            </h3>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditSwitchAlertOpen(false);
                  setPendingEditTarget(null);
                }}
                className="btn-cancel h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmEditSwitch()}
                className="btn-confirm h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MonthArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 text-gray-600 ${direction === "right" ? "rotate-180" : ""}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LedgerEditor({
  title,
  rows,
  onChange,
  editable,
  payCategories,
  headerActions,
  extraActions,
}: {
  title: string;
  rows: LedgerItem[];
  onChange: (next: LedgerItem[]) => void;
  editable: boolean;
  payCategories: PayCategory[];
  headerActions?: React.ReactNode;
  extraActions?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {headerActions}
      </div>
      <div className="table-wrap mt-3">
        <table className="w-full min-w-[640px] border-collapse text-sm [&_th]:whitespace-nowrap">
          <thead>
            <tr className="thead-row">
              <th className="cell-th">분류</th>
              <th className="cell-th">항목</th>
              <th className="cell-th">금액</th>
              <th className="cell-th">카드</th>
              <th className="cell-th">메모</th>
              {editable ? <th className="cell-th">삭제</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-ledger-category={row.categoryType}>
                <th scope="row" className="cell-td">
                  {editable ? (
                    <select
                      value={row.categoryType}
                      onChange={(event) =>
                        onChange(
                          rows.map((item) =>
                            item.id === row.id
                              ? { ...item, categoryType: event.target.value as LedgerItem["categoryType"] }
                              : item,
                          ),
                        )
                      }
                      className="input-edit"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{row.categoryType}</span>
                  )}
                </th>
                <td className="cell-td">
                  {editable ? (
                    <input
                      value={row.itemName}
                      onChange={(event) =>
                        onChange(rows.map((item) => (item.id === row.id ? { ...item, itemName: event.target.value } : item)))
                      }
                      className="input-edit"
                    />
                  ) : (
                    <span>{row.itemName}</span>
                  )}
                </td>
                <td className="cell-td">
                  {editable ? (
                    <input
                      inputMode="numeric"
                      value={formatAmount(row.amount)}
                      onChange={(event) =>
                        onChange(
                          rows.map((item) =>
                            item.id === row.id ? { ...item, amount: parseAmountInput(event.target.value) } : item,
                          ),
                        )
                      }
                      className="input-edit text-right"
                    />
                  ) : (
                    <span className="block text-right">{formatAmount(row.amount)}</span>
                  )}
                </td>
                <td className="cell-td">
                  {editable ? (
                    <select
                      value={row.cardName ?? ""}
                      onChange={(event) =>
                        onChange(rows.map((item) => (item.id === row.id ? { ...item, cardName: event.target.value } : item)))
                      }
                      className="input-edit"
                    >
                      <option value="">선택</option>
                      {payCategories.map((category) => (
                        <option key={category.id} value={category.label}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{row.cardName}</span>
                  )}
                </td>
                <td className="cell-td">
                  {editable ? (
                    <input
                      value={row.memo}
                      onChange={(event) =>
                        onChange(rows.map((item) => (item.id === row.id ? { ...item, memo: event.target.value } : item)))
                      }
                      className="input-edit"
                    />
                  ) : (
                    <span>{row.memo}</span>
                  )}
                </td>
                {editable ? (
                  <td className="cell-td text-center">
                    <button
                      onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
                      className="btn-delete-cell"
                    >
                      삭제
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onChange([...rows, { ...emptyLedger(), sortOrder: rows.length + 1 }])}
            className="btn-row-add"
          >
            항목 추가
          </button>
          {extraActions}
        </div>
      ) : null}
    </div>
  );
}
