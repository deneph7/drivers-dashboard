# 운전기사 가용 상태 대시보드 — Claude Code 에이전트 지침

## 1. 프로젝트 개요

조직 내 운전기사(최대 10명)의 실시간 가용 상태를 관리자/비서가 한눈에 파악할 수 있는 웹 대시보드.

| 항목 | 내용 |
|------|------|
| **프레임워크** | Next.js 15 (App Router) |
| **DB + 인증** | Supabase (PostgreSQL + Auth) |
| **배포** | Vercel |
| **실시간** | Supabase Realtime |
| **스타일** | Tailwind CSS v4 |
| **언어** | TypeScript (strict) |

설계 상세: [`docs/design-spec.md`](docs/design-spec.md)

---

## 2. 코딩 컨벤션

- TypeScript strict mode 필수 (`"strict": true`)
- App Router 패턴 사용 — Pages Router 금지
- Server Component 기본, 클라이언트 상호작용 필요 시 `"use client"` 명시
- API 라우트: `/src/app/api/` 아래 `route.ts` 파일로 작성
- 환경변수: `.env.local` (공개 키는 `NEXT_PUBLIC_` 접두사)
- 컴포넌트 파일명: PascalCase (예: `DriverCard.tsx`)
- 유틸리티/lib 파일명: camelCase (예: `supabase-client.ts`)
- Tailwind 클래스 직접 사용 — 별도 CSS 파일 최소화
- `date-fns-tz` 또는 `Intl.DateTimeFormat`으로 KST 변환 (서드파티 moment.js 금지)

---

## 3. 폴더 구조

```
/
├── CLAUDE.md
├── .claude/skills/         # 스킬 참조 파일
├── .github/workflows/      # GitHub Actions
├── scripts/seed-admin.ts   # 초기 admin 계정 생성 (1회)
├── docs/design-spec.md     # 설계서
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                    # → /login 리다이렉트
    │   ├── login/page.tsx
    │   ├── dashboard/
    │   │   ├── page.tsx
    │   │   └── loading.tsx
    │   ├── driver/
    │   │   ├── page.tsx              # 레거시 (대시보드 모달로 대체)
    │   │   └── loading.tsx
    │   ├── admin/
    │   │   ├── page.tsx
    │   │   ├── loading.tsx
    │   │   └── driver/[id]/page.tsx  # 레거시 (대시보드 모달로 대체)
    │   ├── login/
    │   │   ├── page.tsx
    │   │   └── loading.tsx
    │   └── api/
    │       ├── drivers/route.ts
    │       └── users/route.ts
    ├── components/
    │   ├── TrafficLight.tsx
    │   ├── DriverCard.tsx
    │   ├── Clock.tsx
    │   ├── StatusSelector.tsx
    │   ├── StatusModal.tsx            # 대시보드 카드 클릭 시 상태변경 모달
    │   ├── NavigationProgress.tsx     # 페이지 전환 로딩 오버레이
    │   ├── VehicleInput.tsx
    │   └── DelayBadge.tsx
    ├── lib/
    │   ├── supabase-client.ts
    │   ├── supabase-server.ts
    │   ├── i18n.ts
    │   └── types.ts
    └── middleware.ts
```

---

## 4. DB 스키마 참조

스키마 SQL: [`.claude/skills/supabase-setup/scripts/init-schema.sql`](.claude/skills/supabase-setup/scripts/init-schema.sql)

### 테이블 요약

**`profiles`** (auth.users 확장)
- `id` uuid PK FK→auth.users
- `name` text
- `initial` varchar(10) — 이니셜/표시명 (한글, 영문, 숫자 자유)
- `role` enum('admin','driver','viewer')
- `recent_vehicles` text[] — 최근 차량번호 최대 5개 (FIFO)
- `sort_order` integer nullable — NULL이면 이름 알파벳순
- `created_at` timestamptz

**`driver_status`** (기사당 1개 레코드, Upsert 패턴)
- `driver_id` uuid PK FK→profiles.id
- `status` enum('available','unavailable','contact')
- `vehicle_number` varchar(20) nullable
- `return_time` timestamptz nullable — UTC 저장, 불가용 시 필수
- `updated_at` timestamptz
- `updated_by` uuid FK→profiles.id

### 타임존 규칙
- **저장**: 항상 UTC (`timestamptz`)
- **표시**: 클라이언트에서 KST(Asia/Seoul, UTC+9) 변환
- 서버 사이드: `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })`

---

## 5. 인증 / 인가 규칙

참조: [`.claude/skills/auth-setup/references/role-permissions.md`](.claude/skills/auth-setup/references/role-permissions.md)

### 역할별 접근 권한

| 역할 | 대시보드 조회 | 본인 상태 변경 | 전체 상태 변경 | 사용자 관리 |
|------|:-----------:|:------------:|:------------:|:---------:|
| admin | ✅ | ✅ | ✅ | ✅ |
| driver | ✅ | ✅ | ❌ | ❌ |
| viewer | ✅ | ❌ | ❌ | ❌ |

### 미들웨어 라우트 보호 (`src/middleware.ts`)
- `/admin/*` → admin만 접근, 그 외 → `/dashboard` 리다이렉트
- `/driver` → driver만 접근, 그 외 → `/dashboard` 리다이렉트
- `/dashboard` → 모든 인증 사용자 접근 가능
- `/login` → 미인증 사용자만 접근 (인증 시 `/dashboard` 리다이렉트)
- 루트 `/` → `/login` 리다이렉트

### 로그인 후 라우팅
- **모든 역할** → `/dashboard` (대시보드가 기본 화면)

### 상태 변경 방식
- driver: 대시보드에서 본인 카드 클릭 → 모달(StatusModal)로 상태 변경
- admin: 대시보드에서 아무 기사 카드 클릭 → 모달(StatusModal)로 상태 변경
- viewer: 카드 클릭 불가 (조회만)

### RLS 정책 요약
- `driver_status`: 인증 사용자 전체 SELECT / driver 본인 UPDATE / admin 전체 UPDATE
- `profiles`: 인증 사용자 전체 SELECT / admin만 INSERT·UPDATE·DELETE

---

## 6. UI 구현 원칙

참조: [`.claude/skills/ui-components/references/design-tokens.md`](.claude/skills/ui-components/references/design-tokens.md)

### 반응형 브레이크포인트
- 모바일: 1열 (기본)
- 태블릿 (`md:`): 2열
- 데스크톱 (`lg:`): 3열

### 신호등 색상
| 상태 | 값 | 색상 |
|------|-----|------|
| available (가용) | `'available'` | 파란색 `#2563EB` (blue-600) |
| unavailable (불가용) | `'unavailable'` | 빨간색 `#DC2626` (red-600) |
| contact (연락필요) | `'contact'` | 회색 `#6B7280` (gray-500) |

### UX 원칙
- 대시보드 카드 클릭 → 슬라이드업 모달로 상태 변경 (별도 페이지 이동 없음)
- 빨간불(불가용) 시 복귀시간 필수, 현재 시간 이전 입력 불가
- 모바일 터치 친화적 버튼 크기 (최소 44px)
- 복귀 지연 시 카드에 빨간 깜빡임 애니메이션 + 경고 배지
- 페이지 전환 시 로딩 오버레이 표시 (loading.tsx + LoadingOverlay)

---

## 7. 스킬 목록 및 트리거

| 스킬 | 파일 | 트리거 조건 |
|------|------|------------|
| **supabase-setup** | `.claude/skills/supabase-setup/SKILL.md` | DB 스키마 생성/변경, RLS 정책 설정, Realtime 설정 |
| **auth-setup** | `.claude/skills/auth-setup/SKILL.md` | 인증 코드 작성/수정, 미들웨어 구현, 역할 관련 로직 |
| **ui-components** | `.claude/skills/ui-components/SKILL.md` | UI 컴포넌트 생성/수정, 신호등 스타일, 반응형 레이아웃 |

---

## 8. 구현 순서

1. Next.js 프로젝트 생성 + 패키지 설치
2. DB 스키마 + RLS 정책 적용 (Supabase SQL 에디터에서 실행)
3. 시드 스크립트로 최초 admin 계정 생성
4. 인증 구현 (로그인 페이지, 미들웨어, 역할 라우팅)
5. `/dashboard` 대시보드 화면 + 카드 클릭 상태변경 모달
6. Supabase Realtime 연동
7. 복귀 지연 감지 (클라이언트 타이머)
8. `/admin` 관리자 화면 (사용자 관리)
10. i18n 구현 (영어 기본, 한/영 토글)
11. GitHub Actions keepalive cron 설정 확인
12. 반응형 UI 조정 + 디자인 다듬기
13. 전체 시나리오 테스트

---

## 9. 검증 체크리스트

### 각 화면 완성 후 확인
- [ ] 역할별 접근 제어 동작 (미들웨어)
- [ ] 모바일(360px) ~ 데스크톱(1920px) 레이아웃 정상
- [ ] 상태 변경 후 DB 반영 확인
- [ ] Realtime 구독으로 대시보드 자동 갱신 (3초 이내)
- [ ] KST 시간 표시 정확성
- [ ] 복귀 지연 경고 표시 동작

### 최종 전체 테스트
- [ ] admin 로그인 → 대시보드 → 카드 클릭 → 모달로 기사 대리 변경
- [ ] driver 로그인 → 대시보드 → 본인 카드 클릭 → 모달로 상태 변경 → 대시보드에 반영
- [ ] viewer 로그인 → 대시보드 조회만 (변경 불가)
- [ ] 빨간불 → 복귀 예정시간 경과 → 지연 경고 표시
- [ ] 차량번호 자동완성 (recent_vehicles)

---

## 10. 환경변수 목록

`.env.local`에 필요한 변수:

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # 서버 사이드 전용
```

시드 스크립트용 (배포 시 1회):
```
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=[strong-password]
SEED_ADMIN_NAME=관리자
```
