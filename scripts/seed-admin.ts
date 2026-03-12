/**
 * 최초 admin 계정 시드 스크립트
 *
 * 용도: 최초 배포 후 1회 실행하여 admin 계정 생성
 * 실행: npx tsx scripts/seed-admin.ts
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ADMIN_EMAIL
 *   SEED_ADMIN_PASSWORD
 *   SEED_ADMIN_NAME      (선택, 기본값: '관리자')
 *   SEED_ADMIN_INITIAL   (선택, 기본값: 'ADM')
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// .env.local 로드
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? '관리자'
const ADMIN_INITIAL = process.env.SEED_ADMIN_INITIAL ?? 'ADM'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ 필수 환경변수가 누락되었습니다:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,')
  console.error('  SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedAdmin() {
  console.log(`🌱 Admin 계정 생성 시작: ${ADMIN_EMAIL}`)

  // 이미 존재하는지 확인
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users.find(u => u.email === ADMIN_EMAIL)

  if (existing) {
    console.log('⚠️  이미 존재하는 이메일입니다. profiles 테이블 업데이트만 진행합니다.')

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin', name: ADMIN_NAME, initial: ADMIN_INITIAL })
      .eq('id', existing.id)

    if (error) {
      console.error('❌ profiles 업데이트 실패:', error.message)
      process.exit(1)
    }

    console.log('✅ Admin 역할 업데이트 완료')
    return
  }

  // 신규 계정 생성
  const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: ADMIN_NAME,
      initial: ADMIN_INITIAL,
      role: 'admin',
    },
  })

  if (createError || !authUser.user) {
    console.error('❌ Auth 계정 생성 실패:', createError?.message)
    process.exit(1)
  }

  console.log(`✅ Auth 계정 생성 완료: ${authUser.user.id}`)

  // profiles 레코드 업데이트 (트리거가 기본값으로 생성하므로 role 업데이트)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin', name: ADMIN_NAME, initial: ADMIN_INITIAL })
    .eq('id', authUser.user.id)

  if (profileError) {
    console.error('❌ profiles 업데이트 실패:', profileError.message)
    console.error('   수동으로 Supabase 대시보드에서 role을 admin으로 변경해주세요.')
    process.exit(1)
  }

  console.log('✅ Admin 계정 생성 완료!')
  console.log(`   이메일: ${ADMIN_EMAIL}`)
  console.log(`   이름: ${ADMIN_NAME} (${ADMIN_INITIAL})`)
  console.log('   역할: admin')
  console.log('')
  console.log('⚠️  보안: 환경변수에서 SEED_ADMIN_PASSWORD를 제거하거나')
  console.log('   첫 로그인 후 즉시 비밀번호를 변경하세요.')
}

seedAdmin().catch(console.error)
