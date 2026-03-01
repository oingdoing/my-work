"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pay-plan-auth";
const CODE = process.env.NEXT_PUBLIC_ACCESS_CODE ?? "";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!CODE) {
      setIsUnlocked(true);
    } else {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      setIsUnlocked(stored === "1");
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (inputValue === CODE) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setIsUnlocked(true);
        setInputValue("");
      } else {
        setError("코드가 일치하지 않습니다.");
      }
    },
    [inputValue],
  );

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f7]">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-lg font-semibold text-gray-800">
            접속 코드 입력
          </h1>
          <p className="mt-1 text-center text-sm text-gray-500">
            메인 페이지에 접근하려면 코드를 입력하세요.
          </p>
          <form onSubmit={handleSubmit} className="mt-6">
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="코드 입력"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              autoFocus
              autoComplete="off"
            />
            {error ? (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            ) : null}
            <button
              type="submit"
              className="mt-4 h-11 w-full rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
