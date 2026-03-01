# 가계부 - 예산 점검 페이지

월별 예산 계획(지출예정)과 실제 지출(실제지출)을 비교하고, 정산에서 잔여 현금을 확인하는 개인용 원페이지 앱입니다.

## 주요 기능

- `1-2 기본 설정`: 목적별 통장/카드 분류, 생활비 분류 관리
- `3-4 월간 운영`: 월별 급여/이월금, 지출예정/실제지출 입력 및 저장
- `다음 달 생성`: 이전 달 계획과 정산 결과(이월 현금)를 기반으로 자동 시작
- `5 정산`: 계획 vs 실제 비교, 순현금 차이, 카테고리 차이, 카드별 합계

## 기술 스택

- Next.js (App Router)
- Supabase (Postgres, RLS)
- Tailwind CSS

## 환경 변수

`.env.local` 파일을 만들고 아래 값을 설정하세요.

```bash
cp .env.example .env.local
```

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 키
- `NEXT_PUBLIC_SUPABASE_URL`: 클라이언트 URL (선택)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트 anon 키 (선택)
- `APP_OWNER_ID`: 단일 사용자 식별자

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## Supabase 마이그레이션

`supabase/migrations/001_init.sql` 파일을 SQL Editor에서 실행하세요.

생성 대상:
- `profiles`
- `purpose_accounts`
- `living_groups`
- `months`
- `planned_items`
- `actual_items`
- `monthly_summary` view

## 배포 (Vercel + 도메인)

1. GitHub에 레포 푸시
2. Vercel에서 프로젝트 Import
3. Vercel 환경 변수에 `.env.local` 동일 값 등록
4. 도메인 연결 후 DNS 설정
5. 배포 완료 후 앱 경로를 개인용 비공개 URL로 사용

## 백업/복구 운영 루틴

- 월 1회 백업:
  - Supabase Table Editor에서 CSV Export (`months`, `planned_items`, `actual_items`)
  - 필요 시 프로젝트 백업(스냅샷)
- 복구:
  - CSV Import 또는 SQL Insert로 해당 월 데이터 복원

## 참고

- 본 앱은 로그인 UI가 없으므로 공개 URL 관리가 중요합니다.
- 서비스 롤 키는 서버에서만 사용해야 하며 절대 클라이언트 코드에 노출하면 안 됩니다.
