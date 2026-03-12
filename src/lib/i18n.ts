'use client'

export const messages = {
  en: {
    // Status
    available: 'Available',
    unavailable: 'Unavailable',
    contact: 'Contact needed',
    // Dashboard
    dashboard: 'Dashboard',
    driverStatus: 'Driver Status',
    lastUpdated: 'Last updated',
    returnTime: 'Return time',
    countdown: 'Time remaining',
    delayed: 'Overdue',
    legend: 'Legend',
    noDrivers: 'No drivers found.',
    // Driver page
    myStatus: 'My Status',
    currentStatus: 'Current Status',
    vehicleNumber: 'Vehicle Number',
    vehicleNumberPlaceholder: 'e.g. 12가3456',
    returnDateTime: 'Expected Return Time',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    // Admin page
    adminPanel: 'Admin Panel',
    userManagement: 'User Management',
    addUser: 'Add User',
    editUser: 'Edit User',
    deleteUser: 'Delete User',
    resetPassword: 'Reset Password',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    initial: 'Initial',
    sortOrder: 'Sort Order',
    actions: 'Actions',
    // Roles
    admin: 'Admin',
    driver: 'Driver',
    viewer: 'Viewer',
    // Auth
    login: 'Log In',
    logout: 'Log Out',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    loginError: 'Login failed. Please check your credentials.',
    // Settings
    language: 'Language',
    siteLanguage: 'Site Language',
    english: 'English',
    korean: '한국어',
    // Common
    cancel: 'Cancel',
    confirm: 'Confirm',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    error: 'An error occurred.',
    required: 'Required',
    // Errors
    saveError: 'Failed to save. Please try again.',
    returnTimeRequired: 'Return time is required when status is Unavailable.',
    returnTimePast: 'Return time must be in the future.',
    statusUpdated: 'Status updated',
    changeStatus: 'Change Status',
  },
  ko: {
    // Status
    available: '가용',
    unavailable: '불가용',
    contact: '연락필요',
    // Dashboard
    dashboard: '대시보드',
    driverStatus: '기사 현황',
    lastUpdated: '최종 변경',
    returnTime: '복귀 예정',
    countdown: '남은 시간',
    delayed: '복귀 지연',
    legend: '범례',
    noDrivers: '등록된 기사가 없습니다.',
    // Driver page
    myStatus: '내 상태',
    currentStatus: '현재 상태',
    vehicleNumber: '차량번호',
    vehicleNumberPlaceholder: '예) 12가3456',
    returnDateTime: '복귀 예정 날짜·시간',
    save: '저장',
    saving: '저장 중...',
    saved: '저장됨',
    // Admin page
    adminPanel: '관리자 패널',
    userManagement: '사용자 관리',
    addUser: '사용자 추가',
    editUser: '사용자 편집',
    deleteUser: '사용자 삭제',
    resetPassword: '비밀번호 초기화',
    name: '이름',
    email: '이메일',
    role: '역할',
    initial: '이니셜',
    sortOrder: '정렬 순서',
    actions: '작업',
    // Roles
    admin: '관리자',
    driver: '기사',
    viewer: '비서',
    // Auth
    login: '로그인',
    logout: '로그아웃',
    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    loginError: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
    // Settings
    language: '언어',
    siteLanguage: '사이트 언어',
    english: 'English',
    korean: '한국어',
    // Common
    cancel: '취소',
    confirm: '확인',
    edit: '편집',
    close: '닫기',
    loading: '로딩 중...',
    error: '오류가 발생했습니다.',
    required: '필수',
    // Errors
    saveError: '저장에 실패했습니다. 다시 시도해주세요.',
    returnTimeRequired: '불가용 상태에서는 복귀 예정시간이 필수입니다.',
    returnTimePast: '복귀 예정시간은 현재 시간 이후여야 합니다.',
    statusUpdated: '상태 변경 완료',
    changeStatus: '상태 변경',
  },
} as const

export type Lang = keyof typeof messages
export type MessageKey = keyof typeof messages.en

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('site_language') as Lang) ?? 'en'
}

export function setLang(lang: Lang): void {
  localStorage.setItem('site_language', lang)
}

export function t(key: MessageKey, lang?: Lang): string {
  const l = lang ?? getLang()
  return messages[l][key]
}

// React hook — 클라이언트 컴포넌트에서 사용
export function useLang() {
  return (key: MessageKey) => t(key)
}
