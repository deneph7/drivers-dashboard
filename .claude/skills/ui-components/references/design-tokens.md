# 디자인 토큰

## 색상 — 신호등 상태

| 상태 | 한국어 | 영어 | Tailwind 클래스 | Hex |
|------|--------|------|----------------|-----|
| available | 가용 | Available | `bg-blue-600` / `text-blue-600` | `#2563EB` |
| unavailable | 불가용 | Unavailable | `bg-red-600` / `text-red-600` | `#DC2626` |
| contact | 연락필요 | Contact | `bg-gray-500` / `text-gray-500` | `#6B7280` |

## 색상 — 상태 배경 (카드 배경 틴트)

| 상태 | Tailwind 클래스 | Hex |
|------|----------------|-----|
| available | `bg-blue-50` | `#EFF6FF` |
| unavailable | `bg-red-50` | `#FEF2F2` |
| contact | `bg-gray-50` | `#F9FAFB` |

## 색상 — 복귀 지연 경고

| 요소 | Tailwind 클래스 |
|------|----------------|
| 카드 테두리 | `border-red-500` |
| 배지 배경 | `bg-red-100` |
| 배지 텍스트 | `text-red-800` |
| 애니메이션 | `animate-pulse` |

---

## 타이포그래피

| 요소 | Tailwind 클래스 |
|------|----------------|
| 이니셜 (카드 대형) | `text-2xl font-bold` |
| 이름 (보조) | `text-sm text-gray-600` |
| 차량번호 | `text-sm text-gray-600` |
| 복귀 예정시간 | `text-sm font-medium` |
| 카운트다운 | `text-xs text-gray-500` |
| 시계 | `text-lg font-mono` |
| 헤더 제목 | `text-xl font-semibold` |

---

## 간격 / 레이아웃

| 요소 | Tailwind 클래스 |
|------|----------------|
| 카드 패딩 | `p-4` |
| 카드 테두리 반경 | `rounded-xl` |
| 카드 그림자 | `shadow-sm` |
| 카드 그리드 간격 | `gap-4` |
| 대시보드 패딩 | `p-4 md:p-6` |

---

## 반응형 브레이크포인트

| 화면 크기 | 너비 | 그리드 열 수 | Tailwind prefix |
|-----------|------|------------|----------------|
| 모바일 | 360px ~ 767px | 1열 | (기본) |
| 태블릿 | 768px ~ 1023px | 2열 | `md:` |
| 데스크톱 | 1024px~ | 3열 | `lg:` |

---

## 신호등 컴포넌트 크기

| 크기 | 용도 | Tailwind 클래스 |
|------|------|----------------|
| sm | 범례 등 소형 | `w-4 h-4` |
| md | 상태 선택 버튼 내 | `w-8 h-8` |
| lg | 카드 메인 아이콘 | `w-12 h-12` |

---

## 버튼 스타일

### 상태 선택 버튼 (StatusSelector)

```
공통: rounded-lg px-4 py-3 text-white font-medium min-h-[44px] w-full transition-colors
가용: bg-blue-600 hover:bg-blue-700
불가용: bg-red-600 hover:bg-red-700
연락필요: bg-gray-500 hover:bg-gray-600
비활성(선택됨): ring-2 ring-offset-2 ring-[해당 색상]
```

### 일반 버튼

```
주요 액션: bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2
보조 액션: bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2
위험 액션: bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2
```

### 입력 필드 (Input)

```
공통: w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400
포커스: focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
비활성: disabled:bg-gray-100 disabled:cursor-not-allowed
```

> **모바일 가독성**: 입력 텍스트는 반드시 `text-gray-900` (검정)으로 표시. 회색 텍스트는 placeholder에만 사용 (`placeholder:text-gray-400`).

---

## 카드 컴포넌트 완성 예시

```
┌─────────────────────────────┐
│  ⬤ (신호등, 48×48px)  이니셜  │  ← flex row, items-center, gap-3
│                   [지연 배지] │
│  차량번호                    │
│  복귀 예정: 14:30            │
│  남은 시간: 23분             │
└─────────────────────────────┘
```

---

## 범례 (대시보드 하단)

```
⬤ 가용(Available)  ⬤ 불가용(Unavailable)  ⬤ 연락필요(Contact)
blue-600           red-600                gray-500
```
